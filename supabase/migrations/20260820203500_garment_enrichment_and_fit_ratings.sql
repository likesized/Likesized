-- LikeSized canonical migration: garment enrichment provenance + separate Fit Rating
-- Product facts become progressively trustworthy without allowing one member submission
-- to silently become verified catalog truth. Fit Rating is satisfaction (1-5), separate
-- from physical Fit Result and from garment-specific body Match percentage.

create type public.product_data_source as enum (
  'system','manufacturer','retailer','barcode_catalog','member','admin'
);
create type public.product_data_status as enum (
  'provisional','corroborated','verified','rejected'
);

alter table public.fit_reports
  add column fit_rating smallint check (fit_rating between 1 and 5);
create index fit_reports_product_rating_idx
  on public.fit_reports(product_id,fit_rating)
  where fit_rating is not null;

alter table public.products
  add column catalog_status public.product_data_status not null default 'verified',
  add column catalog_review_needed boolean not null default false;

alter table public.product_attribute_values
  add column source_type public.product_data_source not null default 'system',
  add column source_status public.product_data_status not null default 'verified',
  add column confidence numeric(5,4) not null default 1 check(confidence between 0 and 1),
  add column source_reference text,
  add column updated_at timestamptz not null default now();

alter table public.product_materials
  add column source_type public.product_data_source not null default 'system',
  add column source_status public.product_data_status not null default 'verified',
  add column confidence numeric(5,4) not null default 1 check(confidence between 0 and 1),
  add column source_reference text,
  add column updated_at timestamptz not null default now();

-- Extend the controlled fiber catalog so care-label composition is not forced into a
-- generic Other bucket. Composition remains separate from construction and stretch.
insert into public.materials(key,label) values
  ('cashmere','Cashmere'),
  ('silk','Silk'),
  ('modal_lyocell','Modal / Lyocell / Tencel'),
  ('acrylic','Acrylic'),
  ('suede','Suede'),
  ('fleece','Fleece'),
  ('canvas','Canvas')
on conflict(key) do update set label=excluded.label;

create table public.product_metadata_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  field_key text not null check(field_key in ('garment_type','market_segment')),
  value_text text not null check(length(btrim(value_text)) between 1 and 120),
  source_type public.product_data_source not null,
  source_status public.product_data_status not null default 'provisional',
  confidence numeric(5,4) not null default .55 check(confidence between 0 and 1),
  source_reference text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index product_metadata_evidence_product_idx on public.product_metadata_evidence(product_id,field_key,created_at desc);
create unique index product_metadata_evidence_member_uq on public.product_metadata_evidence(product_id,field_key,submitted_by) where submitted_by is not null;

create table public.product_attribute_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_key text not null,
  option_key text not null,
  source_type public.product_data_source not null,
  source_status public.product_data_status not null default 'provisional',
  confidence numeric(5,4) not null default .55 check(confidence between 0 and 1),
  source_reference text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key(attribute_key,option_key) references public.garment_attribute_options(attribute_key,option_key)
);
create index product_attribute_evidence_product_idx on public.product_attribute_evidence(product_id,attribute_key,option_key,created_at desc);
create unique index product_attribute_evidence_member_uq on public.product_attribute_evidence(product_id,attribute_key,submitted_by) where submitted_by is not null;

create table public.product_material_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  material_key text not null references public.materials(key),
  percentage numeric(5,2) check(percentage is null or (percentage >= 0 and percentage <= 100)),
  source_type public.product_data_source not null,
  source_status public.product_data_status not null default 'provisional',
  confidence numeric(5,4) not null default .55 check(confidence between 0 and 1),
  source_reference text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index product_material_evidence_product_idx on public.product_material_evidence(product_id,material_key,created_at desc);
create unique index product_material_evidence_member_uq on public.product_material_evidence(product_id,material_key,submitted_by) where submitted_by is not null;

-- Member catalog evidence is intentionally narrow: members may submit only their own
-- provisional observations. Trusted/verified evidence is reserved for service/admin paths.
alter table public.product_metadata_evidence enable row level security;
alter table public.product_attribute_evidence enable row level security;
alter table public.product_material_evidence enable row level security;

create policy "members read product metadata evidence" on public.product_metadata_evidence for select to authenticated using(true);
create policy "members add own provisional product metadata" on public.product_metadata_evidence for insert to authenticated
with check(source_type='member'::public.product_data_source and source_status='provisional'::public.product_data_status and submitted_by=(select auth.uid()) and confidence<=.60);
create policy "members read product attribute evidence" on public.product_attribute_evidence for select to authenticated using(true);
create policy "members add own provisional product attributes" on public.product_attribute_evidence for insert to authenticated
with check(source_type='member'::public.product_data_source and source_status='provisional'::public.product_data_status and submitted_by=(select auth.uid()) and confidence<=.60);
create policy "members read product material evidence" on public.product_material_evidence for select to authenticated using(true);
create policy "members add own provisional product materials" on public.product_material_evidence for insert to authenticated
with check(source_type='member'::public.product_data_source and source_status='provisional'::public.product_data_status and submitted_by=(select auth.uid()) and confidence<=.60);

revoke all on public.product_metadata_evidence,public.product_attribute_evidence,public.product_material_evidence from anon,authenticated;
grant select,insert on public.product_metadata_evidence,public.product_attribute_evidence,public.product_material_evidence to authenticated;

-- Catalog classification evidence never rewrites a Product from one member assertion.
-- A provisional Product is promoted only after two distinct members agree on BOTH its
-- garment type and market segment with no conflicting member classification evidence.
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
  else
    select market_segment::text into v_current from public.products where id=new.product_id;
  end if;

  if new.source_status='rejected'::public.product_data_status then return new; end if;

  if new.source_type in ('manufacturer'::public.product_data_source,'retailer'::public.product_data_source,'barcode_catalog'::public.product_data_source,'admin'::public.product_data_source,'system'::public.product_data_source)
     and new.source_status='verified'::public.product_data_status then
    if v_current is distinct from new.value_text then
      update public.products set catalog_review_needed=true where id=new.product_id;
    elsif v_status<>'verified'::public.product_data_status then
      update public.products set catalog_status='verified'::public.product_data_status where id=new.product_id;
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
create trigger apply_product_metadata_evidence_after_insert after insert on public.product_metadata_evidence for each row execute function private.apply_product_metadata_evidence();

-- Controlled attributes are seeded softly from one member, promoted after independent
-- agreement, and never allowed to overwrite verified catalog data from a lone member.
create or replace function private.apply_product_attribute_evidence()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_existing public.product_attribute_values%rowtype;
  v_has_existing boolean:=false;
  v_agree integer;
  v_conflict integer;
begin
  if new.source_status='rejected'::public.product_data_status then return new; end if;

  select * into v_existing from public.product_attribute_values
  where product_id=new.product_id and attribute_key=new.attribute_key;
  v_has_existing:=found;

  if new.source_type in ('manufacturer'::public.product_data_source,'retailer'::public.product_data_source,'barcode_catalog'::public.product_data_source,'admin'::public.product_data_source,'system'::public.product_data_source)
     and new.source_status='verified'::public.product_data_status then
    insert into public.product_attribute_values(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.attribute_key,new.option_key,new.source_type,'verified',greatest(new.confidence,.95),new.source_reference,now())
    on conflict(product_id,attribute_key) do update set option_key=excluded.option_key,source_type=excluded.source_type,source_status=excluded.source_status,confidence=excluded.confidence,source_reference=excluded.source_reference,updated_at=now();
    return new;
  end if;

  if v_has_existing and v_existing.source_status='verified'::public.product_data_status then
    if v_existing.option_key<>new.option_key then update public.products set catalog_review_needed=true where id=new.product_id; end if;
    return new;
  end if;

  select count(distinct submitted_by) into v_agree
  from public.product_attribute_evidence
  where product_id=new.product_id and attribute_key=new.attribute_key and option_key=new.option_key
    and source_type='member'::public.product_data_source and source_status<>'rejected'::public.product_data_status;
  select count(distinct submitted_by) into v_conflict
  from public.product_attribute_evidence
  where product_id=new.product_id and attribute_key=new.attribute_key and option_key<>new.option_key
    and source_type='member'::public.product_data_source and source_status<>'rejected'::public.product_data_status;

  if v_conflict>0 then update public.products set catalog_review_needed=true where id=new.product_id; end if;

  if v_agree>=2 and v_agree>v_conflict then
    insert into public.product_attribute_values(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.attribute_key,new.option_key,'member','corroborated',greatest(.80,new.confidence),new.source_reference,now())
    on conflict(product_id,attribute_key) do update set option_key=excluded.option_key,source_type=excluded.source_type,source_status=excluded.source_status,confidence=excluded.confidence,source_reference=excluded.source_reference,updated_at=now()
    where public.product_attribute_values.source_status<>'verified'::public.product_data_status;
  elsif not v_has_existing then
    insert into public.product_attribute_values(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.attribute_key,new.option_key,'member','provisional',least(new.confidence,.60),new.source_reference,now());
  elsif v_existing.option_key=new.option_key then
    update public.product_attribute_values set confidence=greatest(confidence,least(new.confidence,.60)),updated_at=now()
    where product_id=new.product_id and attribute_key=new.attribute_key and source_status='provisional'::public.product_data_status;
  end if;
  return new;
end;
$$;
revoke all on function private.apply_product_attribute_evidence() from public,anon,authenticated;
create trigger apply_product_attribute_evidence_after_insert after insert on public.product_attribute_evidence for each row execute function private.apply_product_attribute_evidence();

-- Composition is stored independently from knit/woven construction and stretch.
create or replace function private.apply_product_material_evidence()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_agree integer;
  v_avg numeric;
  v_existing public.product_materials%rowtype;
  v_has_existing boolean:=false;
begin
  if new.source_status='rejected'::public.product_data_status then return new; end if;
  select * into v_existing from public.product_materials where product_id=new.product_id and material_key=new.material_key;
  v_has_existing:=found;

  if new.source_type in ('manufacturer'::public.product_data_source,'retailer'::public.product_data_source,'barcode_catalog'::public.product_data_source,'admin'::public.product_data_source,'system'::public.product_data_source)
     and new.source_status='verified'::public.product_data_status then
    insert into public.product_materials(product_id,material_key,percentage,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.material_key,new.percentage,new.source_type,'verified',greatest(new.confidence,.95),new.source_reference,now())
    on conflict(product_id,material_key) do update set percentage=excluded.percentage,source_type=excluded.source_type,source_status=excluded.source_status,confidence=excluded.confidence,source_reference=excluded.source_reference,updated_at=now();
    return new;
  end if;

  if v_has_existing and v_existing.source_status='verified'::public.product_data_status then return new; end if;

  select count(distinct submitted_by),avg(percentage) into v_agree,v_avg
  from public.product_material_evidence
  where product_id=new.product_id and material_key=new.material_key
    and source_type='member'::public.product_data_source and source_status<>'rejected'::public.product_data_status;

  if v_agree>=2 then
    insert into public.product_materials(product_id,material_key,percentage,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.material_key,case when v_avg is null then null else round(v_avg,2) end,'member','corroborated',.80,new.source_reference,now())
    on conflict(product_id,material_key) do update set percentage=excluded.percentage,source_type=excluded.source_type,source_status=excluded.source_status,confidence=excluded.confidence,source_reference=excluded.source_reference,updated_at=now()
    where public.product_materials.source_status<>'verified'::public.product_data_status;
  elsif not v_has_existing then
    insert into public.product_materials(product_id,material_key,percentage,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.material_key,new.percentage,'member','provisional',least(new.confidence,.60),new.source_reference,now());
  end if;
  return new;
end;
$$;
revoke all on function private.apply_product_material_evidence() from public,anon,authenticated;
create trigger apply_product_material_evidence_after_insert after insert on public.product_material_evidence for each row execute function private.apply_product_material_evidence();

-- One authenticated RPC records the member's product facts atomically and ignores
-- repeat submissions from the same member/product field rather than counting them twice.
create or replace function public.record_member_product_evidence(
  p_product_id uuid,
  p_garment_type text,
  p_market_segment text,
  p_attributes jsonb default '[]'::jsonb,
  p_materials jsonb default '[]'::jsonb,
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

  insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,'garment_type',p_garment_type,'member','provisional',.55,p_source_reference,v_user_id)
  on conflict(product_id,field_key,submitted_by) where submitted_by is not null do nothing;
  insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,'market_segment',p_market_segment,'member','provisional',.55,p_source_reference,v_user_id)
  on conflict(product_id,field_key,submitted_by) where submitted_by is not null do nothing;

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
revoke all on function public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text) from public,anon;
grant execute on function public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text) to authenticated;

-- Exact known product resolution order for a new Closet log:
-- explicit canonical Product -> UPC/barcode -> exact normalized URL -> Brand+Style ID.
create or replace function public.resolve_catalog_product(
  p_existing_product_id uuid default null,
  p_brand_name text default null,
  p_style_number text default null,
  p_identifier text default null,
  p_normalized_url text default null
) returns uuid
language plpgsql security invoker set search_path=''
as $$
declare
  v_id uuid;
  v_identifier text:=case when p_identifier is null then null else public.normalize_identifier(p_identifier) end;
  v_brand text:=case when p_brand_name is null then null else public.normalize_search_text(p_brand_name) end;
  v_style text:=case when p_style_number is null then null else public.normalize_identifier(p_style_number) end;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_existing_product_id is not null and exists(select 1 from public.products where id=p_existing_product_id) then return p_existing_product_id; end if;

  if v_identifier ~ '^[0-9]{8}$|^[0-9]{12,14}$' then
    select coalesce(pi.product_id,pv.product_id) into v_id
    from public.product_identifiers pi
    left join public.product_variants pv on pv.id=pi.variant_id
    where pi.normalized_value=v_identifier and pi.identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
    limit 1;
    if v_id is not null then return v_id; end if;
  end if;

  if nullif(btrim(p_normalized_url),'') is not null then
    select product_id into v_id from public.retailer_listings where normalized_url=p_normalized_url limit 1;
    if v_id is not null then return v_id; end if;
  end if;

  if v_brand is not null and v_style is not null then
    select p.id into v_id
    from public.products p join public.brands b on b.id=p.brand_id
    where b.normalized_name=v_brand and p.manufacturer_style_normalized=v_style
    order by p.id limit 1;
    if v_id is not null then return v_id; end if;
  end if;
  return null;
end;
$$;
revoke all on function public.resolve_catalog_product(uuid,text,text,text,text) from public,anon;
grant execute on function public.resolve_catalog_product(uuid,text,text,text,text) to authenticated;

-- Provisional attributes are allowed to refine the target model, but only in proportion
-- to their evidence confidence. A provisional guess cannot fully remove a dimension.
create or replace function private.product_match_measurements(p_product_id uuid)
returns table(measurement_type_key text,weight numeric,coverage_weight numeric,tolerance numeric,minimum_shared_measurements integer,minimum_coverage numeric)
language sql security definer set search_path='' as $$
with target as (
  select p.id,p.garment_type_key,p.category,p.market_segment
  from public.products p where p.id=p_product_id
), base as (
  select gm.* from target t cross join lateral private.garment_match_measurements(t.garment_type_key) gm where t.garment_type_key is not null
  union all
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical),mp.minimum_shared_measurements::integer,mp.minimum_coverage
  from target t join public.match_profiles mp on mp.key=case t.category when 'tops' then 'tops_default' when 'bottoms' then 'bottoms_default' when 'dresses' then 'dresses_default' when 'shoes' then 'shoes' else 'overall' end
  join public.match_profile_measurements mpm on mpm.profile_key=mp.key join public.measurement_types mt on mt.key=mpm.measurement_type_key where t.garment_type_key is null
), meta as (
  select max(minimum_shared_measurements)::integer minimum_shared_measurements,max(minimum_coverage) minimum_coverage from base
), attribute_effects as (
  select pav.attribute_key,pav.option_key,
    case pav.source_status
      when 'verified'::public.product_data_status then 1::numeric
      when 'corroborated'::public.product_data_status then greatest(.80::numeric,pav.confidence)
      when 'provisional'::public.product_data_status then least(.60::numeric,pav.confidence)
      else 0::numeric end evidence_confidence
  from public.product_attribute_values pav where pav.product_id=p_product_id
), attr_rows as (
  select a.measurement_type_key,
    case when bool_or((1+(a.weight_multiplier-1)*ae.evidence_confidence)=0) then 0::numeric else exp(sum(ln(nullif(1+(a.weight_multiplier-1)*ae.evidence_confidence,0)))) end weight_multiplier,
    case when bool_or((1+(a.coverage_multiplier-1)*ae.evidence_confidence)=0) then 0::numeric else exp(sum(ln(nullif(1+(a.coverage_multiplier-1)*ae.evidence_confidence,0)))) end coverage_multiplier,
    exp(sum(ln(1+(a.tolerance_multiplier-1)*ae.evidence_confidence))) tolerance_multiplier,
    sum(a.extra_weight*ae.evidence_confidence) extra_weight,
    sum(a.extra_coverage_weight*ae.evidence_confidence) extra_coverage_weight
  from attribute_effects ae join public.garment_attribute_match_adjustments a on a.attribute_key=ae.attribute_key and a.option_key=ae.option_key
  where ae.evidence_confidence>0 group by a.measurement_type_key
), keys as (
  select measurement_type_key from base union select measurement_type_key from attr_rows where extra_weight>0 or extra_coverage_weight>0
), resolved as (
  select k.measurement_type_key,coalesce(b.weight,0)*coalesce(a.weight_multiplier,1)+coalesce(a.extra_weight,0) raw_weight,
    coalesce(b.coverage_weight,0)*coalesce(a.coverage_multiplier,1)+coalesce(a.extra_coverage_weight,0) raw_coverage,
    coalesce(b.tolerance,mt.default_tolerance_canonical)*coalesce(a.tolerance_multiplier,1) tolerance,
    m.minimum_shared_measurements,m.minimum_coverage,t.market_segment,t.garment_type_key
  from keys k cross join target t cross join meta m join public.measurement_types mt on mt.key=k.measurement_type_key
  left join base b on b.measurement_type_key=k.measurement_type_key left join attr_rows a on a.measurement_type_key=k.measurement_type_key
), contextual as (
  select measurement_type_key,
    case when garment_type_key<>'bras_intimate' and market_segment in ('mens','kids_youth') and measurement_type_key in ('full_bust','high_bust','underbust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when garment_type_key<>'bras_intimate' and market_segment='unisex' and measurement_type_key in ('bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when market_segment='unisex' and measurement_type_key='full_bust' then raw_weight*.70 else raw_weight end weight,
    case when garment_type_key<>'bras_intimate' and market_segment in ('mens','kids_youth') and measurement_type_key in ('full_bust','high_bust','underbust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric
      when garment_type_key<>'bras_intimate' and market_segment='unisex' and measurement_type_key in ('full_bust','bust_point_to_bust_point','shoulder_to_bust_point') then 0::numeric else raw_coverage end coverage_weight,
    tolerance,minimum_shared_measurements,minimum_coverage from resolved
)
select measurement_type_key,weight,coverage_weight,tolerance,minimum_shared_measurements,minimum_coverage from contextual where weight>0 or coverage_weight>0;
$$;
revoke all on function private.product_match_measurements(uuid) from public,anon,authenticated;

-- Preserve the evidence hierarchy, but Similar Garments requires corroborated/verified
-- construction data rather than a one-member provisional attribute coincidence.
create or replace function public.get_product_evidence_candidates(p_product_id uuid,p_variant_id uuid default null::uuid,p_result_limit integer default 200)
returns table(fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer)
language sql security invoker set search_path='' as $$
with target as (
 select p.*,case when p_variant_id is not null and exists(select 1 from public.product_variants pv where pv.id=p_variant_id and pv.product_id=p.id) then p_variant_id else null::uuid end target_variant_id from public.products p where p.id=p_product_id
), candidates as (
 select fr.id fit_report_id,fr.user_id,fr.closet_item_id,fr.product_id evidence_product_id,fr.variant_id evidence_variant_id,fr.fit_profile_version_id,fr.size_label original_size_label,fr.normalized_size_id,fr.fit,fr.would_buy_again,fr.created_at observed_at,ep.brand_id,ep.product_family_id,ep.garment_type_key,ep.category,
 (select count(*)::integer from public.product_attribute_values ta join public.product_attribute_values ea on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key
   where ta.product_id=p_product_id and ea.product_id=ep.id
     and ta.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
     and ea.source_status in ('corroborated'::public.product_data_status,'verified'::public.product_data_status)
     and ta.confidence>=.75 and ea.confidence>=.75) attribute_overlap,
 t.brand_id target_brand_id,t.product_family_id target_family_id,t.garment_type_key target_garment_type,t.category target_category,t.target_variant_id
 from public.fit_reports fr join public.products ep on ep.id=fr.product_id cross join target t
 where fr.product_id=p_product_id or (t.product_family_id is not null and ep.product_family_id=t.product_family_id) or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key) or ep.category=t.category
), scored as (
 select c.*,hm.match_score snapshot_match_score,hm.coverage_percent snapshot_coverage_percent,
 case when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level else 'category_fit'::public.evidence_level end resolved_evidence_level,
 case when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1 when c.evidence_product_id=p_product_id then 2 when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3 when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4 when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5 else 6 end resolved_evidence_rank
 from candidates c cross join lateral private.calculate_snapshot_match_for_product(c.fit_profile_version_id,p_product_id) hm
), one_per_person as (
 select s.*,row_number() over(partition by s.user_id order by s.resolved_evidence_rank,s.snapshot_match_score desc,s.snapshot_coverage_percent desc,s.attribute_overlap desc,s.observed_at desc,s.fit_report_id) person_rank from scored s
)
select r.fit_report_id,r.user_id,r.closet_item_id,r.evidence_product_id,r.evidence_variant_id,r.fit_profile_version_id,r.original_size_label,r.normalized_size_id,r.fit,r.would_buy_again,r.snapshot_match_score,r.snapshot_coverage_percent,r.resolved_evidence_level,r.resolved_evidence_rank,r.attribute_overlap
from one_per_person r where r.person_rank=1 and r.snapshot_match_score>0
order by r.resolved_evidence_rank,r.snapshot_match_score desc,r.snapshot_coverage_percent desc,r.attribute_overlap desc,r.fit_report_id
limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

-- Exact-product community summary. One latest Shared observation per unique wearer prevents
-- repeat logging from inflating either star ratings or the physical Fit Result distribution.
create or replace function public.get_product_fit_summary(p_product_id uuid)
returns table(average_rating numeric,rating_count integer,total_fit_count integer,too_small_count integer,snug_count integer,just_right_count integer,relaxed_count integer,too_big_count integer)
language sql security invoker set search_path='' as $$
with ranked as (
  select fr.fit_rating,fr.fit,row_number() over(partition by fr.user_id order by fr.created_at desc,fr.id desc) wearer_rank
  from public.fit_reports fr join public.closet_items ci on ci.id=fr.closet_item_id
  where fr.product_id=p_product_id and ci.visibility='shared'::public.closet_visibility
), latest as (select fit_rating,fit from ranked where wearer_rank=1)
select round(avg(fit_rating)::numeric,1),count(fit_rating)::integer,count(*)::integer,
  count(*) filter(where fit='too_small'::public.fit_rating)::integer,
  count(*) filter(where fit='snug'::public.fit_rating)::integer,
  count(*) filter(where fit='just_right'::public.fit_rating)::integer,
  count(*) filter(where fit='relaxed'::public.fit_rating)::integer,
  count(*) filter(where fit='too_big'::public.fit_rating)::integer
from latest;
$$;
revoke all on function public.get_product_fit_summary(uuid) from public,anon;
grant execute on function public.get_product_fit_summary(uuid) to authenticated;

comment on column public.fit_reports.fit_rating is 'Member satisfaction rating from 1-5. Separate from physical Fit Result and never used to alter body Match percentage.';
comment on column public.products.catalog_status is 'Trust state for canonical product classification. New member-created products are explicitly inserted as provisional by the app.';
comment on table public.product_metadata_evidence is 'Immutable source/provenance evidence for garment type and market segment.';
comment on table public.product_attribute_evidence is 'Immutable source/provenance evidence for controlled construction/fit attributes.';
comment on table public.product_material_evidence is 'Immutable source/provenance evidence for fiber/material composition; independent from construction and stretch.';
comment on function public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text) is 'Atomically records one member vote per product metadata field, controlled attribute and material without allowing duplicate votes.';
comment on function public.resolve_catalog_product(uuid,text,text,text,text) is 'Existing Product resolver: explicit Product, UPC/barcode, normalized listing URL, then Brand+Style ID.';
comment on function public.get_product_fit_summary(uuid) is 'Exact-product Shared community Fit Rating average and physical Fit Result distribution, latest observation per unique wearer.';
comment on function private.product_match_measurements(uuid) is 'Target-product anthropometric model with product-attribute effects confidence-softened by catalog provenance.';
comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is 'Unique-wearer historical fit evidence; Similar Garments requires corroborated/verified controlled attribute overlap.';
