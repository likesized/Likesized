-- Owner-locked follow-up flow for unresolved Unconfirmed member garments.
-- Active Unconfirmed review is invisible to the member. If an admin cannot resolve the
-- identity, the candidate may be moved to needs_more_evidence. Only then does the
-- submitting member receive a private Closet prompt to add retail/photo evidence.

alter table public.catalog_candidates
  drop constraint if exists catalog_candidates_status_check;
alter table public.catalog_candidates
  add constraint catalog_candidates_status_check
  check(status in ('pending','needs_enrichment','needs_review','needs_more_evidence','merged'));

-- Prioritize explicit member-uncertainty flags by the amount of identity evidence the
-- member supplied. Complete evidence rises first; impossible/no-evidence cases sink.
create or replace function private.recalculate_candidate_review_priority(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status public.product_data_status;
  v_candidate_status text;
  v_uncertain boolean:=false;
  v_evidence_count integer:=0;
  v_score smallint:=3;
  v_priority text:='high';
begin
  if p_candidate_id is null then return; end if;

  select c.identity_confidence,c.status,
         exists(select 1 from public.garment_submissions gs where gs.candidate_id=c.id and gs.identity_uncertain),
         greatest(
           case when exists(select 1 from public.garment_submissions gs where gs.candidate_id=c.id and nullif(btrim(coalesce(gs.retailer_url,'')),'') is not null) then 1 else 0 end,
           0
         )
         + case when exists(select 1 from public.garment_submissions gs where gs.candidate_id=c.id and gs.product_photo_storage_path is not null) then 1 else 0 end
         + case when exists(select 1 from public.garment_submissions gs where gs.candidate_id=c.id and gs.product_label_photo_storage_path is not null) then 1 else 0 end
  into v_status,v_candidate_status,v_uncertain,v_evidence_count
  from public.catalog_candidates c
  where c.id=p_candidate_id;

  if v_status is null then return; end if;
  v_uncertain:=v_uncertain or v_status='unconfirmed'::public.product_data_status;

  if v_uncertain then
    -- Needs More Evidence is intentionally outside the active work queue. Keep its
    -- retained flag low-priority until the member adds new evidence and reopens review.
    if v_candidate_status='needs_more_evidence' then
      v_score:=1;
    elsif v_evidence_count>=3 then
      v_score:=3;
    elsif v_evidence_count>=1 then
      v_score:=2;
    else
      v_score:=1;
    end if;
  elsif v_status='verified'::public.product_data_status then
    v_score:=1;
  else
    v_score:=3;
  end if;

  v_priority:=case v_score when 3 then 'high' when 2 then 'medium' else 'low' end;
  update public.catalog_review_flags
  set priority=v_priority,priority_score=v_score
  where candidate_id=p_candidate_id and status='open'
    and (priority is distinct from v_priority or priority_score is distinct from v_score);
end;
$$;
revoke all on function private.recalculate_candidate_review_priority(uuid) from public,anon,authenticated;

-- Status changes must also refresh candidate priority because needs_more_evidence is a
-- queue-state change even though identity_confidence remains Unconfirmed.
create or replace function private.refresh_candidate_review_priority_after_status()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.recalculate_candidate_review_priority(new.id);
  return new;
end;
$$;
revoke all on function private.refresh_candidate_review_priority_after_status() from public,anon,authenticated;

drop trigger if exists candidate_review_priority_after_status on public.catalog_candidates;
create trigger candidate_review_priority_after_status
after update of identity_confidence,identity_conflict_count,status on public.catalog_candidates
for each row execute function private.refresh_candidate_review_priority_after_status();

-- Extend the existing audited admin status control rather than creating a parallel
-- queue mutation API. needs_more_evidence removes an impossible case from active review
-- without resolving, publishing, or changing its Unconfirmed identity state.
create or replace function public.admin_set_catalog_candidate_status(p_candidate_id uuid,p_status text,p_reason text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_admin uuid:=auth.uid(); v_action text;
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

  v_action:=case when p_status='needs_review' then 'mark_needs_review' else 'mark_needs_enrichment' end;
  insert into public.catalog_resolution_actions(admin_user_id,candidate_id,action,reason,details)
  values(v_admin,p_candidate_id,v_action,btrim(p_reason),jsonb_build_object('candidate_status',p_status));
  perform private.recalculate_candidate_review_priority(p_candidate_id);
end;
$$;
revoke all on function public.admin_set_catalog_candidate_status(uuid,text,text) from public,anon;
grant execute on function public.admin_set_catalog_candidate_status(uuid,text,text) to authenticated;

-- Private member-facing status projection. This does not grant members read access to
-- the admin candidate table and can only return the caller's own unresolved submission.
create or replace function public.get_own_unconfirmed_submission_status()
returns table(
  closet_item_id uuid,
  candidate_id uuid,
  candidate_status text,
  retailer_url text,
  has_product_photo boolean,
  has_label_photo boolean
)
language sql
security definer
set search_path=''
as $$
  select gs.closet_item_id,gs.candidate_id,c.status,gs.retailer_url,
         gs.product_photo_storage_path is not null,
         gs.product_label_photo_storage_path is not null
  from public.garment_submissions gs
  join public.catalog_candidates c on c.id=gs.candidate_id
  where gs.user_id=(select auth.uid())
    and gs.identity_uncertain
    and c.resolved_product_id is null
    and c.identity_confidence='unconfirmed'::public.product_data_status;
$$;
revoke all on function public.get_own_unconfirmed_submission_status() from public,anon;
grant execute on function public.get_own_unconfirmed_submission_status() to authenticated;

-- Member re-submission updates only their evidence for the unresolved item. It never
-- edits Product truth. New evidence automatically returns Needs More Evidence to the
-- active admin review queue and refreshes the retained flag priority.
create or replace function public.add_unconfirmed_catalog_evidence(
  p_closet_item_id uuid,
  p_retailer_url text default null,
  p_normalized_retailer_url text default null,
  p_product_photo_storage_path text default null,
  p_product_label_photo_storage_path text default null
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_submission public.garment_submissions%rowtype;
  v_candidate_id uuid;
  v_retail text:=nullif(btrim(coalesce(p_retailer_url,'')),'');
  v_normalized text:=nullif(btrim(coalesce(p_normalized_retailer_url,'')),'');
  v_product_path text:=nullif(btrim(coalesce(p_product_photo_storage_path,'')),'');
  v_label_path text:=nullif(btrim(coalesce(p_product_label_photo_storage_path,'')),'');
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;

  select gs.* into v_submission
  from public.garment_submissions gs
  join public.catalog_candidates c on c.id=gs.candidate_id
  where gs.closet_item_id=p_closet_item_id
    and gs.user_id=v_user
    and gs.identity_uncertain
    and c.resolved_product_id is null
    and c.identity_confidence='unconfirmed'::public.product_data_status
  for update of gs;
  if v_submission.id is null then raise exception 'Unconfirmed garment not found'; end if;
  v_candidate_id:=v_submission.candidate_id;

  if v_retail is null and v_product_path is null and v_label_path is null then
    raise exception 'Add at least one new piece of identity evidence';
  end if;

  update public.garment_submissions
  set retailer_url=coalesce(v_retail,retailer_url),
      normalized_retailer_url=coalesce(v_normalized,normalized_retailer_url),
      product_photo_storage_path=coalesce(v_product_path,product_photo_storage_path),
      product_label_photo_storage_path=coalesce(v_label_path,product_label_photo_storage_path)
  where id=v_submission.id;

  update public.catalog_candidates
  set status='needs_review',updated_at=now()
  where id=v_candidate_id and resolved_product_id is null;

  update public.catalog_review_flags
  set details=coalesce(details,'{}'::jsonb)||jsonb_build_object(
        'reason','Member explicitly marked the item/style/model identity as uncertain',
        'member_added_followup_evidence',true,
        'retail_link_provided',coalesce(v_retail,v_submission.retailer_url) is not null,
        'product_photo_provided',coalesce(v_product_path,v_submission.product_photo_storage_path) is not null,
        'label_photo_provided',coalesce(v_label_path,v_submission.product_label_photo_storage_path) is not null
      ),
      created_at=now()
  where candidate_id=v_candidate_id and status='open' and flag_type='ambiguous_identity';

  if not found then
    insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
    values('ambiguous_identity',v_candidate_id,jsonb_build_object(
      'reason','Member explicitly marked the item/style/model identity as uncertain',
      'member_added_followup_evidence',true,
      'retail_link_provided',coalesce(v_retail,v_submission.retailer_url) is not null,
      'product_photo_provided',coalesce(v_product_path,v_submission.product_photo_storage_path) is not null,
      'label_photo_provided',coalesce(v_label_path,v_submission.product_label_photo_storage_path) is not null
    ),v_user)
    on conflict do nothing;
  end if;

  perform private.recalculate_candidate_review_priority(v_candidate_id);
  return v_candidate_id;
end;
$$;
revoke all on function public.add_unconfirmed_catalog_evidence(uuid,text,text,text,text) from public,anon;
grant execute on function public.add_unconfirmed_catalog_evidence(uuid,text,text,text,text) to authenticated;

comment on function public.get_own_unconfirmed_submission_status() is
  'Private owner-only projection used to show Needs More Evidence only in the submitting member own Closet.';
comment on function public.add_unconfirmed_catalog_evidence(uuid,text,text,text,text) is
  'Adds owner-supplied identification evidence to an unresolved Unconfirmed garment and returns it to active admin review without creating Product truth.';
