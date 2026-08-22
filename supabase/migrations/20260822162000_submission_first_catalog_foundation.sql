-- Owner-locked submission-first catalog foundation.
-- Members may log unresolved garments without creating canonical Products.
-- Pending garment submissions aggregate into admin-reviewable catalog candidates.

alter table public.closet_items alter column product_id drop not null;
alter table public.fit_reports alter column product_id drop not null;

create table public.catalog_candidates (
  id uuid primary key default gen_random_uuid(),
  identity_key text not null unique,
  brand_text text not null,
  normalized_brand text not null,
  model_text text not null,
  normalized_model text not null,
  garment_type_key text not null references public.garment_types(key),
  department_key text references public.product_departments(key),
  status text not null default 'pending' check (status in ('pending','needs_enrichment','needs_review','merged')),
  resolved_product_id uuid references public.products(id) on delete set null,
  resolution_kind text check (resolution_kind is null or resolution_kind in ('existing_product','new_product')),
  submission_count integer not null default 0 check (submission_count >= 0),
  last_submitted_at timestamptz,
  last_researched_at timestamptz,
  source text not null default 'member' check (source in ('member','starter_seed','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index catalog_candidates_queue_idx on public.catalog_candidates(status,submission_count desc,last_submitted_at desc nulls last);
create index catalog_candidates_identity_idx on public.catalog_candidates(normalized_brand,normalized_model,garment_type_key);

create table public.garment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  closet_item_id uuid not null unique references public.closet_items(id) on delete cascade,
  fit_report_id uuid not null unique references public.fit_reports(id) on delete cascade,
  candidate_id uuid not null references public.catalog_candidates(id) on delete restrict,
  resolved_product_id uuid references public.products(id) on delete set null,
  brand_text text not null,
  normalized_brand text not null,
  model_text text not null,
  normalized_model text not null,
  garment_type_key text not null references public.garment_types(key),
  color_family_key text not null references public.color_families(key),
  normalized_size_id uuid not null references public.normalized_sizes(id),
  size_label text not null,
  identifier_type text check (identifier_type is null or identifier_type in ('upc','barcode')),
  identifier_value text,
  manufacturer_style_number text,
  retailer_url text,
  normalized_retailer_url text,
  department_key text references public.product_departments(key),
  attributes jsonb not null default '[]'::jsonb check (jsonb_typeof(attributes)='array'),
  materials jsonb not null default '[]'::jsonb check (jsonb_typeof(materials)='array'),
  product_photo_storage_path text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index garment_submissions_candidate_idx on public.garment_submissions(candidate_id,created_at desc);
create index garment_submissions_user_idx on public.garment_submissions(user_id,created_at desc);
create index garment_submissions_identifier_idx on public.garment_submissions(identifier_type,identifier_value) where identifier_value is not null;
create index garment_submissions_retailer_idx on public.garment_submissions(normalized_retailer_url) where normalized_retailer_url is not null;

create table public.catalog_review_flags (
  id uuid primary key default gen_random_uuid(),
  flag_type text not null check (flag_type in ('possible_duplicate','conflicting_product_fact','ambiguous_identity','reported_spam','retail_identifier_conflict')),
  candidate_id uuid references public.catalog_candidates(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  submission_id uuid references public.garment_submissions(id) on delete cascade,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  created_by uuid references public.profiles(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (candidate_id is not null or product_id is not null or submission_id is not null)
);
create index catalog_review_flags_open_idx on public.catalog_review_flags(status,flag_type,created_at);
create unique index catalog_review_flags_candidate_open_uq on public.catalog_review_flags(candidate_id,flag_type)
  where status='open' and candidate_id is not null and product_id is null;
create unique index catalog_review_flags_product_open_uq on public.catalog_review_flags(product_id,flag_type)
  where status='open' and product_id is not null and candidate_id is null;

create table public.catalog_resolution_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete restrict,
  candidate_id uuid references public.catalog_candidates(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  action text not null check (action in ('map_existing','create_product','dismiss_flag','mark_needs_review','mark_needs_enrichment','research_serpapi','merge','split')),
  reason text not null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details)='object'),
  created_at timestamptz not null default now()
);
create index catalog_resolution_actions_candidate_idx on public.catalog_resolution_actions(candidate_id,created_at desc);

create table public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(product_id,normalized_alias)
);
create index product_aliases_lookup_idx on public.product_aliases(normalized_alias,product_id);

alter table public.catalog_candidates enable row level security;
alter table public.garment_submissions enable row level security;
alter table public.catalog_review_flags enable row level security;
alter table public.catalog_resolution_actions enable row level security;
alter table public.product_aliases enable row level security;

create policy "Admins read catalog candidates" on public.catalog_candidates for select to authenticated using(private.is_admin());
create policy "Owners read own garment submissions" on public.garment_submissions for select to authenticated using(user_id=(select auth.uid()) or private.is_admin());
create policy "Admins read catalog flags" on public.catalog_review_flags for select to authenticated using(private.is_admin());
create policy "Admins read catalog resolution history" on public.catalog_resolution_actions for select to authenticated using(private.is_admin());
create policy "Members read product aliases" on public.product_aliases for select to authenticated using(true);

grant select on public.catalog_candidates to authenticated;
grant select on public.garment_submissions to authenticated;
grant select on public.catalog_review_flags to authenticated;
grant select on public.catalog_resolution_actions to authenticated;
grant select on public.product_aliases to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalog-submission-photos','catalog-submission-photos',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Owners upload catalog submission photos" on storage.objects;
create policy "Owners upload catalog submission photos" on storage.objects for insert to authenticated
with check(bucket_id='catalog-submission-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Owners read catalog submission photos" on storage.objects;
create policy "Owners read catalog submission photos" on storage.objects for select to authenticated
using(bucket_id='catalog-submission-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.is_admin()));
drop policy if exists "Admins delete catalog submission photos" on storage.objects;
create policy "Admins delete catalog submission photos" on storage.objects for delete to authenticated
using(bucket_id='catalog-submission-photos' and private.is_admin());

create or replace function public.record_pending_garment_submission(
  p_closet_item_id uuid,
  p_fit_report_id uuid,
  p_brand_text text,
  p_model_text text,
  p_garment_type_key text,
  p_color_family_key text,
  p_normalized_size_id uuid,
  p_size_label text,
  p_identifier_type text default null,
  p_identifier_value text default null,
  p_style_number text default null,
  p_retailer_url text default null,
  p_normalized_retailer_url text default null,
  p_department_key text default null,
  p_attributes jsonb default '[]'::jsonb,
  p_materials jsonb default '[]'::jsonb,
  p_product_photo_storage_path text default null
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_brand text:=public.normalize_search_text(p_brand_text);
  v_model text:=public.normalize_search_text(p_model_text);
  v_identity text;
  v_candidate_id uuid;
  v_existing_submission uuid;
  v_product_ids uuid[];
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if nullif(v_brand,'') is null or nullif(v_model,'') is null then raise exception 'Brand and model required'; end if;
  if not exists(select 1 from public.garment_types where key=p_garment_type_key and intake_active) then raise exception 'Unknown garment type'; end if;
  if not exists(select 1 from public.color_families where key=p_color_family_key) then raise exception 'Unknown color'; end if;
  if not exists(select 1 from public.normalized_sizes where id=p_normalized_size_id) then raise exception 'Unknown size'; end if;
  if p_department_key is not null and not exists(select 1 from public.product_departments where key=p_department_key) then raise exception 'Unknown department'; end if;
  if jsonb_typeof(coalesce(p_attributes,'[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_materials,'[]'::jsonb)) <> 'array' then raise exception 'Invalid evidence'; end if;
  if p_identifier_type is not null and p_identifier_type not in ('upc','barcode') then raise exception 'Invalid identifier type'; end if;
  if not exists(select 1 from public.closet_items where id=p_closet_item_id and user_id=v_user_id and product_id is null) then raise exception 'Unknown pending closet item'; end if;
  if not exists(select 1 from public.fit_reports where id=p_fit_report_id and closet_item_id=p_closet_item_id and user_id=v_user_id and product_id is null) then raise exception 'Unknown pending fit report'; end if;

  select id,candidate_id into v_existing_submission,v_candidate_id from public.garment_submissions where closet_item_id=p_closet_item_id;
  if v_existing_submission is not null then return v_candidate_id; end if;

  v_identity:=v_brand||'|'||v_model||'|'||p_garment_type_key;
  insert into public.catalog_candidates(identity_key,brand_text,normalized_brand,model_text,normalized_model,garment_type_key,department_key,status,source,last_submitted_at)
  values(v_identity,btrim(p_brand_text),v_brand,btrim(p_model_text),v_model,p_garment_type_key,p_department_key,'pending','member',now())
  on conflict(identity_key) do update set
    last_submitted_at=excluded.last_submitted_at,
    updated_at=now(),
    department_key=coalesce(public.catalog_candidates.department_key,excluded.department_key)
  returning id into v_candidate_id;

  insert into public.garment_submissions(
    user_id,closet_item_id,fit_report_id,candidate_id,brand_text,normalized_brand,model_text,normalized_model,
    garment_type_key,color_family_key,normalized_size_id,size_label,identifier_type,identifier_value,
    manufacturer_style_number,retailer_url,normalized_retailer_url,department_key,attributes,materials,product_photo_storage_path
  ) values(
    v_user_id,p_closet_item_id,p_fit_report_id,v_candidate_id,btrim(p_brand_text),v_brand,btrim(p_model_text),v_model,
    p_garment_type_key,p_color_family_key,p_normalized_size_id,btrim(p_size_label),p_identifier_type,nullif(btrim(p_identifier_value),''),
    nullif(btrim(p_style_number),''),nullif(btrim(p_retailer_url),''),nullif(btrim(p_normalized_retailer_url),''),p_department_key,
    coalesce(p_attributes,'[]'::jsonb),coalesce(p_materials,'[]'::jsonb),nullif(btrim(p_product_photo_storage_path),'')
  );

  update public.catalog_candidates
  set submission_count=submission_count+1,last_submitted_at=now(),updated_at=now()
  where id=v_candidate_id;

  select array_agg(p.id order by p.id) into v_product_ids
  from public.products p
  join public.brands b on b.id=p.brand_id
  where p.catalog_status<>'rejected'::public.product_data_status
    and b.normalized_name=v_brand
    and p.normalized_name=v_model
    and p.garment_type_key=p_garment_type_key;

  if coalesce(cardinality(v_product_ids),0)>0 then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=v_candidate_id and status<>'merged';
    insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
    values('possible_duplicate',v_candidate_id,jsonb_build_object('reason','Exact normalized Product exists but member did not resolve/select it','product_ids',to_jsonb(v_product_ids)),v_user_id)
    on conflict do nothing;
  end if;

  if p_identifier_value is not null and exists(
    select 1 from public.product_identifiers pi
    where pi.normalized_value=public.normalize_identifier(p_identifier_value)
      and pi.identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
  ) then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=v_candidate_id and status<>'merged';
    insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
    values('retail_identifier_conflict',v_candidate_id,jsonb_build_object('reason','Submitted identifier already exists on a canonical Product','identifier',p_identifier_value),v_user_id)
    on conflict do nothing;
  end if;

  if p_normalized_retailer_url is not null and exists(select 1 from public.retailer_listings where normalized_url=p_normalized_retailer_url) then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=v_candidate_id and status<>'merged';
    insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
    values('retail_identifier_conflict',v_candidate_id,jsonb_build_object('reason','Submitted retailer URL already exists on a canonical Product','normalized_url',p_normalized_retailer_url),v_user_id)
    on conflict do nothing;
  end if;

  return v_candidate_id;
end;
$$;
revoke all on function public.record_pending_garment_submission(uuid,uuid,text,text,text,text,uuid,text,text,text,text,text,text,text,jsonb,jsonb,text) from public,anon;
grant execute on function public.record_pending_garment_submission(uuid,uuid,text,text,text,text,uuid,text,text,text,text,text,text,text,jsonb,jsonb,text) to authenticated;

create or replace function public.flag_catalog_possible_duplicate(p_product_ids uuid[],p_reason text)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_product_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if coalesce(cardinality(p_product_ids),0)<2 then return; end if;
  foreach v_product_id in array p_product_ids loop
    update public.products set catalog_review_needed=true where id=v_product_id;
    insert into public.catalog_review_flags(flag_type,product_id,details,created_by)
    values('possible_duplicate',v_product_id,jsonb_build_object('reason',coalesce(nullif(btrim(p_reason),''),'Conflicting catalog identity evidence'),'product_ids',to_jsonb(p_product_ids)),v_user_id)
    on conflict do nothing;
  end loop;
end;
$$;
revoke all on function public.flag_catalog_possible_duplicate(uuid[],text) from public,anon;
grant execute on function public.flag_catalog_possible_duplicate(uuid[],text) to authenticated;

create or replace function private.map_catalog_candidate_to_product(
  p_candidate_id uuid,
  p_product_id uuid,
  p_admin_user_id uuid,
  p_reason text,
  p_resolution_kind text,
  p_action text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_submission record;
  v_variant_id uuid;
  v_color_label text;
  v_color_normalized text;
  v_market_segment public.garment_market_segment;
  v_candidate public.catalog_candidates%rowtype;
  v_product record;
begin
  select * into v_candidate from public.catalog_candidates where id=p_candidate_id for update;
  if v_candidate.id is null then raise exception 'Unknown candidate'; end if;
  if v_candidate.resolved_product_id is not null then raise exception 'Candidate already resolved'; end if;
  select p.id,p.brand_id,p.name,p.normalized_name,p.garment_type_key,p.market_segment,b.normalized_name as brand_normalized
  into v_product
  from public.products p join public.brands b on b.id=p.brand_id
  where p.id=p_product_id and p.catalog_status<>'rejected'::public.product_data_status;
  if v_product.id is null then raise exception 'Unknown Product'; end if;
  if v_product.garment_type_key is not null and v_product.garment_type_key<>v_candidate.garment_type_key then raise exception 'Garment type mismatch'; end if;
  v_market_segment:=v_product.market_segment;

  for v_submission in
    select * from public.garment_submissions
    where candidate_id=p_candidate_id and resolved_product_id is null
    order by created_at,id
    for update
  loop
    select label into v_color_label from public.color_families where key=v_submission.color_family_key;
    v_color_normalized:=public.normalize_search_text(coalesce(v_color_label,v_submission.color_family_key));
    select id into v_variant_id
    from public.product_variants
    where product_id=p_product_id
      and normalized_size_id=v_submission.normalized_size_id
      and coalesce(color_normalized,'')=coalesce(v_color_normalized,'')
    order by id limit 1;
    if v_variant_id is null then
      insert into public.product_variants(product_id,normalized_size_id,size_label,color_label,color_normalized,color_family_key,market_segment)
      values(p_product_id,v_submission.normalized_size_id,v_submission.size_label,v_color_label,v_color_normalized,v_submission.color_family_key,v_market_segment)
      returning id into v_variant_id;
    end if;

    update public.closet_items set product_id=p_product_id,variant_id=v_variant_id,updated_at=now()
      where id=v_submission.closet_item_id and user_id=v_submission.user_id;
    update public.fit_reports set product_id=p_product_id,variant_id=v_variant_id,updated_at=now()
      where id=v_submission.fit_report_id and user_id=v_submission.user_id;
    update public.garment_submissions set resolved_product_id=p_product_id,resolved_at=now()
      where id=v_submission.id;
  end loop;

  if v_candidate.normalized_brand is distinct from v_product.brand_normalized then
    insert into public.brand_aliases(brand_id,alias,normalized_alias)
    values(v_product.brand_id,v_candidate.brand_text,v_candidate.normalized_brand)
    on conflict do nothing;
  end if;
  if v_candidate.normalized_model is distinct from v_product.normalized_name then
    insert into public.product_aliases(product_id,alias,normalized_alias,created_by)
    values(p_product_id,v_candidate.model_text,v_candidate.normalized_model,p_admin_user_id)
    on conflict(product_id,normalized_alias) do nothing;
  end if;

  update public.catalog_candidates
  set status='merged',resolved_product_id=p_product_id,resolution_kind=p_resolution_kind,updated_at=now()
  where id=p_candidate_id;
  update public.catalog_review_flags
  set status='resolved',resolved_by=p_admin_user_id,resolved_at=now(),resolution_note=p_reason
  where candidate_id=p_candidate_id and status='open';
  insert into public.catalog_resolution_actions(admin_user_id,candidate_id,product_id,action,reason,details)
  values(p_admin_user_id,p_candidate_id,p_product_id,p_action,p_reason,jsonb_build_object('resolution_kind',p_resolution_kind));
end;
$$;
revoke all on function private.map_catalog_candidate_to_product(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;

create or replace function public.admin_map_catalog_candidate(p_candidate_id uuid,p_product_id uuid,p_reason text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_admin uuid:=auth.uid();
begin
  if v_admin is null or not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Reason required'; end if;
  perform private.map_catalog_candidate_to_product(p_candidate_id,p_product_id,v_admin,btrim(p_reason),'existing_product','map_existing');
end;
$$;
revoke all on function public.admin_map_catalog_candidate(uuid,uuid,text) from public,anon;
grant execute on function public.admin_map_catalog_candidate(uuid,uuid,text) to authenticated;

create or replace function public.admin_create_product_from_candidate(p_candidate_id uuid,p_canonical_name text,p_reason text)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_candidate public.catalog_candidates%rowtype;
  v_brand_id uuid;
  v_brand_slug text;
  v_family_id uuid;
  v_category public.garment_category;
  v_market public.garment_market_segment:='unknown'::public.garment_market_segment;
  v_product_id uuid;
  v_slug text;
  v_normalized_name text;
begin
  if v_admin is null or not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
  if nullif(btrim(p_reason),'') is null or nullif(btrim(p_canonical_name),'') is null then raise exception 'Name and reason required'; end if;
  select * into v_candidate from public.catalog_candidates where id=p_candidate_id for update;
  if v_candidate.id is null then raise exception 'Unknown candidate'; end if;
  if v_candidate.resolved_product_id is not null then raise exception 'Candidate already resolved'; end if;

  select id,slug into v_brand_id,v_brand_slug from public.brands where normalized_name=v_candidate.normalized_brand limit 1;
  if v_brand_id is null then
    v_brand_slug:=left(trim(both '-' from regexp_replace(lower(v_candidate.brand_text),'[^a-z0-9]+','-','g')),70);
    if nullif(v_brand_slug,'') is null then v_brand_slug:='brand-'||substr(v_candidate.id::text,1,8); end if;
    if exists(select 1 from public.brands where slug=v_brand_slug) then v_brand_slug:=left(v_brand_slug,58)||'-'||substr(v_candidate.id::text,1,8); end if;
    insert into public.brands(name,slug,normalized_name)
    values(v_candidate.brand_text,v_brand_slug,v_candidate.normalized_brand)
    returning id into v_brand_id;
  end if;

  select category into v_category from public.garment_types where key=v_candidate.garment_type_key;
  if v_candidate.department_key='womens' then v_market:='womens'::public.garment_market_segment;
  elsif v_candidate.department_key='mens' then v_market:='mens'::public.garment_market_segment;
  elsif v_candidate.department_key='unisex' then v_market:='unisex'::public.garment_market_segment;
  elsif v_candidate.department_key in ('girls','boys','kids_unisex','baby_toddler') then v_market:='kids_youth'::public.garment_market_segment;
  end if;

  v_normalized_name:=public.normalize_search_text(p_canonical_name);
  select id into v_product_id from public.products
    where brand_id=v_brand_id and normalized_name=v_normalized_name and garment_type_key=v_candidate.garment_type_key and market_segment=v_market and catalog_status<>'rejected'::public.product_data_status
    order by id limit 1;
  if v_product_id is not null then
    perform private.map_catalog_candidate_to_product(p_candidate_id,v_product_id,v_admin,btrim(p_reason),'existing_product','map_existing');
    return v_product_id;
  end if;

  select id into v_family_id from public.product_families
    where brand_id=v_brand_id and normalized_name=v_normalized_name and garment_type_key=v_candidate.garment_type_key and market_segment=v_market
    order by id limit 1;
  if v_family_id is null then
    insert into public.product_families(brand_id,name,normalized_name,garment_type_key,market_segment)
    values(v_brand_id,btrim(p_canonical_name),v_normalized_name,v_candidate.garment_type_key,v_market)
    returning id into v_family_id;
  end if;

  v_slug:=left(trim(both '-' from regexp_replace(lower(v_brand_slug||'-'||p_canonical_name||'-'||v_market::text),'[^a-z0-9]+','-','g')),140);
  if exists(select 1 from public.products where slug=v_slug) then v_slug:=left(v_slug,127)||'-'||substr(v_candidate.id::text,1,8); end if;
  insert into public.products(brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment,department_key,catalog_status,catalog_review_needed)
  values(v_brand_id,btrim(p_canonical_name),v_slug,v_category,v_normalized_name,v_family_id,v_candidate.garment_type_key,v_market,v_candidate.department_key,'verified'::public.product_data_status,false)
  returning id into v_product_id;

  perform private.map_catalog_candidate_to_product(p_candidate_id,v_product_id,v_admin,btrim(p_reason),'new_product','create_product');
  return v_product_id;
end;
$$;
revoke all on function public.admin_create_product_from_candidate(uuid,text,text) from public,anon;
grant execute on function public.admin_create_product_from_candidate(uuid,text,text) to authenticated;

create or replace function public.admin_set_catalog_candidate_status(p_candidate_id uuid,p_status text,p_reason text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_admin uuid:=auth.uid(); v_action text;
begin
  if v_admin is null or not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
  if p_status not in ('pending','needs_enrichment','needs_review') or nullif(btrim(p_reason),'') is null then raise exception 'Invalid status/reason'; end if;
  update public.catalog_candidates set status=p_status,updated_at=now() where id=p_candidate_id and resolved_product_id is null;
  if not found then raise exception 'Unknown or resolved candidate'; end if;
  v_action:=case when p_status='needs_review' then 'mark_needs_review' else 'mark_needs_enrichment' end;
  insert into public.catalog_resolution_actions(admin_user_id,candidate_id,action,reason)
  values(v_admin,p_candidate_id,v_action,btrim(p_reason));
end;
$$;
revoke all on function public.admin_set_catalog_candidate_status(uuid,text,text) from public,anon;
grant execute on function public.admin_set_catalog_candidate_status(uuid,text,text) to authenticated;

comment on table public.catalog_candidates is 'Admin-resolved catalog candidate groups built from unresolved garment submissions. Candidates are not canonical Products.';
comment on table public.garment_submissions is 'Immutable-ish member identity/enrichment evidence for a logged garment that was unresolved at intake. Mapping later connects the Closet/Fit Report to a canonical Product without rewriting historical body/fit evidence.';
comment on table public.catalog_review_flags is 'Typed catalog review flags. Flags never directly rewrite Product truth.';
comment on table public.product_aliases is 'Reviewed hidden Product-name aliases used for canonical search resolution.';
