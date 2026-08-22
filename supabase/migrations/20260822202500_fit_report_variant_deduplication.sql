-- Owner-locked Fit Report identity and duplicate behavior.
-- A counted Fit Report is unique by member + Product + normalized size + Fit Profile version
-- + objective garment-answer fingerprint. Color and optional catalog evidence do not create
-- another counted report. Intended fit is stored for filtering but excluded from the fingerprint.

alter table public.fit_reports
  add column if not exists garment_type_key text references public.garment_types(key),
  add column if not exists garment_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(garment_answers) = 'object'),
  add column if not exists objective_variant_key text,
  add column if not exists revision_count integer not null default 1
    check (revision_count >= 1);

create index if not exists fit_reports_product_variant_lookup_idx
  on public.fit_reports(user_id,product_id,normalized_size_id,fit_profile_version_id,objective_variant_key)
  where product_id is not null and objective_variant_key is not null;

create unique index if not exists fit_reports_known_counted_identity_uq
  on public.fit_reports(user_id,product_id,normalized_size_id,fit_profile_version_id,objective_variant_key)
  where product_id is not null and objective_variant_key is not null;

-- Member catalog observations must be report-scoped. The old member-scoped uniqueness silently
-- discarded a second valid size/variant report from the same member.
alter table public.product_metadata_evidence
  add column if not exists fit_report_id uuid references public.fit_reports(id) on delete cascade;
alter table public.product_attribute_evidence
  add column if not exists fit_report_id uuid references public.fit_reports(id) on delete cascade;
alter table public.product_material_evidence
  add column if not exists fit_report_id uuid references public.fit_reports(id) on delete cascade;

drop index if exists public.product_metadata_evidence_member_uq;
drop index if exists public.product_attribute_evidence_member_uq;
drop index if exists public.product_material_evidence_member_uq;

create unique index if not exists product_metadata_evidence_fit_report_uq
  on public.product_metadata_evidence(fit_report_id,field_key)
  where fit_report_id is not null;
create unique index if not exists product_attribute_evidence_fit_report_uq
  on public.product_attribute_evidence(fit_report_id,attribute_key)
  where fit_report_id is not null;
create unique index if not exists product_material_evidence_fit_report_uq
  on public.product_material_evidence(fit_report_id,material_key)
  where fit_report_id is not null;

create index if not exists product_metadata_evidence_member_idx
  on public.product_metadata_evidence(product_id,submitted_by,created_at desc);
create index if not exists product_attribute_evidence_member_idx
  on public.product_attribute_evidence(product_id,submitted_by,created_at desc);
create index if not exists product_material_evidence_member_idx
  on public.product_material_evidence(product_id,submitted_by,created_at desc);

-- Atomic create-or-update for a known Product Fit Report. A true duplicate updates the existing
-- report instead of creating another Closet item / Fit Report count.
create or replace function public.save_known_fit_report(
  p_new_closet_item_id uuid,
  p_product_id uuid,
  p_variant_id uuid,
  p_fit_profile_version_id uuid,
  p_size_label text,
  p_normalized_size_id uuid,
  p_fit public.fit_rating,
  p_garment_condition public.garment_condition,
  p_reported_condition text,
  p_fit_notes text,
  p_garment_type_key text,
  p_garment_answers jsonb,
  p_objective_variant_key text
) returns table(fit_report_id uuid, closet_item_id uuid, created boolean)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_fit_report_id uuid;
  v_closet_item_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_new_closet_item_id is null or p_product_id is null or p_variant_id is null
     or p_fit_profile_version_id is null or p_normalized_size_id is null then
    raise exception 'Missing Fit Report identity';
  end if;
  if nullif(btrim(coalesce(p_size_label,'')),'') is null then raise exception 'Size required'; end if;
  if nullif(btrim(coalesce(p_objective_variant_key,'')),'') is null
     or p_objective_variant_key !~ '^[0-9a-f]{64}$' then raise exception 'Invalid objective variant key'; end if;
  if jsonb_typeof(coalesce(p_garment_answers,'{}'::jsonb)) <> 'object' then raise exception 'Invalid garment answers'; end if;
  if p_reported_condition not in ('new','used','altered') then raise exception 'Invalid reported condition'; end if;
  if not exists(select 1 from public.products where id=p_product_id and catalog_status<>'rejected'::public.product_data_status) then raise exception 'Unknown Product'; end if;
  if not exists(select 1 from public.product_variants where id=p_variant_id and product_id=p_product_id) then raise exception 'Unknown Product variant'; end if;
  if not exists(select 1 from public.normalized_sizes where id=p_normalized_size_id) then raise exception 'Unknown normalized size'; end if;
  if not exists(select 1 from public.fit_profile_versions where id=p_fit_profile_version_id and user_id=v_user_id) then raise exception 'Unknown Fit Profile version'; end if;
  if not exists(select 1 from public.garment_types where key=p_garment_type_key and intake_active) then raise exception 'Unknown garment type'; end if;

  select fr.id,fr.closet_item_id into v_fit_report_id,v_closet_item_id
  from public.fit_reports fr
  where fr.user_id=v_user_id
    and fr.product_id=p_product_id
    and fr.normalized_size_id=p_normalized_size_id
    and fr.fit_profile_version_id=p_fit_profile_version_id
    and fr.objective_variant_key=p_objective_variant_key
  for update;

  if v_fit_report_id is not null then
    update public.fit_reports
    set size_label=btrim(p_size_label),
        fit=p_fit,
        garment_condition=p_garment_condition,
        reported_condition=p_reported_condition,
        fit_notes=nullif(btrim(coalesce(p_fit_notes,'')),''),
        garment_type_key=p_garment_type_key,
        garment_answers=coalesce(p_garment_answers,'{}'::jsonb),
        revision_count=revision_count+1,
        updated_at=now()
    where id=v_fit_report_id;

    return query select v_fit_report_id,v_closet_item_id,false;
    return;
  end if;

  insert into public.closet_items(
    id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility,wears_count
  ) values(
    p_new_closet_item_id,v_user_id,p_product_id,p_variant_id,btrim(p_size_label),p_normalized_size_id,'shared',0
  );

  insert into public.fit_reports(
    user_id,closet_item_id,product_id,variant_id,fit_profile_version_id,size_label,normalized_size_id,
    fit,garment_condition,reported_condition,fit_notes,would_buy_again,garment_type_key,garment_answers,
    objective_variant_key,revision_count
  ) values(
    v_user_id,p_new_closet_item_id,p_product_id,p_variant_id,p_fit_profile_version_id,btrim(p_size_label),p_normalized_size_id,
    p_fit,p_garment_condition,p_reported_condition,nullif(btrim(coalesce(p_fit_notes,'')),''),null,
    p_garment_type_key,coalesce(p_garment_answers,'{}'::jsonb),p_objective_variant_key,1
  ) returning id into v_fit_report_id;

  return query select v_fit_report_id,p_new_closet_item_id,true;
end;
$$;

revoke all on function public.save_known_fit_report(uuid,uuid,uuid,uuid,text,uuid,public.fit_rating,public.garment_condition,text,text,text,jsonb,text) from public,anon;
grant execute on function public.save_known_fit_report(uuid,uuid,uuid,uuid,text,uuid,public.fit_rating,public.garment_condition,text,text,text,jsonb,text) to authenticated;

-- Replace member-scoped evidence writes with report-scoped writes. Re-submitting a true duplicate
-- replaces that report's latest filter/material/department observation; a legitimately new size,
-- objective variant, or body version gets a different fit_report_id and therefore stacks.
drop function if exists public.record_member_product_evidence(uuid,text,text,jsonb,jsonb,text,text);

create or replace function public.record_member_product_evidence(
  p_product_id uuid,
  p_fit_report_id uuid,
  p_garment_type text,
  p_market_segment text,
  p_attributes jsonb default '[]'::jsonb,
  p_materials jsonb default '[]'::jsonb,
  p_department text default null,
  p_source_reference text default null
) returns void
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_row jsonb;
  v_attribute_key text;
  v_option_key text;
  v_material_key text;
  v_percentage numeric;
  v_reference text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.fit_reports where id=p_fit_report_id and user_id=v_user_id and product_id=p_product_id) then
    raise exception 'Unknown member Fit Report';
  end if;
  if p_department is not null and not exists(select 1 from public.product_departments where key=p_department) then raise exception 'Unknown Department'; end if;
  if jsonb_typeof(coalesce(p_attributes,'[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_materials,'[]'::jsonb)) <> 'array' then raise exception 'Invalid evidence'; end if;
  v_reference:=coalesce(nullif(btrim(coalesce(p_source_reference,'')),''),'fit_report:'||p_fit_report_id::text);

  delete from public.product_metadata_evidence where fit_report_id=p_fit_report_id and submitted_by=v_user_id and source_type='member'::public.product_data_source;
  delete from public.product_attribute_evidence where fit_report_id=p_fit_report_id and submitted_by=v_user_id and source_type='member'::public.product_data_source;
  delete from public.product_material_evidence where fit_report_id=p_fit_report_id and submitted_by=v_user_id and source_type='member'::public.product_data_source;

  insert into public.product_metadata_evidence(product_id,fit_report_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,p_fit_report_id,'garment_type',p_garment_type,'member','provisional',.55,v_reference,v_user_id);
  insert into public.product_metadata_evidence(product_id,fit_report_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,p_fit_report_id,'market_segment',p_market_segment,'member','provisional',.55,v_reference,v_user_id);
  if p_department is not null then
    insert into public.product_metadata_evidence(product_id,fit_report_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_fit_report_id,'department',p_department,'member','provisional',.55,v_reference,v_user_id);
  end if;

  for v_row in select value from jsonb_array_elements(coalesce(p_attributes,'[]'::jsonb)) loop
    v_attribute_key:=nullif(btrim(v_row->>'attribute_key'),'');
    v_option_key:=nullif(btrim(v_row->>'option_key'),'');
    if v_attribute_key is null or v_option_key is null then raise exception 'Invalid product attribute evidence'; end if;
    insert into public.product_attribute_evidence(product_id,fit_report_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_fit_report_id,v_attribute_key,v_option_key,'member','provisional',.55,v_reference,v_user_id);
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_materials,'[]'::jsonb)) loop
    v_material_key:=nullif(btrim(v_row->>'material_key'),'');
    v_percentage:=case when nullif(btrim(v_row->>'percentage'),'') is null then null else (v_row->>'percentage')::numeric end;
    if v_material_key is null or (v_percentage is not null and (v_percentage<0 or v_percentage>100)) then raise exception 'Invalid product material evidence'; end if;
    insert into public.product_material_evidence(product_id,fit_report_id,material_key,percentage,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_fit_report_id,v_material_key,v_percentage,'member','provisional',.55,v_reference,v_user_id);
  end loop;
end;
$$;

revoke all on function public.record_member_product_evidence(uuid,uuid,text,text,jsonb,jsonb,text,text) from public,anon;
grant execute on function public.record_member_product_evidence(uuid,uuid,text,text,jsonb,jsonb,text,text) to authenticated;

-- Duplicate updates can replace the report-level fit photo without creating another Fit Report.
drop policy if exists "owner updates fit photo metadata" on public.fit_reference_photos;
create policy "owner updates fit photo metadata" on public.fit_reference_photos
for update to authenticated
using(user_id=(select auth.uid()))
with check(
  user_id=(select auth.uid())
  and exists(
    select 1 from public.closet_items ci
    where ci.id=fit_reference_photos.closet_item_id
      and ci.user_id=(select auth.uid())
      and ci.visibility='shared'::public.closet_visibility
  )
);

comment on column public.fit_reports.objective_variant_key is
  'SHA-256 fingerprint of objective member-entered garment questions. Intended fit and Not sure are excluded. Used with Product, size, and Fit Profile version to prevent duplicate counted Fit Reports.';
comment on column public.fit_reports.garment_answers is
  'Latest complete controlled-question snapshot for this Fit Report, including filtering-only answers such as intended_fit and any Not sure selections.';
