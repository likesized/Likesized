-- Owner-locked rules:
-- 1) Member-derived material defaults are the single most commonly submitted COMPLETE composition.
--    Percentages are never averaged into a recipe no member actually submitted.
-- 2) A known Product / submitted garment-type disagreement is an identity-review problem,
--    not a Product variant. The disputed submission stays pending until admin determination.

create or replace function private.refresh_product_material_default(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_top_signature text;
  v_top_count integer;
  v_top_ties integer;
  v_representative_report uuid;
  v_status public.product_data_status;
  v_confidence numeric;
begin
  if p_product_id is null then return; end if;

  -- Any verified canonical material composition outranks member-derived defaults.
  if exists(
    select 1 from public.product_materials pm
    where pm.product_id=p_product_id
      and pm.source_status='verified'::public.product_data_status
  ) then
    delete from public.product_materials pm
    where pm.product_id=p_product_id
      and pm.source_status<>'verified'::public.product_data_status;
    return;
  end if;

  with report_compositions as (
    select
      pme.fit_report_id,
      string_agg(
        pme.material_key||':'||coalesce(trim(to_char(pme.percentage,'FM999999990.00')),'?'),
        '|' order by pme.material_key
      ) as signature
    from public.product_material_evidence pme
    join public.fit_reports fr on fr.id=pme.fit_report_id
    join public.products p on p.id=fr.product_id
    where pme.product_id=p_product_id
      and pme.fit_report_id is not null
      and pme.source_type='member'::public.product_data_source
      and pme.source_status<>'rejected'::public.product_data_status
      and pme.material_key<>'not_sure'
      and fr.product_id=p_product_id
      and (fr.garment_type_key is null or p.garment_type_key is null or fr.garment_type_key=p.garment_type_key)
    group by pme.fit_report_id
  ), composition_counts as (
    select rc.signature,count(*)::integer as vote_count
    from report_compositions rc
    where nullif(rc.signature,'') is not null
    group by rc.signature
  ), ranked as (
    select cc.*,dense_rank() over(order by cc.vote_count desc) as vote_rank
    from composition_counts cc
  )
  select
    min(r.signature) filter(where r.vote_rank=1),
    max(r.vote_count) filter(where r.vote_rank=1),
    count(*) filter(where r.vote_rank=1)::integer
  into v_top_signature,v_top_count,v_top_ties
  from ranked r;

  -- A tie means LikeSized does not pretend there is a default yet.
  if v_top_signature is null or coalesce(v_top_ties,0)<>1 then
    delete from public.product_materials pm
    where pm.product_id=p_product_id
      and pm.source_status<>'verified'::public.product_data_status;
    return;
  end if;

  with report_compositions as (
    select
      pme.fit_report_id,
      string_agg(
        pme.material_key||':'||coalesce(trim(to_char(pme.percentage,'FM999999990.00')),'?'),
        '|' order by pme.material_key
      ) as signature
    from public.product_material_evidence pme
    join public.fit_reports fr on fr.id=pme.fit_report_id
    join public.products p on p.id=fr.product_id
    where pme.product_id=p_product_id
      and pme.fit_report_id is not null
      and pme.source_type='member'::public.product_data_source
      and pme.source_status<>'rejected'::public.product_data_status
      and pme.material_key<>'not_sure'
      and fr.product_id=p_product_id
      and (fr.garment_type_key is null or p.garment_type_key is null or fr.garment_type_key=p.garment_type_key)
    group by pme.fit_report_id
  )
  select min(rc.fit_report_id)
  into v_representative_report
  from report_compositions rc
  where rc.signature=v_top_signature;

  if v_representative_report is null then return; end if;

  v_status:=case when v_top_count>=2 then 'corroborated'::public.product_data_status else 'provisional'::public.product_data_status end;
  v_confidence:=case when v_top_count>=2 then .80 else .55 end;

  delete from public.product_materials pm
  where pm.product_id=p_product_id
    and pm.source_status<>'verified'::public.product_data_status;

  insert into public.product_materials(
    product_id,material_key,percentage,source_type,source_status,confidence,source_reference,updated_at
  )
  select
    p_product_id,
    pme.material_key,
    pme.percentage,
    'member'::public.product_data_source,
    v_status,
    v_confidence,
    'fit_report_consensus:'||v_representative_report::text,
    now()
  from public.product_material_evidence pme
  where pme.fit_report_id=v_representative_report
    and pme.product_id=p_product_id
    and pme.source_type='member'::public.product_data_source
    and pme.source_status<>'rejected'::public.product_data_status
    and pme.material_key<>'not_sure'
  order by pme.material_key;
end;
$$;

revoke all on function private.refresh_product_material_default(uuid) from public,anon,authenticated;

create or replace function private.apply_product_material_evidence()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_product_id uuid:=case when tg_op='DELETE' then old.product_id else new.product_id end;
  v_source_type public.product_data_source:=case when tg_op='DELETE' then old.source_type else new.source_type end;
  v_source_status public.product_data_status:=case when tg_op='DELETE' then old.source_status else new.source_status end;
begin
  if tg_op<>'DELETE'
     and v_source_type in (
       'manufacturer'::public.product_data_source,
       'retailer'::public.product_data_source,
       'barcode_catalog'::public.product_data_source,
       'admin'::public.product_data_source,
       'system'::public.product_data_source
     )
     and v_source_status='verified'::public.product_data_status then
    insert into public.product_materials(
      product_id,material_key,percentage,source_type,source_status,confidence,source_reference,updated_at
    ) values(
      new.product_id,new.material_key,new.percentage,new.source_type,'verified',greatest(new.confidence,.95),new.source_reference,now()
    )
    on conflict(product_id,material_key) do update set
      percentage=excluded.percentage,
      source_type=excluded.source_type,
      source_status=excluded.source_status,
      confidence=excluded.confidence,
      source_reference=excluded.source_reference,
      updated_at=now();
  elsif tg_op='DELETE'
     and v_source_type in (
       'manufacturer'::public.product_data_source,
       'retailer'::public.product_data_source,
       'barcode_catalog'::public.product_data_source,
       'admin'::public.product_data_source,
       'system'::public.product_data_source
     )
     and v_source_status='verified'::public.product_data_status then
    delete from public.product_materials pm
    where pm.product_id=old.product_id
      and pm.material_key=old.material_key
      and pm.source_status='verified'::public.product_data_status
      and pm.source_reference is not distinct from old.source_reference;
  end if;

  perform private.refresh_product_material_default(v_product_id);
  return case when tg_op='DELETE' then old else new end;
end;
$$;

revoke all on function private.apply_product_material_evidence() from public,anon,authenticated;

drop trigger if exists apply_product_material_evidence_after_insert on public.product_material_evidence;
drop trigger if exists refresh_product_material_evidence_after_change on public.product_material_evidence;
create trigger refresh_product_material_evidence_after_change
after insert or update or delete on public.product_material_evidence
for each row execute function private.apply_product_material_evidence();

-- Recompute existing member-derived defaults immediately under the new whole-composition rule.
do $$
declare v_product_id uuid;
begin
  for v_product_id in
    select distinct pme.product_id
    from public.product_material_evidence pme
    where pme.source_type='member'::public.product_data_source
  loop
    perform private.refresh_product_material_default(v_product_id);
  end loop;
end;
$$;

create or replace function public.flag_known_product_garment_type_conflict(
  p_candidate_id uuid,
  p_product_id uuid,
  p_fit_report_id uuid,
  p_submitted_garment_type text
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_canonical_type text;
  v_submission_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(select 1 from public.garment_types where key=p_submitted_garment_type and intake_active) then raise exception 'Unknown submitted garment type'; end if;

  select p.garment_type_key into v_canonical_type
  from public.products p
  where p.id=p_product_id and p.catalog_status<>'rejected'::public.product_data_status;
  if not found then raise exception 'Unknown Product'; end if;
  if v_canonical_type is null or v_canonical_type=p_submitted_garment_type then raise exception 'No garment-type conflict'; end if;

  select gs.id into v_submission_id
  from public.garment_submissions gs
  where gs.candidate_id=p_candidate_id
    and gs.fit_report_id=p_fit_report_id
    and gs.user_id=v_user_id
    and gs.garment_type_key=p_submitted_garment_type;
  if v_submission_id is null then raise exception 'Unknown pending member submission'; end if;

  if not exists(
    select 1 from public.fit_reports fr
    where fr.id=p_fit_report_id and fr.user_id=v_user_id and fr.product_id is null
  ) then raise exception 'Conflicted Fit Report must remain unresolved'; end if;

  update public.catalog_candidates
  set status='needs_review',updated_at=now()
  where id=p_candidate_id and status<>'merged';

  update public.products
  set catalog_review_needed=true
  where id=p_product_id;

  insert into public.catalog_review_flags(
    flag_type,candidate_id,product_id,submission_id,details,created_by
  ) values(
    'ambiguous_identity',
    p_candidate_id,
    p_product_id,
    v_submission_id,
    jsonb_build_object(
      'reason','Known Product garment type conflicts with member submission',
      'fit_report_id',p_fit_report_id,
      'canonical_garment_type',v_canonical_type,
      'submitted_garment_type',p_submitted_garment_type,
      'resolution_rule','Admin must correct the canonical Product, map this submission to a different Product, or reject/dismiss the disputed identity.'
    ),
    v_user_id
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.flag_known_product_garment_type_conflict(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.flag_known_product_garment_type_conflict(uuid,uuid,uuid,text) to authenticated;

comment on function private.refresh_product_material_default(uuid) is
  'Derives the editable member material default from the single most commonly submitted complete Fit Report composition. Exact recipes win; percentages are never averaged.';
comment on function public.flag_known_product_garment_type_conflict(uuid,uuid,uuid,text) is
  'Flags a recognized Product / submitted garment-type disagreement for admin identity review while the Fit Report remains unresolved and excluded from canonical Product evidence.';
