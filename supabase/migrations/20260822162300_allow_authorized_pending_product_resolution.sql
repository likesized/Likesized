-- Preserve Fit Report immutability while allowing the one submission-first
-- transition that did not exist when the original history lock was written:
-- an unresolved historical garment may be assigned its canonical Product once
-- through the private admin catalog-resolution function. Resolved Product/body/
-- size associations remain immutable.

create or replace function private.lock_fit_report_history()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_version_user_id uuid;
  v_catalog_resolution boolean:=coalesce(current_setting('likesized.catalog_resolution',true),'off')='on';
begin
  if tg_op='INSERT' then
    if new.fit_profile_version_id is null then
      new.fit_profile_version_id := private.ensure_fit_profile_version_for_user(new.user_id,'fit_report_lock');
    end if;

    select fpv.user_id into v_version_user_id
    from public.fit_profile_versions fpv
    where fpv.id=new.fit_profile_version_id;

    if v_version_user_id is distinct from new.user_id then
      raise exception 'Fit Report snapshot does not belong to this user';
    end if;

    return new;
  end if;

  -- Catalog resolution may fill a previously unknown Product/variant exactly once.
  -- The member, immutable body snapshot, Closet item, size, and all personal Fit
  -- Report evidence remain unchanged, and the resolved association must already
  -- agree with the owner-owned Closet row updated by the same private resolver.
  if v_catalog_resolution
     and old.product_id is null
     and new.product_id is not null
     and old.variant_id is null
     and new.fit_profile_version_id is not distinct from old.fit_profile_version_id
     and new.user_id is not distinct from old.user_id
     and new.closet_item_id is not distinct from old.closet_item_id
     and new.size_label is not distinct from old.size_label
     and new.normalized_size_id is not distinct from old.normalized_size_id
     and exists (
       select 1
       from public.closet_items ci
       where ci.id=new.closet_item_id
         and ci.user_id=new.user_id
         and ci.product_id=new.product_id
         and ci.variant_id is not distinct from new.variant_id
         and ci.normalized_size_id is not distinct from new.normalized_size_id
         and ci.size_label=new.size_label
     ) then
    return new;
  end if;

  if new.fit_profile_version_id is distinct from old.fit_profile_version_id
     or new.user_id is distinct from old.user_id
     or new.closet_item_id is distinct from old.closet_item_id
     or new.product_id is distinct from old.product_id
     or new.variant_id is distinct from old.variant_id
     or new.size_label is distinct from old.size_label
     or new.normalized_size_id is distinct from old.normalized_size_id then
    raise exception 'Historical Fit Report garment/body association is immutable; create a new Fit Report observation instead';
  end if;

  return new;
end;
$$;
revoke all on function private.lock_fit_report_history() from public,anon,authenticated;

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
      where id=v_submission.closet_item_id and user_id=v_submission.user_id and product_id is null;
    if not found then raise exception 'Pending Closet item is no longer unresolved'; end if;

    perform set_config('likesized.catalog_resolution','on',true);
    update public.fit_reports set product_id=p_product_id,variant_id=v_variant_id,updated_at=now()
      where id=v_submission.fit_report_id and user_id=v_submission.user_id and product_id is null;
    perform set_config('likesized.catalog_resolution','off',true);
    if not found then raise exception 'Pending Fit Report is no longer unresolved'; end if;

    update public.garment_submissions set resolved_product_id=p_product_id,resolved_at=now()
      where id=v_submission.id;
  end loop;

  perform set_config('likesized.catalog_resolution','off',true);

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

comment on function private.lock_fit_report_history() is
  'Locks historical Fit Report body/garment identity. The sole Product-association exception is first-time NULL-to-canonical resolution inside the private catalog resolver.';
