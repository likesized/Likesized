-- Roadmap 13A: one canonical Product-image scoring and selection system.
-- Reuses existing Fit Photo and Product Photo evidence; no parallel image-evidence store.

alter table public.fit_reference_photos
  add column garment_visibility_score smallint not null default 100 check (garment_visibility_score between 0 and 100),
  add column sharpness_score smallint not null default 50 check (sharpness_score between 0 and 100),
  add column resolution_score smallint not null default 50 check (resolution_score between 0 and 100),
  add column framing_score smallint not null default 50 check (framing_score between 0 and 100),
  add column exposure_score smallint not null default 50 check (exposure_score between 0 and 100),
  add column image_width integer check (image_width is null or image_width > 0),
  add column image_height integer check (image_height is null or image_height > 0),
  add column duplicate_of uuid references public.fit_reference_photos(id) on delete set null,
  add column canonical_eligible boolean not null default true,
  add column canonical_ineligible_reason text check (canonical_ineligible_reason is null or char_length(canonical_ineligible_reason) <= 500),
  add column quality_source text not null default 'legacy_neutral' check (quality_source in ('legacy_neutral','automatic','admin')),
  add column quality_scored_at timestamptz,
  add column photo_quality_score smallint generated always as (
    round((
      garment_visibility_score * 35
      + sharpness_score * 20
      + resolution_score * 15
      + framing_score * 20
      + exposure_score * 10
    )::numeric / 100)::smallint
  ) stored;

update public.fit_reference_photos
set quality_scored_at = coalesce(quality_scored_at, created_at)
where quality_scored_at is null;

create index fit_reference_photos_canonical_score_idx
  on public.fit_reference_photos(photo_quality_score desc, created_at desc)
  where canonical_eligible and duplicate_of is null;

-- Tracked variation is deliberately separate from the counted-report objective fingerprint.
-- Current V1 stores only owner-audited controlled item questions in garment_answers; every
-- currently asked question is variation-defining. Size and Color live outside garment_answers.
-- The two retired question keys below must stay inert for historical rows.
alter table public.fit_reports
  add column tracked_variation_key text
  check (tracked_variation_key is null or tracked_variation_key ~ '^[0-9a-f]{64}$');

create or replace function private.current_tracked_variation_key(
  p_garment_type_key text,
  p_garment_answers jsonb
) returns text
language plpgsql stable security definer set search_path=''
as $$
declare
  v_answers text;
  v_payload text;
begin
  if p_garment_type_key is null then return null; end if;
  if not exists(
    select 1 from public.garment_types gt
    where gt.key=p_garment_type_key and gt.intake_active
  ) then return null; end if;
  if pg_catalog.jsonb_typeof(coalesce(p_garment_answers,'{}'::jsonb)) <> 'object' then return null; end if;

  select pg_catalog.string_agg(e.key||'='||e.value,'|' order by e.key)
    into v_answers
  from pg_catalog.jsonb_each_text(coalesce(p_garment_answers,'{}'::jsonb)) e
  where e.key not in ('intended_fit','shoe_use')
    and e.value <> 'not_sure';

  v_payload:=p_garment_type_key||'|'||coalesce(v_answers,'');
  return pg_catalog.md5(v_payload)||pg_catalog.md5('tracked-v1|'||v_payload);
end;
$$;
revoke all on function private.current_tracked_variation_key(text,jsonb) from public,anon,authenticated;

create or replace function private.set_fit_report_tracked_variation_key()
returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  new.tracked_variation_key:=private.current_tracked_variation_key(new.garment_type_key,new.garment_answers);
  return new;
end;
$$;
revoke all on function private.set_fit_report_tracked_variation_key() from public,anon,authenticated;
create trigger set_fit_report_tracked_variation_key
  before insert or update of garment_type_key,garment_answers
  on public.fit_reports
  for each row execute function private.set_fit_report_tracked_variation_key();

update public.fit_reports fr
set tracked_variation_key=private.current_tracked_variation_key(fr.garment_type_key,fr.garment_answers)
where fr.garment_type_key is not null;

create index fit_reports_tracked_variation_idx
  on public.fit_reports(product_id,tracked_variation_key,created_at desc)
  where product_id is not null and tracked_variation_key is not null;

create table public.canonical_product_image_config (
  singleton boolean primary key default true check (singleton),
  fit_photo_replacement_margin smallint not null default 5 check (fit_photo_replacement_margin between 0 and 25),
  updated_at timestamptz not null default now()
);
insert into public.canonical_product_image_config(singleton,fit_photo_replacement_margin)
values(true,5)
on conflict(singleton) do nothing;
revoke all on public.canonical_product_image_config from public,anon,authenticated;

create table public.canonical_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variation_key text,
  source_kind text not null check (source_kind in ('fit_reference_photo','product_photo_evidence','official_product_image')),
  fit_reference_photo_id uuid references public.fit_reference_photos(id) on delete cascade,
  product_photo_evidence_id uuid references public.product_photo_evidence(id) on delete cascade,
  source_image_url text,
  photo_quality_score smallint check (photo_quality_score is null or photo_quality_score between 0 and 100),
  canonical_locked boolean not null default false,
  locked_by uuid references auth.users(id) on delete set null,
  lock_reason text check (lock_reason is null or char_length(lock_reason) <= 500),
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_kind='fit_reference_photo' and fit_reference_photo_id is not null and product_photo_evidence_id is null and source_image_url is null)
    or (source_kind='product_photo_evidence' and fit_reference_photo_id is null and product_photo_evidence_id is not null and source_image_url is null)
    or (source_kind='official_product_image' and fit_reference_photo_id is null and product_photo_evidence_id is null and source_image_url is not null)
  ),
  check ((canonical_locked and locked_by is not null and lock_reason is not null) or not canonical_locked)
);
create unique index canonical_product_images_product_default_uq
  on public.canonical_product_images(product_id)
  where variation_key is null;
create unique index canonical_product_images_product_variation_uq
  on public.canonical_product_images(product_id,variation_key)
  where variation_key is not null;
create index canonical_product_images_product_lookup_idx
  on public.canonical_product_images(product_id,variation_key);

alter table public.canonical_product_images enable row level security;
create policy "Members read canonical Product image selections"
on public.canonical_product_images for select to authenticated
using (true);
grant select on public.canonical_product_images to authenticated;

create table public.canonical_product_image_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id) on delete cascade,
  variation_key text,
  action text not null check (action in ('set','lock','unlock','mark_eligible','mark_ineligible')),
  source_kind text,
  source_id uuid,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
create index canonical_product_image_actions_product_idx
  on public.canonical_product_image_actions(product_id,created_at desc);
alter table public.canonical_product_image_actions enable row level security;
create policy "Admins read canonical Product image audit"
on public.canonical_product_image_actions for select to authenticated
using (private.is_admin());
grant select on public.canonical_product_image_actions to authenticated;

create or replace function private.fit_photo_product_id(p_photo_id uuid)
returns uuid
language sql stable security definer set search_path=''
as $$
  select ci.product_id
  from public.fit_reference_photos fp
  join public.closet_items ci on ci.id=fp.closet_item_id
  where fp.id=p_photo_id
  limit 1;
$$;
revoke all on function private.fit_photo_product_id(uuid) from public,anon,authenticated;

create or replace function private.fit_photo_variation_key(p_photo_id uuid)
returns text
language sql stable security definer set search_path=''
as $$
  select fr.tracked_variation_key
  from public.fit_reference_photos fp
  join public.fit_reports fr on fr.closet_item_id=fp.closet_item_id
  where fp.id=p_photo_id
    and fr.tracked_variation_key is not null
  order by fr.created_at desc,fr.id desc
  limit 1;
$$;
revoke all on function private.fit_photo_variation_key(uuid) from public,anon,authenticated;

create or replace function private.best_fit_photo_for_product(
  p_product_id uuid,
  p_variation_key text default null
) returns table(photo_id uuid,score smallint)
language sql stable security definer set search_path=''
as $$
  select fp.id,fp.photo_quality_score
  from public.fit_reference_photos fp
  join public.closet_items ci on ci.id=fp.closet_item_id
  left join lateral (
    select fr.tracked_variation_key
    from public.fit_reports fr
    where fr.closet_item_id=fp.closet_item_id
    order by fr.created_at desc,fr.id desc
    limit 1
  ) latest_report on true
  where ci.product_id=p_product_id
    and fp.canonical_eligible
    and fp.duplicate_of is null
    and fp.quality_scored_at is not null
    and (fp.quality_source='legacy_neutral' or fp.resolution_score>=50)
    and not exists(
      select 1 from public.content_reports cr
      where cr.target_type='fit_reference_photo'::public.moderation_target_type
        and cr.target_id=fp.id
        and cr.status='open'::public.moderation_report_status
    )
    and (p_variation_key is null or latest_report.tracked_variation_key=p_variation_key)
  order by fp.photo_quality_score desc,
           case fp.photo_role when 'front' then 0 else 1 end,
           fp.created_at desc,
           fp.id
  limit 1;
$$;
revoke all on function private.best_fit_photo_for_product(uuid,text) from public,anon,authenticated;

create or replace function private.best_product_photo_evidence(p_product_id uuid)
returns uuid
language sql stable security definer set search_path=''
as $$
  select pe.id
  from public.product_photo_evidence pe
  where pe.product_id=p_product_id
    and pe.source_status::text<>'rejected'
  order by case pe.source_status::text
      when 'verified' then 4
      when 'established' then 3
      when 'corroborated' then 2
      else 1
    end desc,
    pe.created_at desc,
    pe.id
  limit 1;
$$;
revoke all on function private.best_product_photo_evidence(uuid) from public,anon,authenticated;

create or replace function private.upsert_automatic_canonical_product_image(
  p_product_id uuid,
  p_variation_key text,
  p_fit_photo_id uuid,
  p_fit_score smallint,
  p_product_photo_id uuid,
  p_official_url text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_current public.canonical_product_images%rowtype;
  v_margin smallint:=5;
  v_source_kind text;
  v_fit_id uuid;
  v_product_photo_id uuid;
  v_url text;
  v_score smallint;
begin
  select fit_photo_replacement_margin into v_margin
  from public.canonical_product_image_config where singleton=true;
  v_margin:=coalesce(v_margin,5);

  select * into v_current
  from public.canonical_product_images c
  where c.product_id=p_product_id
    and c.variation_key is not distinct from p_variation_key
  for update;

  if v_current.id is not null and v_current.canonical_locked then return; end if;

  if p_fit_photo_id is not null then
    if v_current.id is not null
       and v_current.source_kind='fit_reference_photo'
       and v_current.fit_reference_photo_id is not null
       and v_current.fit_reference_photo_id<>p_fit_photo_id
       and v_current.photo_quality_score is not null
       and p_fit_score < v_current.photo_quality_score + v_margin
       and exists(
         select 1 from public.fit_reference_photos fp
         where fp.id=v_current.fit_reference_photo_id
           and fp.canonical_eligible and fp.duplicate_of is null and fp.quality_scored_at is not null
           and (fp.quality_source='legacy_neutral' or fp.resolution_score>=50)
           and not exists(
             select 1 from public.content_reports cr
             where cr.target_type='fit_reference_photo'::public.moderation_target_type
               and cr.target_id=fp.id
               and cr.status='open'::public.moderation_report_status
           )
       ) then
      return;
    end if;
    v_source_kind:='fit_reference_photo'; v_fit_id:=p_fit_photo_id; v_score:=p_fit_score;
  elsif p_variation_key is null and p_product_photo_id is not null then
    v_source_kind:='product_photo_evidence'; v_product_photo_id:=p_product_photo_id;
  elsif p_variation_key is null and nullif(btrim(coalesce(p_official_url,'')),'') is not null then
    v_source_kind:='official_product_image'; v_url:=p_official_url;
  else
    if v_current.id is not null then delete from public.canonical_product_images where id=v_current.id; end if;
    return;
  end if;

  if v_current.id is null then
    insert into public.canonical_product_images(
      product_id,variation_key,source_kind,fit_reference_photo_id,product_photo_evidence_id,source_image_url,photo_quality_score,canonical_locked,selected_at,updated_at
    ) values(
      p_product_id,p_variation_key,v_source_kind,v_fit_id,v_product_photo_id,v_url,v_score,false,now(),now()
    );
  else
    update public.canonical_product_images
    set source_kind=v_source_kind,
        fit_reference_photo_id=v_fit_id,
        product_photo_evidence_id=v_product_photo_id,
        source_image_url=v_url,
        photo_quality_score=v_score,
        canonical_locked=false,
        locked_by=null,
        lock_reason=null,
        selected_at=case
          when source_kind is distinct from v_source_kind
            or fit_reference_photo_id is distinct from v_fit_id
            or product_photo_evidence_id is distinct from v_product_photo_id
            or source_image_url is distinct from v_url
          then now() else selected_at end,
        updated_at=now()
    where id=v_current.id;
  end if;
end;
$$;
revoke all on function private.upsert_automatic_canonical_product_image(uuid,text,uuid,smallint,uuid,text) from public,anon,authenticated;

create or replace function private.recompute_canonical_product_images(p_product_id uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_fit record;
  v_product_photo_id uuid;
  v_official_url text;
  v_variation text;
begin
  if p_product_id is null then return; end if;

  select p.image_url into v_official_url from public.products p where p.id=p_product_id;
  if not found then return; end if;
  v_product_photo_id:=private.best_product_photo_evidence(p_product_id);

  select * into v_fit from private.best_fit_photo_for_product(p_product_id,null);
  perform private.upsert_automatic_canonical_product_image(
    p_product_id,null,v_fit.photo_id,v_fit.score,v_product_photo_id,v_official_url
  );

  for v_variation in
    select distinct fr.tracked_variation_key
    from public.fit_reference_photos fp
    join public.closet_items ci on ci.id=fp.closet_item_id
    join public.fit_reports fr on fr.closet_item_id=fp.closet_item_id
    where ci.product_id=p_product_id
      and fr.tracked_variation_key is not null
  loop
    select * into v_fit from private.best_fit_photo_for_product(p_product_id,v_variation);
    perform private.upsert_automatic_canonical_product_image(
      p_product_id,v_variation,v_fit.photo_id,v_fit.score,null,null
    );
  end loop;

  delete from public.canonical_product_images c
  where c.product_id=p_product_id
    and c.variation_key is not null
    and not c.canonical_locked
    and not exists(
      select 1
      from public.fit_reference_photos fp
      join public.closet_items ci on ci.id=fp.closet_item_id
      join public.fit_reports fr on fr.closet_item_id=fp.closet_item_id
      where ci.product_id=p_product_id
        and fr.tracked_variation_key=c.variation_key
        and fp.canonical_eligible and fp.duplicate_of is null and fp.quality_scored_at is not null
        and (fp.quality_source='legacy_neutral' or fp.resolution_score>=50)
        and not exists(
          select 1 from public.content_reports cr
          where cr.target_type='fit_reference_photo'::public.moderation_target_type
            and cr.target_id=fp.id
            and cr.status='open'::public.moderation_report_status
        )
    );
end;
$$;
revoke all on function private.recompute_canonical_product_images(uuid) from public,anon,authenticated;

create or replace function private.refresh_canonical_product_image_after_fit_photo()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_product_id uuid;
begin
  if tg_op='DELETE' then
    select ci.product_id into v_product_id from public.closet_items ci where ci.id=old.closet_item_id;
  else
    select ci.product_id into v_product_id from public.closet_items ci where ci.id=new.closet_item_id;
  end if;
  perform private.recompute_canonical_product_images(v_product_id);
  return coalesce(new,old);
end;
$$;
revoke all on function private.refresh_canonical_product_image_after_fit_photo() from public,anon,authenticated;
create trigger refresh_canonical_product_image_after_fit_photo
  after insert or update of storage_path,garment_visibility_score,sharpness_score,resolution_score,framing_score,exposure_score,duplicate_of,canonical_eligible,quality_scored_at or delete
  on public.fit_reference_photos
  for each row execute function private.refresh_canonical_product_image_after_fit_photo();

create or replace function private.refresh_canonical_product_image_after_fit_report_variation()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_product_id uuid;
begin
  v_product_id:=coalesce(new.product_id,old.product_id);
  perform private.recompute_canonical_product_images(v_product_id);
  if old.product_id is distinct from new.product_id then
    perform private.recompute_canonical_product_images(old.product_id);
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function private.refresh_canonical_product_image_after_fit_report_variation() from public,anon,authenticated;
create trigger refresh_canonical_product_image_after_fit_report_variation
  after insert or update of product_id,tracked_variation_key or delete
  on public.fit_reports
  for each row execute function private.refresh_canonical_product_image_after_fit_report_variation();

create or replace function private.refresh_canonical_product_image_after_product_photo()
returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  perform private.recompute_canonical_product_images(coalesce(new.product_id,old.product_id));
  return coalesce(new,old);
end;
$$;
revoke all on function private.refresh_canonical_product_image_after_product_photo() from public,anon,authenticated;
create trigger refresh_canonical_product_image_after_product_photo
  after insert or update of source_status,public_url or delete
  on public.product_photo_evidence
  for each row execute function private.refresh_canonical_product_image_after_product_photo();

create or replace function private.refresh_canonical_product_image_after_official_image()
returns trigger
language plpgsql security definer set search_path=''
as $$
begin
  perform private.recompute_canonical_product_images(new.id);
  return new;
end;
$$;
revoke all on function private.refresh_canonical_product_image_after_official_image() from public,anon,authenticated;
create trigger refresh_canonical_product_image_after_official_image
  after update of image_url on public.products
  for each row execute function private.refresh_canonical_product_image_after_official_image();

create or replace function private.refresh_canonical_product_image_after_content_report()
returns trigger
language plpgsql security definer set search_path=''
as $$
declare
  v_target_type public.moderation_target_type;
  v_target_id uuid;
  v_product_id uuid;
begin
  v_target_type:=coalesce(new.target_type,old.target_type);
  v_target_id:=coalesce(new.target_id,old.target_id);
  if v_target_type='fit_reference_photo'::public.moderation_target_type then
    v_product_id:=private.fit_photo_product_id(v_target_id);
    perform private.recompute_canonical_product_images(v_product_id);
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function private.refresh_canonical_product_image_after_content_report() from public,anon,authenticated;
create trigger refresh_canonical_product_image_after_content_report
  after insert or update of status,target_id,target_type or delete
  on public.content_reports
  for each row execute function private.refresh_canonical_product_image_after_content_report();

create or replace function public.get_canonical_product_images(
  p_product_ids uuid[],
  p_variation_keys text[] default null
) returns table(
  product_id uuid,
  variation_key text,
  source_kind text,
  source_id uuid,
  storage_bucket text,
  storage_path text,
  image_url text,
  photo_quality_score smallint,
  canonical_locked boolean
)
language plpgsql stable security definer set search_path=''
as $$
begin
  if p_product_ids is null or coalesce(array_length(p_product_ids,1),0)=0 then return; end if;
  if array_length(p_product_ids,1)>200 then raise exception 'At most 200 Product images may be resolved at once'; end if;
  if p_variation_keys is not null and array_length(p_variation_keys,1) is distinct from array_length(p_product_ids,1) then
    raise exception 'Product and variation arrays must align';
  end if;

  return query
  with requested as (
    select u.product_id,
           case when p_variation_keys is null then null else p_variation_keys[u.ord] end as requested_variation,
           u.ord
    from unnest(p_product_ids) with ordinality as u(product_id,ord)
  ), chosen as (
    select r.product_id,r.requested_variation,r.ord,
           coalesce(exact_image.id,base_image.id) as selection_id
    from requested r
    left join lateral (
      select c.id from public.canonical_product_images c
      where c.product_id=r.product_id
        and r.requested_variation is not null
        and c.variation_key=r.requested_variation
      limit 1
    ) exact_image on true
    left join lateral (
      select c.id from public.canonical_product_images c
      where c.product_id=r.product_id and c.variation_key is null
      limit 1
    ) base_image on true
  )
  select ch.product_id,
         ch.requested_variation,
         c.source_kind,
         case c.source_kind
           when 'fit_reference_photo' then c.fit_reference_photo_id
           when 'product_photo_evidence' then c.product_photo_evidence_id
           else null end as source_id,
         case when c.source_kind='fit_reference_photo' then 'fit-reference-photos' else null end as storage_bucket,
         fp.storage_path,
         case
           when c.source_kind='product_photo_evidence' then pe.public_url
           when c.source_kind='official_product_image' then c.source_image_url
           else null end as image_url,
         c.photo_quality_score,
         c.canonical_locked
  from chosen ch
  join public.canonical_product_images c on c.id=ch.selection_id
  left join public.fit_reference_photos fp on fp.id=c.fit_reference_photo_id
  left join public.product_photo_evidence pe on pe.id=c.product_photo_evidence_id
  order by ch.ord;
end;
$$;
revoke all on function public.get_canonical_product_images(uuid[],text[]) from public,anon;
grant execute on function public.get_canonical_product_images(uuid[],text[]) to authenticated;

create or replace function public.admin_set_canonical_product_image(
  p_product_id uuid,
  p_variation_key text,
  p_source_kind text,
  p_source_id uuid,
  p_lock boolean,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_fit_id uuid;
  v_product_photo_id uuid;
  v_url text;
  v_score smallint;
  v_photo_product uuid;
begin
  if v_admin is null or not private.is_admin(v_admin) then raise exception 'Admin required' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null or char_length(btrim(p_reason))>500 then raise exception 'Reason required'; end if;
  if not exists(select 1 from public.products where id=p_product_id and catalog_status::text<>'rejected') then raise exception 'Unknown Product'; end if;

  if p_source_kind='fit_reference_photo' then
    select private.fit_photo_product_id(p_source_id),fp.photo_quality_score
      into v_photo_product,v_score
    from public.fit_reference_photos fp where fp.id=p_source_id and fp.canonical_eligible and fp.duplicate_of is null;
    if v_photo_product is distinct from p_product_id then raise exception 'Fit Photo is not eligible for this Product'; end if;
    if p_variation_key is not null and private.fit_photo_variation_key(p_source_id) is distinct from p_variation_key then raise exception 'Fit Photo does not match this tracked variation'; end if;
    v_fit_id:=p_source_id;
  elsif p_source_kind='product_photo_evidence' then
    if p_variation_key is not null then raise exception 'Product Photo evidence is Product-level only'; end if;
    select pe.id into v_product_photo_id from public.product_photo_evidence pe
    where pe.id=p_source_id and pe.product_id=p_product_id and pe.source_status::text<>'rejected';
    if v_product_photo_id is null then raise exception 'Product Photo is not eligible for this Product'; end if;
  elsif p_source_kind='official_product_image' then
    if p_variation_key is not null then raise exception 'Current official Product image is Product-level only'; end if;
    select image_url into v_url from public.products where id=p_product_id;
    if nullif(btrim(coalesce(v_url,'')),'') is null then raise exception 'Product has no official/imported image'; end if;
  else
    raise exception 'Unknown Product image source';
  end if;

  if p_variation_key is null then
    insert into public.canonical_product_images(
      product_id,variation_key,source_kind,fit_reference_photo_id,product_photo_evidence_id,source_image_url,photo_quality_score,canonical_locked,locked_by,lock_reason,selected_at,updated_at
    ) values(
      p_product_id,null,p_source_kind,v_fit_id,v_product_photo_id,v_url,v_score,coalesce(p_lock,false),
      case when coalesce(p_lock,false) then v_admin else null end,
      case when coalesce(p_lock,false) then btrim(p_reason) else null end,
      now(),now()
    )
    on conflict (product_id) where variation_key is null
    do update set source_kind=excluded.source_kind,fit_reference_photo_id=excluded.fit_reference_photo_id,
      product_photo_evidence_id=excluded.product_photo_evidence_id,source_image_url=excluded.source_image_url,
      photo_quality_score=excluded.photo_quality_score,canonical_locked=excluded.canonical_locked,locked_by=excluded.locked_by,
      lock_reason=excluded.lock_reason,selected_at=now(),updated_at=now();
  else
    insert into public.canonical_product_images(
      product_id,variation_key,source_kind,fit_reference_photo_id,product_photo_evidence_id,source_image_url,photo_quality_score,canonical_locked,locked_by,lock_reason,selected_at,updated_at
    ) values(
      p_product_id,p_variation_key,p_source_kind,v_fit_id,v_product_photo_id,v_url,v_score,coalesce(p_lock,false),
      case when coalesce(p_lock,false) then v_admin else null end,
      case when coalesce(p_lock,false) then btrim(p_reason) else null end,
      now(),now()
    )
    on conflict (product_id,variation_key) where variation_key is not null
    do update set source_kind=excluded.source_kind,fit_reference_photo_id=excluded.fit_reference_photo_id,
      product_photo_evidence_id=excluded.product_photo_evidence_id,source_image_url=excluded.source_image_url,
      photo_quality_score=excluded.photo_quality_score,canonical_locked=excluded.canonical_locked,locked_by=excluded.locked_by,
      lock_reason=excluded.lock_reason,selected_at=now(),updated_at=now();
  end if;

  insert into public.canonical_product_image_actions(admin_user_id,product_id,variation_key,action,source_kind,source_id,reason)
  values(v_admin,p_product_id,p_variation_key,case when coalesce(p_lock,false) then 'lock' else 'set' end,p_source_kind,p_source_id,btrim(p_reason));
end;
$$;
revoke all on function public.admin_set_canonical_product_image(uuid,text,text,uuid,boolean,text) from public,anon;
grant execute on function public.admin_set_canonical_product_image(uuid,text,text,uuid,boolean,text) to authenticated;

create or replace function public.admin_unlock_canonical_product_image(
  p_product_id uuid,
  p_variation_key text,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare v_admin uuid:=auth.uid();
begin
  if v_admin is null or not private.is_admin(v_admin) then raise exception 'Admin required' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null or char_length(btrim(p_reason))>500 then raise exception 'Reason required'; end if;
  update public.canonical_product_images
  set canonical_locked=false,locked_by=null,lock_reason=null,updated_at=now()
  where product_id=p_product_id and variation_key is not distinct from p_variation_key and canonical_locked;
  if not found then raise exception 'No locked canonical Product image found'; end if;
  insert into public.canonical_product_image_actions(admin_user_id,product_id,variation_key,action,reason)
  values(v_admin,p_product_id,p_variation_key,'unlock',btrim(p_reason));
  perform private.recompute_canonical_product_images(p_product_id);
end;
$$;
revoke all on function public.admin_unlock_canonical_product_image(uuid,text,text) from public,anon;
grant execute on function public.admin_unlock_canonical_product_image(uuid,text,text) to authenticated;

create or replace function public.admin_set_fit_photo_canonical_eligibility(
  p_photo_id uuid,
  p_eligible boolean,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_product_id uuid;
begin
  if v_admin is null or not private.is_admin(v_admin) then raise exception 'Admin required' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null or char_length(btrim(p_reason))>500 then raise exception 'Reason required'; end if;
  v_product_id:=private.fit_photo_product_id(p_photo_id);
  if v_product_id is null then raise exception 'Unknown Fit Photo'; end if;
  update public.fit_reference_photos
  set canonical_eligible=p_eligible,
      canonical_ineligible_reason=case when p_eligible then null else btrim(p_reason) end
  where id=p_photo_id;
  insert into public.canonical_product_image_actions(admin_user_id,product_id,action,source_kind,source_id,reason)
  values(v_admin,v_product_id,case when p_eligible then 'mark_eligible' else 'mark_ineligible' end,'fit_reference_photo',p_photo_id,btrim(p_reason));
end;
$$;
revoke all on function public.admin_set_fit_photo_canonical_eligibility(uuid,boolean,text) from public,anon;
grant execute on function public.admin_set_fit_photo_canonical_eligibility(uuid,boolean,text) to authenticated;

-- Seed Product-level and tracked-variation selections once. Future changes are targeted by triggers.
do $$
declare v_product_id uuid;
begin
  for v_product_id in select id from public.products loop
    perform private.recompute_canonical_product_images(v_product_id);
  end loop;
end;
$$;

comment on column public.fit_reports.tracked_variation_key is 'Roadmap 11A tracked-variation identity for Product-image selection. It is derived from current controlled variation-defining garment answers and is deliberately separate from objective_variant_key; Size and Color never participate.';
comment on table public.canonical_product_images is 'Roadmap 13A persisted winning Product-image pointer. Exact tracked variation rows fall back to the Product-level row at read time; admin locks always win.';
comment on column public.fit_reference_photos.photo_quality_score is 'Deterministic 0-100 score: garment visibility 35%, sharpness 20%, resolution 15%, framing 20%, exposure 10%. Original Fit Photo evidence is never modified by selection.';
comment on function public.get_canonical_product_images(uuid[],text[]) is 'Bounded batch resolver for canonical Product imagery. Returns source references so private Fit Photo storage can be signed by the application without per-Product resolver queries.';
