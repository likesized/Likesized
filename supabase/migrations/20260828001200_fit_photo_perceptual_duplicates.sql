-- Roadmap 13A perceptual duplicate detection for canonical Product-image candidates.
-- Fingerprints stay private; public Fit Photo rows expose only duplicate_of selection state.

alter table public.canonical_product_image_config
  add column perceptual_duplicate_hamming_distance smallint not null default 5
  check (perceptual_duplicate_hamming_distance between 0 and 16);

create table private.fit_photo_perceptual_fingerprints (
  fit_reference_photo_id uuid primary key references public.fit_reference_photos(id) on delete cascade,
  fingerprint bit(64) not null,
  algorithm text not null default 'dhash64_v1' check (algorithm='dhash64_v1'),
  recorded_at timestamptz not null default now()
);
revoke all on private.fit_photo_perceptual_fingerprints from public,anon,authenticated;

create or replace function private.fit_photo_rank_is_better(
  p_left_score smallint,
  p_left_role text,
  p_left_created_at timestamptz,
  p_left_id uuid,
  p_right_score smallint,
  p_right_role text,
  p_right_created_at timestamptz,
  p_right_id uuid
) returns boolean
language sql immutable set search_path=''
as $$
  select
    coalesce(p_left_score,-1) > coalesce(p_right_score,-1)
    or (
      coalesce(p_left_score,-1) = coalesce(p_right_score,-1)
      and case p_left_role when 'front' then 0 else 1 end < case p_right_role when 'front' then 0 else 1 end
    )
    or (
      coalesce(p_left_score,-1) = coalesce(p_right_score,-1)
      and case p_left_role when 'front' then 0 else 1 end = case p_right_role when 'front' then 0 else 1 end
      and p_left_created_at > p_right_created_at
    )
    or (
      coalesce(p_left_score,-1) = coalesce(p_right_score,-1)
      and case p_left_role when 'front' then 0 else 1 end = case p_right_role when 'front' then 0 else 1 end
      and p_left_created_at = p_right_created_at
      and p_left_id < p_right_id
    );
$$;
revoke all on function private.fit_photo_rank_is_better(smallint,text,timestamptz,uuid,smallint,text,timestamptz,uuid) from public,anon,authenticated;

create or replace function private.assign_fit_photo_duplicate(p_photo_id uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_product_id uuid;
  v_fingerprint bit(64);
  v_score smallint;
  v_role text;
  v_created_at timestamptz;
  v_threshold smallint:=5;
  v_better_id uuid;
begin
  select ci.product_id,f.fingerprint,fp.photo_quality_score,fp.photo_role::text,fp.created_at
    into v_product_id,v_fingerprint,v_score,v_role,v_created_at
  from public.fit_reference_photos fp
  join public.closet_items ci on ci.id=fp.closet_item_id
  join private.fit_photo_perceptual_fingerprints f on f.fit_reference_photo_id=fp.id
  where fp.id=p_photo_id;

  if not found or v_product_id is null then
    update public.fit_reference_photos set duplicate_of=null where id=p_photo_id and duplicate_of is not null;
    return;
  end if;

  select perceptual_duplicate_hamming_distance into v_threshold
  from public.canonical_product_image_config where singleton=true;
  v_threshold:=coalesce(v_threshold,5);

  update public.fit_reference_photos set duplicate_of=null where id=p_photo_id and duplicate_of is not null;

  select fp.id into v_better_id
  from public.fit_reference_photos fp
  join public.closet_items ci on ci.id=fp.closet_item_id
  join private.fit_photo_perceptual_fingerprints f on f.fit_reference_photo_id=fp.id
  where ci.product_id=v_product_id
    and fp.id<>p_photo_id
    and fp.duplicate_of is null
    and bit_count(f.fingerprint # v_fingerprint)<=v_threshold
    and private.fit_photo_rank_is_better(
      fp.photo_quality_score,fp.photo_role::text,fp.created_at,fp.id,
      v_score,v_role,v_created_at,p_photo_id
    )
  order by fp.photo_quality_score desc,
           case fp.photo_role when 'front' then 0 else 1 end,
           fp.created_at desc,
           fp.id
  limit 1;

  if v_better_id is not null then
    update public.fit_reference_photos set duplicate_of=v_better_id where id=p_photo_id;
    return;
  end if;

  -- This photo is the best-ranked member of every nearby active anchor it overlaps.
  -- Repoint those anchors and their direct children to the new representative so
  -- duplicate_of never needs to form a chain.
  with near_anchors as (
    select fp.id
    from public.fit_reference_photos fp
    join public.closet_items ci on ci.id=fp.closet_item_id
    join private.fit_photo_perceptual_fingerprints f on f.fit_reference_photo_id=fp.id
    where ci.product_id=v_product_id
      and fp.id<>p_photo_id
      and fp.duplicate_of is null
      and bit_count(f.fingerprint # v_fingerprint)<=v_threshold
  )
  update public.fit_reference_photos fp
  set duplicate_of=p_photo_id
  where fp.id in (select id from near_anchors)
     or fp.duplicate_of in (select id from near_anchors);
end;
$$;
revoke all on function private.assign_fit_photo_duplicate(uuid) from public,anon,authenticated;

create or replace function public.record_fit_photo_perceptual_fingerprint(
  p_photo_id uuid,
  p_perceptual_hash text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_product_id uuid;
  v_released uuid[];
  v_photo_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_perceptual_hash is null or p_perceptual_hash !~ '^[01]{64}$' then raise exception 'Invalid perceptual fingerprint'; end if;

  select ci.product_id into v_product_id
  from public.fit_reference_photos fp
  join public.closet_items ci on ci.id=fp.closet_item_id
  where fp.id=p_photo_id and fp.user_id=v_user_id;
  if not found then raise exception 'Fit Photo not found or not owned by current user' using errcode='42501'; end if;

  select array_agg(id) into v_released
  from public.fit_reference_photos
  where duplicate_of=p_photo_id;

  update public.fit_reference_photos
  set duplicate_of=null
  where id=p_photo_id or duplicate_of=p_photo_id;

  insert into private.fit_photo_perceptual_fingerprints(fit_reference_photo_id,fingerprint,algorithm,recorded_at)
  values(p_photo_id,p_perceptual_hash::bit(64),'dhash64_v1',now())
  on conflict(fit_reference_photo_id) do update
    set fingerprint=excluded.fingerprint,algorithm=excluded.algorithm,recorded_at=now();

  perform private.assign_fit_photo_duplicate(p_photo_id);
  foreach v_photo_id in array coalesce(v_released,array[]::uuid[]) loop
    perform private.assign_fit_photo_duplicate(v_photo_id);
  end loop;

  perform private.recompute_canonical_product_images(v_product_id);
end;
$$;
revoke all on function public.record_fit_photo_perceptual_fingerprint(uuid,text) from public,anon;
grant execute on function public.record_fit_photo_perceptual_fingerprint(uuid,text) to authenticated;

create or replace function private.refresh_fit_photo_duplicates_after_closet_product_change()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_photo_id uuid;
  v_released uuid[];
  v_released_id uuid;
begin
  if old.product_id is not distinct from new.product_id then return new; end if;

  for v_photo_id in
    select fp.id from public.fit_reference_photos fp where fp.closet_item_id=new.id
  loop
    select array_agg(id) into v_released
    from public.fit_reference_photos
    where duplicate_of=v_photo_id;

    update public.fit_reference_photos
    set duplicate_of=null
    where id=v_photo_id or duplicate_of=v_photo_id;

    perform private.assign_fit_photo_duplicate(v_photo_id);
    foreach v_released_id in array coalesce(v_released,array[]::uuid[]) loop
      perform private.assign_fit_photo_duplicate(v_released_id);
    end loop;
  end loop;

  perform private.recompute_canonical_product_images(old.product_id);
  perform private.recompute_canonical_product_images(new.product_id);
  return new;
end;
$$;
revoke all on function private.refresh_fit_photo_duplicates_after_closet_product_change() from public,anon,authenticated;
create trigger refresh_fit_photo_duplicates_after_closet_product_change
  after update of product_id on public.closet_items
  for each row execute function private.refresh_fit_photo_duplicates_after_closet_product_change();

create or replace function private.repair_fit_photo_duplicates_before_delete()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_product_id uuid;
  v_released uuid[];
  v_photo_id uuid;
begin
  select ci.product_id into v_product_id
  from public.closet_items ci where ci.id=old.closet_item_id;

  select array_agg(id) into v_released
  from public.fit_reference_photos
  where duplicate_of=old.id;

  delete from private.fit_photo_perceptual_fingerprints
  where fit_reference_photo_id=old.id;

  update public.fit_reference_photos
  set duplicate_of=null
  where duplicate_of=old.id;

  foreach v_photo_id in array coalesce(v_released,array[]::uuid[]) loop
    perform private.assign_fit_photo_duplicate(v_photo_id);
  end loop;

  perform private.recompute_canonical_product_images(v_product_id);
  return old;
end;
$$;
revoke all on function private.repair_fit_photo_duplicates_before_delete() from public,anon,authenticated;
create trigger repair_fit_photo_duplicates_before_delete
  before delete on public.fit_reference_photos
  for each row execute function private.repair_fit_photo_duplicates_before_delete();

comment on table private.fit_photo_perceptual_fingerprints is 'Private Roadmap 13A dHash fingerprints used only to prevent perceptually duplicate Fit Photos from competing as separate canonical Product-image candidates.';
comment on function public.record_fit_photo_perceptual_fingerprint(uuid,text) is 'Owner-scoped registration boundary for a 64-bit dHash produced with Fit Photo technical analysis; the fingerprint itself is never member-readable.';
