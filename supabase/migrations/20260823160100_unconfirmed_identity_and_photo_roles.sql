-- Owner-locked uncertainty/review boundary and expanded Fit/Product photo evidence.
-- Unconfirmed candidates stay usable in the member's Closet and Styles/Outfits but
-- never materialize into searchable/suggested Products until an admin resolves them.

-- Fit photos now have explicit front/back roles. Existing single photos become front.
alter table public.fit_reference_photos
  add column if not exists photo_role text not null default 'front'
    check(photo_role in ('front','back'));
alter table public.fit_reference_photos
  drop constraint if exists fit_reference_photos_closet_item_id_key;
create unique index if not exists fit_reference_photos_closet_role_uq
  on public.fit_reference_photos(closet_item_id,photo_role);

-- Pending catalog evidence keeps Product and tag/label photos distinct, and records the
-- member's explicit uncertainty separately from the text they entered.
alter table public.garment_submissions
  add column if not exists product_label_photo_storage_path text,
  add column if not exists identity_uncertain boolean not null default false;
create index if not exists garment_submissions_identity_uncertain_idx
  on public.garment_submissions(candidate_id,created_at)
  where identity_uncertain;

-- Label/tag photos are identity-review evidence, not Product-display imagery.
create table if not exists public.product_label_photo_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  fit_report_id uuid not null references public.fit_reports(id) on delete cascade,
  storage_path text not null unique,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists product_label_photo_evidence_product_idx
  on public.product_label_photo_evidence(product_id,created_at desc);
alter table public.product_label_photo_evidence enable row level security;
drop policy if exists "Owners and admins read Product label photos" on public.product_label_photo_evidence;
create policy "Owners and admins read Product label photos"
  on public.product_label_photo_evidence for select to authenticated
  using(submitted_by=(select auth.uid()) or private.is_admin());
drop policy if exists "Members add own Product label photos" on public.product_label_photo_evidence;
create policy "Members add own Product label photos"
  on public.product_label_photo_evidence for insert to authenticated
  with check(submitted_by=(select auth.uid()) and exists(
    select 1 from public.fit_reports fr
    where fr.id=fit_report_id and fr.user_id=(select auth.uid()) and fr.product_id=product_id
  ));
drop policy if exists "Members delete own Product label photos" on public.product_label_photo_evidence;
create policy "Members delete own Product label photos"
  on public.product_label_photo_evidence for delete to authenticated
  using(submitted_by=(select auth.uid()) or private.is_admin());
revoke all on public.product_label_photo_evidence from anon,authenticated;
grant select,insert,delete on public.product_label_photo_evidence to authenticated;

-- The application removes failed uploads during rollback. Owners therefore need to be
-- able to delete only objects inside their own private catalog-evidence folder.
drop policy if exists "Owners delete own catalog submission photos" on storage.objects;
create policy "Owners delete own catalog submission photos"
  on storage.objects for delete to authenticated
  using(bucket_id='catalog-submission-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Unconfirmed is candidate-only. A live Product can never carry this status.
alter table public.products
  drop constraint if exists products_catalog_status_not_unconfirmed;
alter table public.products
  add constraint products_catalog_status_not_unconfirmed
  check(catalog_status<>'unconfirmed'::public.product_data_status);

-- Replace the pending-submission boundary with a backward-compatible extension. The
-- two new trailing parameters have defaults so the pre-deployment app remains valid
-- while the database migration is applied before the new application build.
drop function if exists public.record_pending_garment_submission(uuid,uuid,text,text,text,text,uuid,text,text,text,text,text,text,text,jsonb,jsonb,text);
create function public.record_pending_garment_submission(
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
  p_product_photo_storage_path text default null,
  p_product_label_photo_storage_path text default null,
  p_identity_uncertain boolean default false
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
  values(v_identity,btrim(p_brand_text),v_brand,btrim(p_model_text),v_model,p_garment_type_key,p_department_key,case when p_identity_uncertain then 'needs_review' else 'pending' end,'member',now())
  on conflict(identity_key) do update set
    last_submitted_at=excluded.last_submitted_at,
    updated_at=now(),
    status=case when p_identity_uncertain then 'needs_review' else public.catalog_candidates.status end,
    department_key=coalesce(public.catalog_candidates.department_key,excluded.department_key)
  returning id into v_candidate_id;

  if p_identity_uncertain then
    update public.catalog_candidates
    set identity_confidence='unconfirmed'::public.product_data_status,
        status='needs_review',
        updated_at=now()
    where id=v_candidate_id and resolved_product_id is null;
  end if;

  insert into public.garment_submissions(
    user_id,closet_item_id,fit_report_id,candidate_id,brand_text,normalized_brand,model_text,normalized_model,
    garment_type_key,color_family_key,normalized_size_id,size_label,identifier_type,identifier_value,
    manufacturer_style_number,retailer_url,normalized_retailer_url,department_key,attributes,materials,
    product_photo_storage_path,product_label_photo_storage_path,identity_uncertain
  ) values(
    v_user_id,p_closet_item_id,p_fit_report_id,v_candidate_id,btrim(p_brand_text),v_brand,btrim(p_model_text),v_model,
    p_garment_type_key,p_color_family_key,p_normalized_size_id,btrim(p_size_label),p_identifier_type,nullif(btrim(p_identifier_value),''),
    nullif(btrim(p_style_number),''),nullif(btrim(p_retailer_url),''),nullif(btrim(p_normalized_retailer_url),''),p_department_key,
    coalesce(p_attributes,'[]'::jsonb),coalesce(p_materials,'[]'::jsonb),nullif(btrim(p_product_photo_storage_path),''),
    nullif(btrim(p_product_label_photo_storage_path),''),coalesce(p_identity_uncertain,false)
  );

  update public.catalog_candidates
  set submission_count=submission_count+1,last_submitted_at=now(),updated_at=now()
  where id=v_candidate_id;

  if p_identity_uncertain then
    insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
    values('ambiguous_identity',v_candidate_id,jsonb_build_object(
      'reason','Member explicitly marked the item/style/model identity as uncertain',
      'fit_report_id',p_fit_report_id,
      'retail_link_provided',p_retailer_url is not null,
      'product_photo_provided',p_product_photo_storage_path is not null,
      'label_photo_provided',p_product_label_photo_storage_path is not null
    ),v_user_id)
    on conflict do nothing;
  end if;

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

  perform private.recalculate_candidate_review_priority(v_candidate_id);
  return v_candidate_id;
end;
$$;
revoke all on function public.record_pending_garment_submission(uuid,uuid,text,text,text,text,uuid,text,text,text,text,text,text,text,jsonb,jsonb,text,text,boolean) from public,anon;
grant execute on function public.record_pending_garment_submission(uuid,uuid,text,text,text,text,uuid,text,text,text,text,text,text,text,jsonb,jsonb,text,text,boolean) to authenticated;

-- Preserve the current submission-first auto-post behavior for clean evidence, while
-- making an explicit uncertainty signal a hard administrative publishing gate.
create or replace function private.auto_promote_catalog_candidate(p_candidate_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_candidate public.catalog_candidates%rowtype;
  v_confirmations integer:=0;
  v_conflicts integer:=0;
  v_product_ids uuid[];
  v_product_id uuid;
  v_brand_id uuid;
  v_brand_slug text;
  v_family_id uuid;
  v_category public.garment_category;
  v_market public.garment_market_segment:='unknown'::public.garment_market_segment;
  v_slug text;
  v_identity_tier text:='provisional';
  v_uncertain boolean:=false;
begin
  select * into v_candidate from public.catalog_candidates where id=p_candidate_id for update;
  if v_candidate.id is null or v_candidate.resolved_product_id is not null then return v_candidate.resolved_product_id; end if;

  select count(distinct gs.user_id),coalesce(bool_or(gs.identity_uncertain),false)
  into v_confirmations,v_uncertain
  from public.garment_submissions gs where gs.candidate_id=p_candidate_id;
  v_uncertain:=v_uncertain or v_candidate.identity_confidence='unconfirmed'::public.product_data_status;
  v_conflicts:=private.candidate_identity_conflict_count(p_candidate_id);

  update public.catalog_candidates
  set identity_confirmation_count=v_confirmations,
      identity_conflict_count=v_conflicts,
      identity_confidence=case
        when v_uncertain then 'unconfirmed'::public.product_data_status
        when identity_confidence in ('verified'::public.product_data_status,'rejected'::public.product_data_status) then identity_confidence
        when v_confirmations>=2 then 'corroborated'::public.product_data_status
        else 'provisional'::public.product_data_status
      end,
      status=case when v_uncertain then 'needs_review' else status end,
      updated_at=now()
  where id=p_candidate_id;

  if v_confirmations<1 then return null; end if;
  if v_uncertain then
    perform private.recalculate_candidate_review_priority(p_candidate_id);
    return null;
  end if;
  if v_conflicts>0 then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=p_candidate_id and status<>'merged';
    perform private.recalculate_candidate_review_priority(p_candidate_id);
    return null;
  end if;

  select array_agg(p.id order by p.id) into v_product_ids
  from public.products p
  join public.brands b on b.id=p.brand_id
  where p.catalog_status<>'rejected'::public.product_data_status
    and b.normalized_name=v_candidate.normalized_brand
    and p.normalized_name=v_candidate.normalized_model
    and p.garment_type_key=v_candidate.garment_type_key;

  if coalesce(cardinality(v_product_ids),0)=1 then
    v_product_id:=v_product_ids[1];
    perform private.map_catalog_candidate_to_product(
      p_candidate_id,v_product_id,null,
      format('Automatic exact Product mapping after %s distinct member confirmation(s)',v_confirmations),
      'existing_product','auto_map_existing'
    );
    perform private.refresh_product_identity_confidence(v_product_id);
    return v_product_id;
  elsif coalesce(cardinality(v_product_ids),0)>1 then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=p_candidate_id;
    insert into public.catalog_review_flags(flag_type,candidate_id,details)
    values('ambiguous_identity',p_candidate_id,jsonb_build_object('reason','Multiple canonical Products share the candidate normalized identity','product_ids',to_jsonb(v_product_ids)))
    on conflict do nothing;
    return null;
  end if;

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

  select id into v_family_id from public.product_families
  where brand_id=v_brand_id and normalized_name=v_candidate.normalized_model and garment_type_key=v_candidate.garment_type_key and market_segment=v_market
  order by id limit 1;
  if v_family_id is null then
    insert into public.product_families(brand_id,name,normalized_name,garment_type_key,market_segment)
    values(v_brand_id,v_candidate.model_text,v_candidate.normalized_model,v_candidate.garment_type_key,v_market)
    returning id into v_family_id;
  end if;

  v_slug:=left(trim(both '-' from regexp_replace(lower(v_brand_slug||'-'||v_candidate.model_text||'-'||v_market::text),'[^a-z0-9]+','-','g')),140);
  if exists(select 1 from public.products where slug=v_slug) then v_slug:=left(v_slug,127)||'-'||substr(v_candidate.id::text,1,8); end if;
  v_identity_tier:=case when v_confirmations>=5 then 'established' when v_confirmations>=2 then 'corroborated' else 'provisional' end;

  insert into public.products(
    brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment,department_key,
    catalog_status,catalog_review_needed,identity_confirmation_count,identity_trust_tier
  ) values(
    v_brand_id,v_candidate.model_text,v_slug,v_category,v_candidate.normalized_model,v_family_id,v_candidate.garment_type_key,v_market,v_candidate.department_key,
    'provisional'::public.product_data_status,false,v_confirmations,v_identity_tier
  ) returning id into v_product_id;

  perform private.map_catalog_candidate_to_product(
    p_candidate_id,v_product_id,null,
    format('Automatic community Product post after %s distinct member confirmation(s) with no blocking flags',v_confirmations),
    'new_product','auto_create_product'
  );
  perform private.refresh_product_identity_confidence(v_product_id);
  perform private.flag_possible_product_neighbors(v_product_id);
  return v_product_id;
end;
$$;
revoke all on function private.auto_promote_catalog_candidate(uuid) from public,anon,authenticated;

-- Never expose Unconfirmed candidates as barcode suggestions, and reject any stale/direct
-- attempt to confirm one before administrative review.
create or replace function public.lookup_barcode_catalog_match(p_barcode text)
returns table (
  match_kind text,
  product_id uuid,
  candidate_id uuid,
  brand_name text,
  product_name text,
  garment_type_key text,
  image_url text,
  identity_confidence text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_barcode text:=public.normalize_identifier(coalesce(p_barcode,''));
  v_product_ids uuid[];
  v_candidate_ids uuid[];
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_barcode !~ '^([0-9]{8}|[0-9]{12,14})$' then return; end if;

  select array_agg(distinct p.id order by p.id) into v_product_ids
  from public.product_identifiers pi
  join public.products p on p.id=pi.product_id
  where pi.identifier_type::text in ('upc','barcode')
    and pi.normalized_value=v_barcode
    and p.catalog_status<>'rejected'::public.product_data_status;

  if coalesce(cardinality(v_product_ids),0)=0 then
    select array_agg(distinct p.id order by p.id) into v_product_ids
    from private.product_barcode_evidence e
    join public.products p on p.id=e.product_id
    where e.normalized_barcode=v_barcode
      and p.catalog_status<>'rejected'::public.product_data_status;
  end if;

  if coalesce(cardinality(v_product_ids),0)=1 then
    return query
    select 'product'::text,p.id,null::uuid,b.name,p.name,p.garment_type_key,p.image_url,p.catalog_status::text
    from public.products p join public.brands b on b.id=p.brand_id where p.id=v_product_ids[1];
    return;
  elsif coalesce(cardinality(v_product_ids),0)>1 then
    return;
  end if;

  select array_agg(distinct c.id order by c.id) into v_candidate_ids
  from public.garment_submissions gs
  join public.catalog_candidates c on c.id=gs.candidate_id
  where c.resolved_product_id is null
    and c.status<>'merged'
    and c.identity_confidence<>'unconfirmed'::public.product_data_status
    and not exists(select 1 from public.garment_submissions uncertain where uncertain.candidate_id=c.id and uncertain.identity_uncertain)
    and gs.identifier_type in ('upc','barcode')
    and public.normalize_identifier(coalesce(gs.identifier_value,''))=v_barcode;

  if coalesce(cardinality(v_candidate_ids),0)=1 then
    return query
    select 'candidate'::text,null::uuid,c.id,c.brand_text,c.model_text,c.garment_type_key,null::text,c.identity_confidence::text
    from public.catalog_candidates c
    where c.id=v_candidate_ids[1] and c.resolved_product_id is null
      and c.identity_confidence<>'unconfirmed'::public.product_data_status;
  end if;
end;
$$;
revoke all on function public.lookup_barcode_catalog_match(text) from public,anon;
grant execute on function public.lookup_barcode_catalog_match(text) to authenticated;

create or replace function public.confirm_barcode_catalog_match(
  p_barcode text,
  p_product_id uuid default null,
  p_candidate_id uuid default null
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_barcode text:=public.normalize_identifier(coalesce(p_barcode,''));
  v_status text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_barcode !~ '^([0-9]{8}|[0-9]{12,14})$' then raise exception 'Invalid barcode'; end if;
  if (p_product_id is null)=(p_candidate_id is null) then raise exception 'Exactly one barcode match target is required'; end if;

  if p_candidate_id is not null then
    if not exists(
      select 1 from public.catalog_candidates c
      join public.garment_submissions gs on gs.candidate_id=c.id
      where c.id=p_candidate_id and c.resolved_product_id is null and c.status<>'merged'
        and c.identity_confidence<>'unconfirmed'::public.product_data_status
        and not exists(select 1 from public.garment_submissions uncertain where uncertain.candidate_id=c.id and uncertain.identity_uncertain)
        and gs.identifier_type in ('upc','barcode')
        and public.normalize_identifier(coalesce(gs.identifier_value,''))=v_barcode
    ) then raise exception 'Barcode candidate no longer matches'; end if;

    insert into private.barcode_identity_confirmations(user_id,normalized_barcode,candidate_id)
    values(v_user_id,v_barcode,p_candidate_id)
    on conflict(user_id,normalized_barcode,candidate_id) where candidate_id is not null do nothing;
    perform private.refresh_catalog_candidate_identity(p_candidate_id);
    select c.identity_confidence::text into v_status from public.catalog_candidates c where c.id=p_candidate_id;
    return v_status;
  end if;

  if not exists(
    select 1 from public.products p
    where p.id=p_product_id and p.catalog_status<>'rejected'::public.product_data_status
      and (
        exists(select 1 from public.product_identifiers pi where pi.product_id=p.id and pi.identifier_type::text in ('upc','barcode') and pi.normalized_value=v_barcode)
        or exists(select 1 from private.product_barcode_evidence e where e.product_id=p.id and e.normalized_barcode=v_barcode)
      )
  ) then raise exception 'Barcode Product no longer matches'; end if;

  insert into private.barcode_identity_confirmations(user_id,normalized_barcode,product_id)
  values(v_user_id,v_barcode,p_product_id)
  on conflict(user_id,normalized_barcode,product_id) where product_id is not null do nothing;
  perform private.refresh_product_barcode_link(p_product_id,v_barcode);
  select p.catalog_status::text into v_status from public.products p where p.id=p_product_id;
  return v_status;
end;
$$;
revoke all on function public.confirm_barcode_catalog_match(text,uuid,uuid) from public,anon;
grant execute on function public.confirm_barcode_catalog_match(text,uuid,uuid) to authenticated;

-- Scanner image fallback remains Product/catalog photo first, then a shared member Fit
-- photo; with two Fit photos available, front is preferred over back.
create or replace function public.get_scan_match_image_source(
  p_product_id uuid default null,
  p_candidate_id uuid default null
)
returns table(product_photo_url text,product_photo_storage_path text,fit_photo_storage_path text)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_product_url text;
  v_product_path text;
  v_fit_path text;
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if (p_product_id is null)=(p_candidate_id is null) then raise exception 'Choose exactly one scan image target' using errcode='22023'; end if;

  if p_product_id is not null then
    if not exists(select 1 from public.products where id=p_product_id and catalog_status<>'rejected'::public.product_data_status) then return; end if;

    select pe.public_url,pe.storage_path into v_product_url,v_product_path
    from public.product_photo_evidence pe
    where pe.product_id=p_product_id and pe.source_status<>'rejected'::public.product_data_status
    order by case pe.source_status::text when 'verified' then 1 when 'corroborated' then 2 else 3 end,pe.created_at desc,pe.id
    limit 1;

    select fr.storage_path into v_fit_path
    from public.fit_reference_photos fr
    join public.closet_items ci on ci.id=fr.closet_item_id
    where ci.product_id=p_product_id and ci.visibility='shared'::public.closet_visibility
    order by case fr.photo_role when 'front' then 1 else 2 end,fr.created_at desc,fr.id
    limit 1;
  else
    if not exists(select 1 from public.catalog_candidates where id=p_candidate_id and resolved_product_id is null and status<>'merged') then return; end if;

    select gs.product_photo_storage_path into v_product_path
    from public.garment_submissions gs
    where gs.candidate_id=p_candidate_id and gs.product_photo_storage_path is not null
    order by gs.created_at desc,gs.id
    limit 1;

    select fr.storage_path into v_fit_path
    from public.garment_submissions gs
    join public.closet_items ci on ci.id=gs.closet_item_id
    join public.fit_reference_photos fr on fr.closet_item_id=ci.id
    where gs.candidate_id=p_candidate_id and ci.visibility='shared'::public.closet_visibility
    order by case fr.photo_role when 'front' then 1 else 2 end,fr.created_at desc,fr.id
    limit 1;
  end if;

  return query select v_product_url,v_product_path,v_fit_path;
end;
$$;
revoke all on function public.get_scan_match_image_source(uuid,uuid) from public,anon;
grant execute on function public.get_scan_match_image_source(uuid,uuid) to authenticated;

-- Admin review clears the pre-publication gate. Unconfirmed candidates that truly need
-- a new Product become normal Provisional Products; other historical candidate review
-- behavior remains unchanged.
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
  v_catalog_status public.product_data_status;
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
  v_catalog_status:=case when v_candidate.identity_confidence='unconfirmed'::public.product_data_status
    or exists(select 1 from public.garment_submissions gs where gs.candidate_id=p_candidate_id and gs.identity_uncertain)
    then 'provisional'::public.product_data_status else 'verified'::public.product_data_status end;

  insert into public.products(brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment,department_key,catalog_status,catalog_review_needed)
  values(v_brand_id,btrim(p_canonical_name),v_slug,v_category,v_normalized_name,v_family_id,v_candidate.garment_type_key,v_market,v_candidate.department_key,v_catalog_status,false)
  returning id into v_product_id;

  perform private.map_catalog_candidate_to_product(p_candidate_id,v_product_id,v_admin,btrim(p_reason),'new_product','create_product');
  perform private.refresh_product_identity_confidence(v_product_id);
  return v_product_id;
end;
$$;
revoke all on function public.admin_create_product_from_candidate(uuid,text,text) from public,anon;
grant execute on function public.admin_create_product_from_candidate(uuid,text,text) to authenticated;

comment on column public.garment_submissions.identity_uncertain is
  'Member explicitly said the submitted item/style/model identity is not fully trusted. Any true value hard-gates automatic Product publication until admin resolution.';
comment on column public.garment_submissions.product_label_photo_storage_path is
  'Private label/tag evidence for resolving an unresolved garment identity. Never used as the Product display image.';
comment on column public.fit_reference_photos.photo_role is
  'Shared Fit Photo role. Front and back may coexist for one Closet item.';
comment on table public.product_label_photo_evidence is
  'Private Product label/tag identity evidence from a member Fit Report; admin-reviewable and separate from Product display photos.';
comment on constraint products_catalog_status_not_unconfirmed on public.products is
  'Unconfirmed is a pre-publication candidate state only. Live Products start at Provisional or stronger.';
comment on function private.auto_promote_catalog_candidate(uuid) is
  'Clean member submissions may auto-post Provisional Products. Any explicit member identity uncertainty permanently gates that candidate until admin resolution.';
