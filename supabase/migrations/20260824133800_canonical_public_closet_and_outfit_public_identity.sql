-- Canonicalize the owner-locked V1 public Closet model and expose only narrow
-- published-Outfit identity/comment projections to logged-out visitors.
--
-- The legacy closet_items.visibility column remains only for replay compatibility.
-- Current product meaning has no per-garment Private / Shared state: every Closet
-- garment is member-visible, while raw body state and private catalog evidence remain
-- protected by their separate owner-only tables/RLS.

update public.closet_items
set visibility='shared'::public.closet_visibility
where visibility is distinct from 'shared'::public.closet_visibility;

alter table public.closet_items
  alter column visibility set default 'shared'::public.closet_visibility;

alter table public.closet_items
  drop constraint if exists closet_items_shared_only_current_v1;
alter table public.closet_items
  add constraint closet_items_shared_only_current_v1
  check (visibility='shared'::public.closet_visibility);

comment on column public.closet_items.visibility is
  'Legacy replay-compatibility column. Current V1 has no per-garment privacy mode; every row is locked to shared/member-visible.';

-- Current Closet/Fit evidence is member-readable. Ownership still controls writes.
drop policy if exists "owner or members read closet" on public.closet_items;
drop policy if exists "owner reads closet" on public.closet_items;
create policy "members read closet"
on public.closet_items for select to authenticated
using (true);

drop policy if exists "owner or members read shared fit reports" on public.fit_reports;
drop policy if exists "members read fit reports" on public.fit_reports;
create policy "members read fit reports"
on public.fit_reports for select to authenticated
using (true);

drop policy if exists "owner or members read shared fit dimensions" on public.fit_report_dimensions;
drop policy if exists "members read fit dimensions" on public.fit_report_dimensions;
create policy "members read fit dimensions"
on public.fit_report_dimensions for select to authenticated
using (exists (
  select 1 from public.fit_reports fr
  where fr.id=fit_report_dimensions.fit_report_id
));

drop policy if exists "owner or members read fit photo metadata" on public.fit_reference_photos;
drop policy if exists "members read fit photo metadata" on public.fit_reference_photos;
create policy "members read fit photo metadata"
on public.fit_reference_photos for select to authenticated
using (true);

drop policy if exists "owner inserts fit photo metadata" on public.fit_reference_photos;
create policy "owner inserts fit photo metadata"
on public.fit_reference_photos for insert to authenticated
with check (
  (select auth.uid())=user_id
  and exists (
    select 1 from public.closet_items ci
    where ci.id=fit_reference_photos.closet_item_id
      and ci.user_id=(select auth.uid())
  )
);

-- Fit-reference photos stay authenticated-member content, but no visibility switch is
-- required because current V1 Closet garments cannot become private.
drop policy if exists "members read shared fit reference photos" on storage.objects;
drop policy if exists "members read fit reference photos" on storage.objects;
create policy "members read fit reference photos"
on storage.objects for select to authenticated
using (
  bucket_id='fit-reference-photos'
  and exists (
    select 1 from public.fit_reference_photos fr
    where fr.storage_path=storage.objects.name
  )
);

drop policy if exists "owners upload fit reference photos" on storage.objects;
create policy "owners upload fit reference photos"
on storage.objects for insert to authenticated
with check (
  bucket_id='fit-reference-photos'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and exists (
    select 1 from public.closet_items ci
    where ci.user_id=(select auth.uid())
      and ci.id::text=(storage.foldername(name))[2]
  )
);

-- Retire the old visibility/photo coupling. Keep a single owner-integrity trigger.
drop trigger if exists fit_reference_photo_shared_guard on public.fit_reference_photos;
drop trigger if exists closet_fit_photo_visibility_guard on public.closet_items;
drop function if exists public.enforce_fit_reference_photo_shared();
drop function if exists public.prevent_private_closet_with_fit_photo();

create or replace function public.enforce_fit_reference_photo_owner()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_owner uuid;
begin
  select ci.user_id into v_owner
  from public.closet_items ci
  where ci.id=new.closet_item_id;

  if v_owner is null then
    raise exception 'Fit reference photo requires an existing Closet item';
  end if;
  if new.user_id is distinct from v_owner then
    raise exception 'Fit reference photo owner must match Closet item owner';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_fit_reference_photo_owner() from public,anon,authenticated;

create trigger fit_reference_photo_owner_guard
before insert or update of closet_item_id,user_id
on public.fit_reference_photos
for each row execute function public.enforce_fit_reference_photo_owner();

comment on function public.enforce_fit_reference_photo_owner() is
  'Current V1 invariant: Fit/reference-photo metadata must belong to the Closet owner. Closet visibility has no member-controlled state.';
comment on table public.fit_reference_photos is
  'Optional member-visible Fit/reference photos. Raw body measurements and private identity evidence remain separate and protected.';

-- First Fit Report for a garment is the public/member-visible garment activity; later
-- observations are Fit Report activity. No visibility transition is involved anymore.
drop trigger if exists closet_visibility_following_activity_after_update on public.closet_items;
drop function if exists private.record_closet_visibility_following_activity();

create or replace function private.record_fit_report_following_activity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_prior_reports bigint;
begin
  if not exists (
    select 1 from public.closet_items ci
    where ci.id=new.closet_item_id and ci.user_id=new.user_id
  ) then
    return new;
  end if;

  select count(*) into v_prior_reports
  from public.fit_reports fr
  where fr.closet_item_id=new.closet_item_id
    and fr.id<>new.id;

  insert into private.following_activity_events(
    actor_id,event_type,closet_item_id,fit_report_id,occurred_at
  ) values (
    new.user_id,
    case when v_prior_reports=0 then 'closet_shared' else 'fit_report_added' end,
    new.closet_item_id,
    new.id,
    new.created_at
  );
  return new;
end;
$$;
revoke all on function private.record_fit_report_following_activity() from public,anon,authenticated;

-- Scanner fallback may use member-visible Fit photos without consulting a retired
-- per-garment visibility state.
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
    where ci.product_id=p_product_id
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
    where gs.candidate_id=p_candidate_id
    order by case fr.photo_role when 'front' then 1 else 2 end,fr.created_at desc,fr.id
    limit 1;
  end if;

  return query select v_product_url,v_product_path,v_fit_path;
end;
$$;

-- Keep the profile table itself member-only. Logged-out Outfit pages get only the small
-- creator identity projection attached to a published Outfit.
create or replace function public.get_public_outfit_creator(p_post_id uuid)
returns table(username text,display_name text,avatar_url text)
language sql
stable
security definer
set search_path=''
as $$
  select p.username,p.display_name,p.avatar_url
  from public.outfit_posts op
  join public.profiles p on p.id=op.user_id
  where op.id=p_post_id
    and op.status='published'::public.outfit_post_status
    and p.username is not null
    and (
      auth.uid() is null
      or not private.members_blocked(auth.uid(),op.user_id)
    )
  limit 1;
$$;
revoke all on function public.get_public_outfit_creator(uuid) from public;
grant execute on function public.get_public_outfit_creator(uuid) to anon,authenticated;
comment on function public.get_public_outfit_creator(uuid) is
  'Safe logged-out identity projection for a published Outfit. It does not make the member profile table publicly readable.';

-- Logged-out visitors may read the visible comment thread, but direct comment-table access
-- (including author UUIDs) remains authenticated-only. The public projection exposes only
-- display identity already attached to a published Outfit comment.
drop policy if exists "visible outfit comments readable" on public.outfit_comments;
drop policy if exists "members read visible outfit comments" on public.outfit_comments;
create policy "members read visible outfit comments"
on public.outfit_comments for select to authenticated
using (
  exists (
    select 1 from public.outfit_posts op
    where op.id=outfit_comments.post_id
      and op.status='published'::public.outfit_post_status
      and op.comments_enabled
      and not private.members_blocked((select auth.uid()),op.user_id)
  )
);
revoke select on public.outfit_comments from anon;

drop function if exists public.get_public_outfit_comments(uuid,integer);
create function public.get_public_outfit_comments(
  p_post_id uuid,
  p_result_limit integer default 200
)
returns table(
  comment_id uuid,
  body text,
  created_at timestamptz,
  username text,
  display_name text
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_limit integer:=least(greatest(coalesce(p_result_limit,200),1),200);
begin
  return query
  select oc.id,oc.body,oc.created_at,p.username,p.display_name
  from public.outfit_comments oc
  join public.outfit_posts op on op.id=oc.post_id
  join public.profiles p on p.id=oc.user_id
  where oc.post_id=p_post_id
    and op.status='published'::public.outfit_post_status
    and op.comments_enabled
    and p.username is not null
    and (
      auth.uid() is null
      or not private.members_blocked(auth.uid(),op.user_id)
    )
  order by oc.created_at,oc.id
  limit v_limit;
end;
$$;
revoke all on function public.get_public_outfit_comments(uuid,integer) from public;
grant execute on function public.get_public_outfit_comments(uuid,integer) to anon,authenticated;
comment on function public.get_public_outfit_comments(uuid,integer) is
  'Safe logged-out published Outfit comment projection: text, time and display identity only; raw profile access and comment author UUIDs remain member-only.';
