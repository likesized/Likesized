-- Replace the abandoned external-import intake with the owner-locked community catalog.
-- Applied external-provider migrations remain in history; this migration removes their active objects.
-- Also adds optional community enrichment fields and seeds the initial 150-product starter catalog.

-- Retire external catalog provider runtime objects without erasing applied migration history.
drop function if exists public.record_catalog_source_selection(uuid,text,text,text,text,jsonb);
drop function if exists public.reserve_catalog_import_request(text);
drop function if exists public.get_catalog_import_provider_alerts();
drop table if exists private.catalog_source_records cascade;
drop table if exists private.catalog_import_provider_alerts cascade;
drop table if exists private.catalog_import_requests cascade;
drop table if exists private.catalog_import_provider_usage cascade;
drop table if exists private.catalog_import_providers cascade;

-- Controlled optional Department. "Not sure" is a UI no-claim choice, not stored.
create table if not exists public.product_departments (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  label text not null unique,
  sort_order integer not null
);
insert into public.product_departments(key,label,sort_order) values
  ('womens','Women''s',10),
  ('mens','Men''s',20),
  ('unisex','Unisex',30),
  ('girls','Girls''',40),
  ('boys','Boys''',50),
  ('kids_unisex','Kids / Unisex',60),
  ('baby_toddler','Baby / Toddler',70)
on conflict(key) do update set label=excluded.label,sort_order=excluded.sort_order;
alter table public.product_departments enable row level security;
drop policy if exists "product departments readable" on public.product_departments;
create policy "product departments readable" on public.product_departments for select to anon,authenticated using(true);
grant select on public.product_departments to anon,authenticated;

alter table public.products add column if not exists department_key text references public.product_departments(key);

-- Add owner-approved controlled material values used by optional community composition entry.
insert into public.materials(key,label) values
  ('organic_cotton','Organic Cotton'),
  ('recycled_polyester','Recycled Polyester'),
  ('recycled_nylon','Recycled Nylon'),
  ('merino_wool','Merino Wool'),
  ('synthetic_leather','Synthetic Leather')
on conflict(key) do update set label=excluded.label;

-- Department participates in the existing metadata-evidence system rather than a second graph.
alter table public.product_metadata_evidence drop constraint if exists product_metadata_evidence_field_key_check;
alter table public.product_metadata_evidence add constraint product_metadata_evidence_field_key_check
  check(field_key in ('garment_type','market_segment','department'));

create or replace function private.apply_product_metadata_evidence()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_current text;
  v_status public.product_data_status;
  v_type_agree integer:=0;
  v_segment_agree integer:=0;
  v_conflict integer:=0;
begin
  select catalog_status into v_status from public.products where id=new.product_id;
  if new.field_key='garment_type' then
    select garment_type_key into v_current from public.products where id=new.product_id;
  elsif new.field_key='market_segment' then
    select market_segment::text into v_current from public.products where id=new.product_id;
  elsif new.field_key='department' then
    select department_key into v_current from public.products where id=new.product_id;
  else
    return new;
  end if;

  if new.source_status='rejected'::public.product_data_status then return new; end if;

  if new.source_type in ('manufacturer'::public.product_data_source,'retailer'::public.product_data_source,'barcode_catalog'::public.product_data_source,'admin'::public.product_data_source,'system'::public.product_data_source)
     and new.source_status='verified'::public.product_data_status then
    if new.field_key='department' then
      update public.products set department_key=new.value_text where id=new.product_id;
    elsif v_current is distinct from new.value_text then
      update public.products set catalog_review_needed=true where id=new.product_id;
    elsif v_status<>'verified'::public.product_data_status then
      update public.products set catalog_status='verified'::public.product_data_status where id=new.product_id;
    end if;
    return new;
  end if;

  if new.field_key='department' then
    if v_current is null then
      update public.products set department_key=new.value_text where id=new.product_id;
    elsif v_current is distinct from new.value_text then
      update public.products set catalog_review_needed=true where id=new.product_id;
    end if;
    return new;
  end if;

  if v_current is distinct from new.value_text then
    update public.products set catalog_review_needed=true where id=new.product_id;
    return new;
  end if;

  select count(distinct e.submitted_by) into v_type_agree
  from public.product_metadata_evidence e join public.products p on p.id=e.product_id
  where e.product_id=new.product_id and e.field_key='garment_type' and e.value_text=p.garment_type_key
    and e.source_type='member'::public.product_data_source and e.source_status<>'rejected'::public.product_data_status;
  select count(distinct e.submitted_by) into v_segment_agree
  from public.product_metadata_evidence e join public.products p on p.id=e.product_id
  where e.product_id=new.product_id and e.field_key='market_segment' and e.value_text=p.market_segment::text
    and e.source_type='member'::public.product_data_source and e.source_status<>'rejected'::public.product_data_status;
  select count(*) into v_conflict
  from public.product_metadata_evidence e join public.products p on p.id=e.product_id
  where e.product_id=new.product_id and e.source_type='member'::public.product_data_source and e.source_status<>'rejected'::public.product_data_status
    and ((e.field_key='garment_type' and e.value_text is distinct from p.garment_type_key)
      or (e.field_key='market_segment' and e.value_text is distinct from p.market_segment::text));

  if v_conflict>0 then update public.products set catalog_review_needed=true where id=new.product_id; end if;
  if v_type_agree>=2 and v_segment_agree>=2 and v_conflict=0 and v_status='provisional'::public.product_data_status then
    update public.products set catalog_status='corroborated'::public.product_data_status where id=new.product_id;
  end if;
  return new;
end;
$$;
revoke all on function private.apply_product_metadata_evidence() from public,anon,authenticated;

drop function if exists public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text);
create function public.record_member_product_evidence(
  p_product_id uuid,
  p_garment_type text,
  p_market_segment text,
  p_attributes jsonb default '[]'::jsonb,
  p_materials jsonb default '[]'::jsonb,
  p_department text default null,
  p_source_reference text default null
) returns void
language plpgsql security invoker set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_row jsonb;
  v_attribute_key text;
  v_option_key text;
  v_material_key text;
  v_percentage numeric;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.products where id=p_product_id) then raise exception 'Unknown Product'; end if;
  if p_department is not null and not exists(select 1 from public.product_departments where key=p_department) then raise exception 'Unknown Department'; end if;

  insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,'garment_type',p_garment_type,'member','provisional',.55,p_source_reference,v_user_id)
  on conflict(product_id,field_key,submitted_by) where submitted_by is not null do nothing;
  insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,'market_segment',p_market_segment,'member','provisional',.55,p_source_reference,v_user_id)
  on conflict(product_id,field_key,submitted_by) where submitted_by is not null do nothing;
  if p_department is not null then
    insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,'department',p_department,'member','provisional',.55,p_source_reference,v_user_id)
    on conflict(product_id,field_key,submitted_by) where submitted_by is not null do nothing;
  end if;

  for v_row in select value from jsonb_array_elements(coalesce(p_attributes,'[]'::jsonb)) loop
    v_attribute_key:=nullif(btrim(v_row->>'attribute_key'),'');
    v_option_key:=nullif(btrim(v_row->>'option_key'),'');
    if v_attribute_key is null or v_option_key is null then raise exception 'Invalid product attribute evidence'; end if;
    insert into public.product_attribute_evidence(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,v_attribute_key,v_option_key,'member','provisional',.55,p_source_reference,v_user_id)
    on conflict(product_id,attribute_key,submitted_by) where submitted_by is not null do nothing;
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_materials,'[]'::jsonb)) loop
    v_material_key:=nullif(btrim(v_row->>'material_key'),'');
    v_percentage:=case when nullif(btrim(v_row->>'percentage'),'') is null then null else (v_row->>'percentage')::numeric end;
    if v_material_key is null or (v_percentage is not null and (v_percentage<0 or v_percentage>100)) then raise exception 'Invalid product material evidence'; end if;
    insert into public.product_material_evidence(product_id,material_key,percentage,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,v_material_key,v_percentage,'member','provisional',.55,p_source_reference,v_user_id)
    on conflict(product_id,material_key,submitted_by) where submitted_by is not null do nothing;
  end loop;
end;
$$;
revoke all on function public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text,text) from public,anon;
grant execute on function public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text,text) to authenticated;

-- Community product-photo evidence. Product images are shared catalog content, separate from Fit Photos.
create table if not exists public.product_photo_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  source_status public.product_data_status not null default 'provisional',
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists product_photo_evidence_product_idx on public.product_photo_evidence(product_id,created_at desc);
alter table public.product_photo_evidence enable row level security;
drop policy if exists "Members read product photos" on public.product_photo_evidence;
drop policy if exists "Members add own product photos" on public.product_photo_evidence;
create policy "Members read product photos" on public.product_photo_evidence for select to authenticated using(true);
create policy "Members add own product photos" on public.product_photo_evidence for insert to authenticated
with check(submitted_by=(select auth.uid()) and source_status='provisional'::public.product_data_status);
grant select,insert on public.product_photo_evidence to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-photos','product-photos',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Members upload product photos" on storage.objects;
create policy "Members upload product photos" on storage.objects for insert to authenticated
with check(bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Admins delete product photos" on storage.objects;
create policy "Admins delete product photos" on storage.objects for delete to authenticated
using(bucket_id='product-photos' and private.is_admin());

-- Seed the owner-approved starter catalog lightly: Brand + Item/Model + Garment Type only.
-- No colors, sizes, materials, departments, attributes, or identifiers are guessed.
create temporary table community_seed_products(brand_name text,item_name text,garment_type_key text) on commit drop;
insert into community_seed_products(brand_name,item_name,garment_type_key) values
  ('Levi''s','501 Original','jeans'),
  ('Wrangler','Cowboy Cut','jeans'),
  ('Lee','Rider','jeans'),
  ('American Eagle','Dreamy Drape','jeans'),
  ('Abercrombie & Fitch','Ultra Barrel','jeans'),
  ('Madewell','Perfect Vintage','jeans'),
  ('Gap','Stride','jeans'),
  ('Good American','Good Legs','jeans'),
  ('AGOLDE','Low Curve','jeans'),
  ('PAIGE','Anessa','jeans'),
  ('Citizens of Humanity','Ayla','jeans'),
  ('FRAME','Le Slim Palazzo','jeans'),
  ('Lucky Brand','223 Straight','jeans'),
  ('Old Navy','Wow Jeans','jeans'),
  ('Hollister','Baggy Jeans','jeans'),
  ('Levi''s','XX Chino','chinos'),
  ('Dockers','Ultimate Chino','chinos'),
  ('J.Crew','770 Chino','chinos'),
  ('Bonobos','Stretch Washed Chino','chinos'),
  ('Gap','GapFlex Essential Khaki','chinos'),
  ('Everlane','Performance Chino','chinos'),
  ('Old Navy','Ultimate Tech Chino','chinos'),
  ('lululemon','ABC Trouser','trousers'),
  ('Banana Republic','Traveler Pant','trousers'),
  ('Uniqlo','Smart Ankle Pants','trousers'),
  ('Vuori','Meta Pant','trousers'),
  ('Rhone','Commuter Pant','trousers'),
  ('Dickies','874 Work Pant','trousers'),
  ('Carhartt','Rugged Flex Pant','trousers'),
  ('Abercrombie & Fitch','90s Relaxed Trouser','trousers'),
  ('Nike','Primary Tee','t_shirt'),
  ('adidas','Trefoil Essentials Tee','t_shirt'),
  ('lululemon','Everyday Cotton-Blend T-Shirt','t_shirt'),
  ('Uniqlo','AIRism Cotton T-Shirt','t_shirt'),
  ('Vuori','Strato Tech Tee','t_shirt'),
  ('Rhone','Reign Tee','t_shirt'),
  ('Abercrombie & Fitch','Premium Heavyweight Tee','t_shirt'),
  ('Gap','Heavyweight T-Shirt','t_shirt'),
  ('Old Navy','Soft-Washed T-Shirt','t_shirt'),
  ('Carhartt','K87 Heavyweight T-Shirt','t_shirt'),
  ('Patagonia','Capilene Cool Daily Shirt','t_shirt'),
  ('American Eagle','Super Soft T-Shirt','t_shirt'),
  ('Everlane','Premium-Weight Crew','t_shirt'),
  ('Aritzia','Homestretch T-Shirt','t_shirt'),
  ('SKIMS','Fits Everybody T-Shirt','t_shirt'),
  ('Nike','Club Fleece Hoodie','hoodie'),
  ('adidas','Z.N.E. Hoodie','hoodie'),
  ('lululemon','Steady State Hoodie','hoodie'),
  ('Aritzia','Cozy Fleece Hoodie','hoodie'),
  ('Alo Yoga','Accolade Hoodie','hoodie'),
  ('SKIMS','Cotton Fleece Hoodie','hoodie'),
  ('Abercrombie & Fitch','Essential Popover Hoodie','hoodie'),
  ('Gap','VintageSoft Hoodie','hoodie'),
  ('Old Navy','Dynamic Fleece Hoodie','hoodie'),
  ('Champion','Reverse Weave Hoodie','hoodie'),
  ('Carhartt','Rain Defender Hoodie','hoodie'),
  ('Uniqlo','Sweat Pullover Hoodie','hoodie'),
  ('Vuori','Coronado Hoodie','hoodie'),
  ('American Eagle','Super Soft Hoodie','hoodie'),
  ('Under Armour','Rival Fleece Hoodie','hoodie'),
  ('J.Crew','Secret Wash Shirt','casual_button_down'),
  ('Ralph Lauren','Oxford Shirt','casual_button_down'),
  ('Brooks Brothers','Original Polo Button-Down Oxford','casual_button_down'),
  ('Abercrombie & Fitch','Linen-Blend Button-Up','casual_button_down'),
  ('Gap','Oxford Shirt','casual_button_down'),
  ('Madewell','Oversized Button-Up Shirt','casual_button_down'),
  ('Everlane','Silky Cotton Relaxed Shirt','casual_button_down'),
  ('Uniqlo','Oxford Shirt','casual_button_down'),
  ('American Eagle','Button-Up Shirt','casual_button_down'),
  ('Wrangler','Western Snap Shirt','casual_button_down'),
  ('Banana Republic','Dress Shirt','dress_shirt'),
  ('Free People','We The Free Button-Down','blouse'),
  ('Anthropologie','Maeve Button-Down Shirt','blouse'),
  ('PAIGE','Button-Down Shirt','blouse'),
  ('Carhartt','Rugged Flex Shirt','work_shirt'),
  ('The North Face','Nuptse Jacket','jacket_coat'),
  ('Patagonia','Nano Puff Jacket','jacket_coat'),
  ('Columbia','Powder Lite Jacket','jacket_coat'),
  ('Arc''teryx','Beta Jacket','jacket_coat'),
  ('Carhartt','Detroit Jacket','jacket_coat'),
  ('Levi''s','Trucker Jacket','jacket_coat'),
  ('Alpha Industries','MA-1 Bomber','jacket_coat'),
  ('Barbour','Bedale Jacket','jacket_coat'),
  ('Uniqlo','PUFFTECH Jacket','jacket_coat'),
  ('lululemon','Wunder Puff','jacket_coat'),
  ('Nike','Windrunner Jacket','jacket_coat'),
  ('adidas','Terrex Jacket','jacket_coat'),
  ('Abercrombie & Fitch','Chore Jacket','jacket_coat'),
  ('Gap','Bomber Jacket','jacket_coat'),
  ('Dickies','Eisenhower Jacket','jacket_coat'),
  ('lululemon','Pace Breaker Short','shorts'),
  ('Vuori','Kore Short','shorts'),
  ('Nike','Primary Dri-FIT Short','shorts'),
  ('adidas','Z.N.E. Short','shorts'),
  ('Patagonia','Baggies Shorts','shorts'),
  ('Rhone','Mako Short','shorts'),
  ('Gymshark','Arrival Short','shorts'),
  ('Under Armour','Vanish Woven Short','shorts'),
  ('Alo Yoga','Performance Short','shorts'),
  ('Fabletics','The One Short','shorts'),
  ('Old Navy','StretchTech Short','shorts'),
  ('Abercrombie & Fitch','Saturday Short','shorts'),
  ('American Eagle','AirFlex+ Short','shorts'),
  ('Carhartt','Rugged Flex Short','shorts'),
  ('Columbia','Silver Ridge Short','shorts'),
  ('Abercrombie & Fitch','Giselle Dress','dress'),
  ('Reformation','Tagliatelle Dress','dress'),
  ('Aritzia','Wilfred Dress','dress'),
  ('Free People','Oasis Midi Dress','dress'),
  ('Anthropologie','Somerset Maxi Dress','dress'),
  ('Hill House Home','Ellie Nap Dress','dress'),
  ('House of CB','Carmen Dress','dress'),
  ('SKIMS','Soft Lounge Long Slip Dress','dress'),
  ('J.Crew','Gwyneth Slip Dress','dress'),
  ('Banana Republic','Maxi Dress','dress'),
  ('Madewell','Seamed Midi Dress','dress'),
  ('Gap','Linen-Blend Midi Dress','dress'),
  ('Old Navy','Fit & Flare Dress','dress'),
  ('Zara','Midi Dress','dress'),
  ('H&M','A-Line Dress','dress'),
  ('Nike','Pegasus 42','sneakers'),
  ('adidas','Supernova Rise 3','sneakers'),
  ('New Balance','Fresh Foam X 1080v15','sneakers'),
  ('ASICS','GEL-NIMBUS 28','sneakers'),
  ('Brooks','Ghost 17','sneakers'),
  ('HOKA','Clifton 10','sneakers'),
  ('On','Cloud 6','sneakers'),
  ('Saucony','Endorphin Speed 5','sneakers'),
  ('Puma','Velocity NITRO','sneakers'),
  ('Under Armour','Halo Runner','sneakers'),
  ('Converse','Chuck 70','sneakers'),
  ('Vans','Old Skool','sneakers'),
  ('Reebok','FloatZig','sneakers'),
  ('Salomon','XT-6','sneakers'),
  ('Skechers','Aero','sneakers'),
  ('Timberland','Premium 6-Inch Boot','boots'),
  ('Dr. Martens','1460','boots'),
  ('Blundstone','585','boots'),
  ('Red Wing','Iron Ranger','boots'),
  ('Wolverine','1000 Mile','boots'),
  ('Ariat','WorkHog','boots'),
  ('Tecovas','Cartwright','boots'),
  ('Danner','Mountain 600','boots'),
  ('Thorogood','American Heritage','boots'),
  ('Thursday Boot Company','Captain','boots'),
  ('UGG','Classic Mini','boots'),
  ('Sorel','Caribou','boots'),
  ('Justin Boots','Bent Rail','boots'),
  ('Lucchese','Classic Western Boot','boots'),
  ('Carhartt','Wedge Boot','boots');

insert into public.brands(name,slug,normalized_name)
select distinct s.brand_name,
  trim(both '-' from regexp_replace(lower(s.brand_name),'[^a-z0-9]+','-','g')),
  public.normalize_search_text(s.brand_name)
from community_seed_products s
on conflict(normalized_name) do nothing;

insert into public.product_families(brand_id,name,normalized_name,garment_type_key,market_segment)
select b.id,s.item_name,public.normalize_search_text(s.item_name),s.garment_type_key,'unknown'::public.garment_market_segment
from community_seed_products s
join public.brands b on b.normalized_name=public.normalize_search_text(s.brand_name)
on conflict(brand_id,normalized_name,garment_type_key,market_segment) do nothing;

insert into public.products(brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment,catalog_status,catalog_review_needed)
select b.id,s.item_name,
  left(trim(both '-' from regexp_replace(lower(b.name||'-'||s.item_name||'-unknown'),'[^a-z0-9]+','-','g')),140),
  gt.category,
  public.normalize_search_text(s.item_name),
  pf.id,
  s.garment_type_key,
  'unknown'::public.garment_market_segment,
  'provisional'::public.product_data_status,
  false
from community_seed_products s
join public.brands b on b.normalized_name=public.normalize_search_text(s.brand_name)
join public.garment_types gt on gt.key=s.garment_type_key
join public.product_families pf on pf.brand_id=b.id and pf.normalized_name=public.normalize_search_text(s.item_name)
  and pf.garment_type_key=s.garment_type_key and pf.market_segment='unknown'::public.garment_market_segment
on conflict do nothing;

comment on table public.product_departments is 'Optional controlled community-sourced Department. Blank/Not sure is no evidence.';
comment on table public.product_photo_evidence is 'Community-submitted product-only photos. Separate from personal Fit Photos and subject to admin moderation.';
