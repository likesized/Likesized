-- Foundation Technical Audit hardening.
-- This migration narrows private catalog-evidence authorization, hardens direct scanner
-- image access, and keeps resolved candidate history from blocking a later unresolved
-- submission for the same normalized Brand + Item + Garment Type identity.

-- Pending Product Photo and Product Label / Tag Photo paths are separate evidence roles.
-- A SECURITY DEFINER intake call must not be able to attach an arbitrary storage key to
-- a member submission, even when the caller owns the pending Fit Report.
alter table public.garment_submissions
  drop constraint if exists garment_submissions_product_photo_path_owner_check;
alter table public.garment_submissions
  add constraint garment_submissions_product_photo_path_owner_check
  check (
    product_photo_storage_path is null
    or product_photo_storage_path like user_id::text || '/pending/' || closet_item_id::text || '/product-%'
  );

alter table public.garment_submissions
  drop constraint if exists garment_submissions_label_photo_path_owner_check;
alter table public.garment_submissions
  add constraint garment_submissions_label_photo_path_owner_check
  check (
    product_label_photo_storage_path is null
    or product_label_photo_storage_path like user_id::text || '/pending/' || closet_item_id::text || '/label-%'
  );

-- Known-Product label/tag evidence is private review evidence. Bind its storage path to
-- the submitting member + exact Product + exact Fit Report, and bind the Fit Report to
-- the same Product explicitly. The previous policy used an unqualified Product column
-- inside the correlated subquery, allowing the comparison to collapse into a tautology.
alter table public.product_label_photo_evidence
  drop constraint if exists product_label_photo_evidence_storage_path_owner_check;
alter table public.product_label_photo_evidence
  add constraint product_label_photo_evidence_storage_path_owner_check
  check (
    submitted_by is null
    or storage_path like submitted_by::text || '/labels/' || product_id::text || '/' || fit_report_id::text || '/%'
  );

drop policy if exists "Members add own Product label photos" on public.product_label_photo_evidence;
create policy "Members add own Product label photos"
  on public.product_label_photo_evidence for insert to authenticated
  with check (
    product_label_photo_evidence.submitted_by = (select auth.uid())
    and product_label_photo_evidence.storage_path like
      (select auth.uid())::text || '/labels/' || product_label_photo_evidence.product_id::text || '/' || product_label_photo_evidence.fit_report_id::text || '/%'
    and exists (
      select 1
      from public.fit_reports fr
      where fr.id = product_label_photo_evidence.fit_report_id
        and fr.user_id = (select auth.uid())
        and fr.product_id = product_label_photo_evidence.product_id
    )
  );

-- The catalog-submission bucket contains both member-shareable pending Product Photos
-- and private Product Label / Tag Photos. Do not grant bucket-wide SELECT. Other signed-
-- in members may read only a Product Photo that belongs to an unresolved candidate that
-- is actually eligible for member scanner confirmation. Owners/admins retain their
-- separate owner/admin policy.
drop policy if exists "Members read catalog submission product photos" on storage.objects;
create policy "Members read catalog submission product photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'catalog-submission-photos'
    and exists (
      select 1
      from public.garment_submissions gs
      join public.catalog_candidates c on c.id = gs.candidate_id
      where gs.product_photo_storage_path = storage.objects.name
        and not gs.identity_uncertain
        and c.resolved_product_id is null
        and c.status not in ('merged','needs_more_evidence')
        and c.identity_confidence <> 'unconfirmed'::public.product_data_status
    )
  );

-- Direct calls to the scanner image RPC must enforce the same candidate eligibility as
-- the scanner lookup/confirmation flow. Knowing or guessing a candidate UUID must not
-- expose Product/Fit photo paths for Unconfirmed or Needs More Evidence review cases.
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
    if not exists(
      select 1 from public.products
      where id=p_product_id and catalog_status<>'rejected'::public.product_data_status
    ) then return; end if;

    select pe.public_url,pe.storage_path into v_product_url,v_product_path
    from public.product_photo_evidence pe
    where pe.product_id=p_product_id and pe.source_status<>'rejected'::public.product_data_status
    order by case pe.source_status::text when 'verified' then 1 when 'corroborated' then 2 else 3 end,
             pe.created_at desc,pe.id
    limit 1;

    select fr.storage_path into v_fit_path
    from public.fit_reference_photos fr
    join public.closet_items ci on ci.id=fr.closet_item_id
    where ci.product_id=p_product_id and ci.visibility='shared'::public.closet_visibility
    order by case fr.photo_role when 'front' then 1 else 2 end,fr.created_at desc,fr.id
    limit 1;
  else
    if not exists(
      select 1
      from public.catalog_candidates c
      where c.id=p_candidate_id
        and c.resolved_product_id is null
        and c.status not in ('merged','needs_more_evidence')
        and c.identity_confidence<>'unconfirmed'::public.product_data_status
        and not exists(
          select 1 from public.garment_submissions gs
          where gs.candidate_id=c.id and gs.identity_uncertain
        )
    ) then return; end if;

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

-- catalog_candidates.identity_key is the aggregation key for an unresolved identity.
-- Once a candidate is resolved, archive the key with that candidate UUID so the unique
-- constraint continues enforcing exactly one *unresolved* base identity without making
-- resolved history block a later explicit uncertainty/review case.
create or replace function private.archive_catalog_candidate_identity_key_on_resolution()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if old.resolved_product_id is null
     and new.resolved_product_id is not null
     and new.identity_key = old.identity_key
  then
    new.identity_key := old.identity_key || '|resolved|' || new.id::text;
  end if;
  return new;
end;
$$;
revoke all on function private.archive_catalog_candidate_identity_key_on_resolution() from public,anon,authenticated;

drop trigger if exists catalog_candidate_archive_identity_key_before_resolution on public.catalog_candidates;
create trigger catalog_candidate_archive_identity_key_before_resolution
before update of resolved_product_id on public.catalog_candidates
for each row execute function private.archive_catalog_candidate_identity_key_on_resolution();

-- Backfill already-resolved history so the canonical unresolved identity key is free for
-- a later submission. Normalized Brand/Item/Type columns remain unchanged audit truth.
update public.catalog_candidates
set identity_key = identity_key || '|resolved|' || id::text,
    updated_at = now()
where resolved_product_id is not null
  and identity_key not like '%|resolved|%';

-- Needs More Evidence already works operationally; make its audit action say what the
-- admin actually did instead of recording it as generic enrichment.
alter table public.catalog_resolution_actions
  drop constraint if exists catalog_resolution_actions_action_check;
alter table public.catalog_resolution_actions
  add constraint catalog_resolution_actions_action_check check(action in (
    'map_existing','create_product','dismiss_flag','mark_needs_review','mark_needs_enrichment',
    'mark_needs_more_evidence','research_serpapi','merge','split','add_product_alias',
    'add_brand_alias','remove_product_photo','auto_map_existing','auto_create_product'
  ));

create or replace function public.admin_set_catalog_candidate_status(
  p_candidate_id uuid,
  p_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_action text;
begin
  if v_admin is null or not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
  if p_status not in ('pending','needs_enrichment','needs_review','needs_more_evidence') or nullif(btrim(p_reason),'') is null then raise exception 'Invalid status/reason'; end if;

  if p_status='needs_more_evidence' and not exists(
    select 1 from public.catalog_candidates c
    where c.id=p_candidate_id and c.resolved_product_id is null
      and (c.identity_confidence='unconfirmed'::public.product_data_status
        or exists(select 1 from public.garment_submissions gs where gs.candidate_id=c.id and gs.identity_uncertain))
  ) then raise exception 'Only unresolved Unconfirmed items can request more member evidence'; end if;

  update public.catalog_candidates set status=p_status,updated_at=now()
  where id=p_candidate_id and resolved_product_id is null;
  if not found then raise exception 'Unknown or resolved candidate'; end if;

  v_action:=case
    when p_status='needs_review' then 'mark_needs_review'
    when p_status='needs_more_evidence' then 'mark_needs_more_evidence'
    else 'mark_needs_enrichment'
  end;
  insert into public.catalog_resolution_actions(admin_user_id,candidate_id,action,reason,details)
  values(v_admin,p_candidate_id,v_action,btrim(p_reason),jsonb_build_object('candidate_status',p_status));
  perform private.recalculate_candidate_review_priority(p_candidate_id);
end;
$$;
