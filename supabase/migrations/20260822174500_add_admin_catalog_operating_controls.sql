-- Minimum practical admin catalog operating controls for the submission-first catalog.
-- Extends the existing flag/alias/photo/audit architecture; does not create a parallel catalog system.

alter table public.catalog_resolution_actions
  drop constraint if exists catalog_resolution_actions_action_check;
alter table public.catalog_resolution_actions
  add constraint catalog_resolution_actions_action_check
  check (action in (
    'map_existing',
    'create_product',
    'dismiss_flag',
    'mark_needs_review',
    'mark_needs_enrichment',
    'research_serpapi',
    'merge',
    'split',
    'add_product_alias',
    'add_brand_alias',
    'remove_product_photo'
  ));

create or replace function public.admin_dismiss_catalog_review_flag(
  p_flag_id uuid,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_flag public.catalog_review_flags%rowtype;
begin
  if v_admin is null or not private.is_admin() then
    raise exception 'Admin required' using errcode='42501';
  end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Reason required'; end if;

  select * into v_flag
  from public.catalog_review_flags
  where id=p_flag_id
  for update;

  if v_flag.id is null then raise exception 'Unknown catalog flag'; end if;
  if v_flag.status<>'open' then raise exception 'Catalog flag is no longer open'; end if;

  update public.catalog_review_flags
  set status='dismissed',
      resolved_by=v_admin,
      resolution_note=btrim(p_reason),
      resolved_at=now()
  where id=p_flag_id;

  insert into public.catalog_resolution_actions(
    admin_user_id,candidate_id,product_id,action,reason,details
  ) values(
    v_admin,v_flag.candidate_id,v_flag.product_id,'dismiss_flag',btrim(p_reason),
    jsonb_build_object(
      'flag_id',v_flag.id,
      'flag_type',v_flag.flag_type,
      'submission_id',v_flag.submission_id
    )
  );
end;
$$;
revoke all on function public.admin_dismiss_catalog_review_flag(uuid,text) from public,anon;
grant execute on function public.admin_dismiss_catalog_review_flag(uuid,text) to authenticated;

create or replace function public.admin_add_product_alias(
  p_product_id uuid,
  p_alias text,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_alias text:=btrim(coalesce(p_alias,''));
  v_normalized text:=public.normalize_search_text(coalesce(p_alias,''));
begin
  if v_admin is null or not private.is_admin() then
    raise exception 'Admin required' using errcode='42501';
  end if;
  if nullif(v_alias,'') is null or nullif(v_normalized,'') is null then raise exception 'Alias required'; end if;
  if char_length(v_alias)>180 then raise exception 'Alias too long'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Reason required'; end if;
  if not exists(
    select 1 from public.products
    where id=p_product_id and catalog_status<>'rejected'::public.product_data_status
  ) then raise exception 'Unknown Product'; end if;

  insert into public.product_aliases(product_id,alias,normalized_alias,created_by)
  values(p_product_id,v_alias,v_normalized,v_admin)
  on conflict(product_id,normalized_alias)
  do update set alias=excluded.alias,created_by=excluded.created_by;

  insert into public.catalog_resolution_actions(
    admin_user_id,product_id,action,reason,details
  ) values(
    v_admin,p_product_id,'add_product_alias',btrim(p_reason),
    jsonb_build_object('alias',v_alias,'normalized_alias',v_normalized)
  );
end;
$$;
revoke all on function public.admin_add_product_alias(uuid,text,text) from public,anon;
grant execute on function public.admin_add_product_alias(uuid,text,text) to authenticated;

create or replace function public.admin_add_brand_alias(
  p_brand_id uuid,
  p_alias text,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_alias text:=btrim(coalesce(p_alias,''));
  v_normalized text:=public.normalize_search_text(coalesce(p_alias,''));
  v_existing_brand uuid;
begin
  if v_admin is null or not private.is_admin() then
    raise exception 'Admin required' using errcode='42501';
  end if;
  if nullif(v_alias,'') is null or nullif(v_normalized,'') is null then raise exception 'Alias required'; end if;
  if char_length(v_alias)>120 then raise exception 'Alias too long'; end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Reason required'; end if;
  if not exists(select 1 from public.brands where id=p_brand_id) then raise exception 'Unknown Brand'; end if;

  select brand_id into v_existing_brand
  from public.brand_aliases
  where normalized_alias=v_normalized
  limit 1;

  if v_existing_brand is not null and v_existing_brand<>p_brand_id then
    raise exception 'Alias already belongs to another Brand';
  end if;

  insert into public.brand_aliases(brand_id,alias,normalized_alias)
  values(p_brand_id,v_alias,v_normalized)
  on conflict(normalized_alias)
  do update set alias=excluded.alias
  where public.brand_aliases.brand_id=excluded.brand_id;

  insert into public.catalog_resolution_actions(
    admin_user_id,action,reason,details
  ) values(
    v_admin,'add_brand_alias',btrim(p_reason),
    jsonb_build_object('brand_id',p_brand_id,'alias',v_alias,'normalized_alias',v_normalized)
  );
end;
$$;
revoke all on function public.admin_add_brand_alias(uuid,text,text) from public,anon;
grant execute on function public.admin_add_brand_alias(uuid,text,text) to authenticated;

-- Storage object deletion is performed by the authorized server action first.
-- This RPC clears the database reference and writes the required audit record.
create or replace function public.admin_clear_pending_product_photo(
  p_submission_id uuid,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_submission public.garment_submissions%rowtype;
begin
  if v_admin is null or not private.is_admin() then
    raise exception 'Admin required' using errcode='42501';
  end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Reason required'; end if;

  select * into v_submission
  from public.garment_submissions
  where id=p_submission_id
  for update;

  if v_submission.id is null then raise exception 'Unknown garment submission'; end if;
  if v_submission.product_photo_storage_path is null then raise exception 'Submission has no Product Photo'; end if;

  update public.garment_submissions
  set product_photo_storage_path=null
  where id=p_submission_id;

  insert into public.catalog_resolution_actions(
    admin_user_id,candidate_id,product_id,action,reason,details
  ) values(
    v_admin,v_submission.candidate_id,v_submission.resolved_product_id,
    'remove_product_photo',btrim(p_reason),
    jsonb_build_object(
      'source','pending_submission',
      'submission_id',v_submission.id,
      'storage_path',v_submission.product_photo_storage_path
    )
  );
end;
$$;
revoke all on function public.admin_clear_pending_product_photo(uuid,text) from public,anon;
grant execute on function public.admin_clear_pending_product_photo(uuid,text) to authenticated;

-- Storage object deletion is performed by the authorized server action first.
-- This RPC removes the canonical Product-photo evidence row and writes the audit record.
create or replace function public.admin_remove_product_photo_evidence(
  p_photo_id uuid,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_photo public.product_photo_evidence%rowtype;
begin
  if v_admin is null or not private.is_admin() then
    raise exception 'Admin required' using errcode='42501';
  end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'Reason required'; end if;

  select * into v_photo
  from public.product_photo_evidence
  where id=p_photo_id
  for update;

  if v_photo.id is null then raise exception 'Unknown Product Photo'; end if;

  delete from public.product_photo_evidence where id=p_photo_id;

  insert into public.catalog_resolution_actions(
    admin_user_id,product_id,action,reason,details
  ) values(
    v_admin,v_photo.product_id,'remove_product_photo',btrim(p_reason),
    jsonb_build_object(
      'source','canonical_product_evidence',
      'photo_id',v_photo.id,
      'storage_path',v_photo.storage_path
    )
  );
end;
$$;
revoke all on function public.admin_remove_product_photo_evidence(uuid,text) from public,anon;
grant execute on function public.admin_remove_product_photo_evidence(uuid,text) to authenticated;

comment on function public.admin_dismiss_catalog_review_flag(uuid,text) is 'Admin-only audited dismissal of a false/obsolete catalog review flag.';
comment on function public.admin_add_product_alias(uuid,text,text) is 'Admin-only audited creation/update of a reviewed hidden Product alias.';
comment on function public.admin_add_brand_alias(uuid,text,text) is 'Admin-only audited creation/update of a reviewed hidden Brand alias.';
comment on function public.admin_clear_pending_product_photo(uuid,text) is 'Admin-only DB finalization after removing an unresolved submission Product Photo from private storage.';
comment on function public.admin_remove_product_photo_evidence(uuid,text) is 'Admin-only DB finalization after removing canonical Product-photo evidence from storage.';
