create table private.fit_twin_activity_notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table private.fit_twin_notification_mutes (
  follower_id uuid not null,
  followed_id uuid not null,
  muted_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  foreign key (follower_id, followed_id)
    references public.follows(follower_id, followed_id)
    on delete cascade
);

create table private.fit_twin_activity_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references private.following_activity_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (recipient_id, activity_id)
);

create index fit_twin_notifications_recipient_time_idx
  on private.fit_twin_activity_notifications(recipient_id, created_at desc, id desc);
create index fit_twin_notifications_recipient_unread_idx
  on private.fit_twin_activity_notifications(recipient_id, created_at desc)
  where read_at is null;

revoke all on private.fit_twin_activity_notification_preferences from public, anon, authenticated;
revoke all on private.fit_twin_notification_mutes from public, anon, authenticated;
revoke all on private.fit_twin_activity_notifications from public, anon, authenticated;

create or replace function private.fan_out_fit_twin_activity_notification()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into private.fit_twin_activity_notifications(recipient_id, activity_id, created_at)
  select f.follower_id, new.id, new.occurred_at
  from public.follows f
  left join private.fit_twin_activity_notification_preferences pref
    on pref.user_id=f.follower_id
  where f.followed_id=new.actor_id
    and coalesce(pref.enabled,true)
    and not exists (
      select 1
      from private.fit_twin_notification_mutes mute
      where mute.follower_id=f.follower_id
        and mute.followed_id=new.actor_id
    )
  on conflict (recipient_id, activity_id) do nothing;

  return new;
end;
$$;

revoke all on function private.fan_out_fit_twin_activity_notification() from public, anon, authenticated;

create trigger following_activity_notification_fanout_after_insert
after insert on private.following_activity_events
for each row execute function private.fan_out_fit_twin_activity_notification();

create or replace function private.get_fit_twin_notification_settings_for_current_user()
returns table (fit_twin_activity_enabled boolean)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  select coalesce((
    select pref.enabled
    from private.fit_twin_activity_notification_preferences pref
    where pref.user_id=v_user_id
  ),true);
end;
$$;

create or replace function private.set_fit_twin_activity_notifications_for_current_user(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if p_enabled is null then
    raise exception 'Notification preference is required';
  end if;

  insert into private.fit_twin_activity_notification_preferences(user_id,enabled,updated_at)
  values(v_user_id,p_enabled,now())
  on conflict (user_id) do update
    set enabled=excluded.enabled,
        updated_at=excluded.updated_at;

  return p_enabled;
end;
$$;

create or replace function private.get_fit_twin_notification_mutes_for_current_user()
returns table (followed_id uuid)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  select mute.followed_id
  from private.fit_twin_notification_mutes mute
  where mute.follower_id=v_user_id
  order by mute.muted_at desc, mute.followed_id;
end;
$$;

create or replace function private.set_fit_twin_notification_mute_for_current_user(
  p_followed_id uuid,
  p_muted boolean
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;
  if p_followed_id is null or p_muted is null or p_followed_id=v_user_id then
    raise exception 'Invalid Fit Twin notification mute';
  end if;

  if p_muted then
    if not exists (
      select 1 from public.follows f
      where f.follower_id=v_user_id
        and f.followed_id=p_followed_id
    ) then
      raise exception 'Fit Twin follow required';
    end if;

    insert into private.fit_twin_notification_mutes(follower_id,followed_id)
    values(v_user_id,p_followed_id)
    on conflict (follower_id,followed_id) do nothing;
  else
    delete from private.fit_twin_notification_mutes mute
    where mute.follower_id=v_user_id
      and mute.followed_id=p_followed_id;
  end if;

  return p_muted;
end;
$$;

create or replace function private.get_fit_twin_activity_notifications_for_current_user(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  notification_id uuid,
  activity_id uuid,
  activity_type text,
  actor_id uuid,
  username text,
  display_name text,
  created_at timestamptz,
  read_at timestamptz,
  relevant_match_category public.fit_match_category,
  closet_item_id uuid,
  fit_report_id uuid,
  outfit_post_id uuid,
  product_slug text,
  product_name text,
  brand_name text,
  garment_type_key text,
  size_label text,
  fit public.fit_rating,
  fit_notes text,
  would_buy_again boolean,
  outfit_caption text,
  outfit_photo_path text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_result_limit,50),1),100);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  select
    n.id,
    e.id,
    e.event_type,
    e.actor_id,
    p.username,
    p.display_name,
    n.created_at,
    n.read_at,
    case
      when e.event_type='outfit_posted' then 'overall'::public.fit_match_category
      when prod.category='tops'::public.garment_category then 'tops'::public.fit_match_category
      when prod.category='bottoms'::public.garment_category then 'bottoms'::public.fit_match_category
      else 'overall'::public.fit_match_category
    end,
    e.closet_item_id,
    e.fit_report_id,
    e.outfit_post_id,
    prod.slug,
    prod.name,
    b.name,
    prod.garment_type_key,
    fr.size_label,
    fr.fit,
    fr.fit_notes,
    fr.would_buy_again,
    op.caption,
    op.photo_url
  from private.fit_twin_activity_notifications n
  join private.following_activity_events e on e.id=n.activity_id
  join public.profiles p on p.id=e.actor_id and p.username is not null
  left join public.closet_items ci on ci.id=e.closet_item_id
  left join public.fit_reports fr on fr.id=e.fit_report_id
  left join public.products prod on prod.id=fr.product_id
  left join public.brands b on b.id=prod.brand_id
  left join public.outfit_posts op on op.id=e.outfit_post_id
  where n.recipient_id=v_user_id
    and (p_before is null or n.created_at<p_before)
    and (
      (
        e.event_type in ('closet_shared','fit_report_added')
        and ci.id is not null
        and ci.user_id=e.actor_id
        and ci.visibility='shared'::public.closet_visibility
        and fr.id is not null
        and fr.user_id=e.actor_id
        and fr.closet_item_id=ci.id
      )
      or
      (
        e.event_type='outfit_posted'
        and op.id is not null
        and op.user_id=e.actor_id
      )
    )
  order by n.created_at desc,n.id desc
  limit v_limit;
end;
$$;

create or replace function private.get_fit_twin_notification_unread_count_for_current_user()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  select count(*)::integer into v_count
  from private.fit_twin_activity_notifications n
  where n.recipient_id=v_user_id
    and n.read_at is null;

  return v_count;
end;
$$;

create or replace function private.mark_fit_twin_notifications_read_for_current_user(
  p_notification_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  update private.fit_twin_activity_notifications n
  set read_at=coalesce(n.read_at,now())
  where n.recipient_id=v_user_id
    and n.read_at is null
    and (p_notification_id is null or n.id=p_notification_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.get_fit_twin_notification_settings_for_current_user() from public, anon;
revoke all on function private.set_fit_twin_activity_notifications_for_current_user(boolean) from public, anon;
revoke all on function private.get_fit_twin_notification_mutes_for_current_user() from public, anon;
revoke all on function private.set_fit_twin_notification_mute_for_current_user(uuid,boolean) from public, anon;
revoke all on function private.get_fit_twin_activity_notifications_for_current_user(integer,timestamptz) from public, anon;
revoke all on function private.get_fit_twin_notification_unread_count_for_current_user() from public, anon;
revoke all on function private.mark_fit_twin_notifications_read_for_current_user(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.get_fit_twin_notification_settings_for_current_user() to authenticated;
grant execute on function private.set_fit_twin_activity_notifications_for_current_user(boolean) to authenticated;
grant execute on function private.get_fit_twin_notification_mutes_for_current_user() to authenticated;
grant execute on function private.set_fit_twin_notification_mute_for_current_user(uuid,boolean) to authenticated;
grant execute on function private.get_fit_twin_activity_notifications_for_current_user(integer,timestamptz) to authenticated;
grant execute on function private.get_fit_twin_notification_unread_count_for_current_user() to authenticated;
grant execute on function private.mark_fit_twin_notifications_read_for_current_user(uuid) to authenticated;

create or replace function public.get_fit_twin_notification_settings()
returns table (fit_twin_activity_enabled boolean)
language sql
security invoker
set search_path=''
as $$
  select * from private.get_fit_twin_notification_settings_for_current_user();
$$;

create or replace function public.set_fit_twin_activity_notifications(p_enabled boolean)
returns boolean
language sql
security invoker
set search_path=''
as $$
  select private.set_fit_twin_activity_notifications_for_current_user(p_enabled);
$$;

create or replace function public.get_fit_twin_notification_mutes()
returns table (followed_id uuid)
language sql
security invoker
set search_path=''
as $$
  select * from private.get_fit_twin_notification_mutes_for_current_user();
$$;

create or replace function public.set_fit_twin_notification_mute(p_followed_id uuid,p_muted boolean)
returns boolean
language sql
security invoker
set search_path=''
as $$
  select private.set_fit_twin_notification_mute_for_current_user(p_followed_id,p_muted);
$$;

create or replace function public.get_fit_twin_activity_notifications(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  notification_id uuid,
  activity_id uuid,
  activity_type text,
  actor_id uuid,
  username text,
  display_name text,
  created_at timestamptz,
  read_at timestamptz,
  relevant_match_category public.fit_match_category,
  closet_item_id uuid,
  fit_report_id uuid,
  outfit_post_id uuid,
  product_slug text,
  product_name text,
  brand_name text,
  garment_type_key text,
  size_label text,
  fit public.fit_rating,
  fit_notes text,
  would_buy_again boolean,
  outfit_caption text,
  outfit_photo_path text
)
language sql
security invoker
set search_path=''
as $$
  select * from private.get_fit_twin_activity_notifications_for_current_user(p_result_limit,p_before);
$$;

create or replace function public.get_fit_twin_notification_unread_count()
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.get_fit_twin_notification_unread_count_for_current_user();
$$;

create or replace function public.mark_fit_twin_notifications_read(p_notification_id uuid default null)
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.mark_fit_twin_notifications_read_for_current_user(p_notification_id);
$$;

revoke all on function public.get_fit_twin_notification_settings() from public, anon;
revoke all on function public.set_fit_twin_activity_notifications(boolean) from public, anon;
revoke all on function public.get_fit_twin_notification_mutes() from public, anon;
revoke all on function public.set_fit_twin_notification_mute(uuid,boolean) from public, anon;
revoke all on function public.get_fit_twin_activity_notifications(integer,timestamptz) from public, anon;
revoke all on function public.get_fit_twin_notification_unread_count() from public, anon;
revoke all on function public.mark_fit_twin_notifications_read(uuid) from public, anon;
grant execute on function public.get_fit_twin_notification_settings() to authenticated;
grant execute on function public.set_fit_twin_activity_notifications(boolean) to authenticated;
grant execute on function public.get_fit_twin_notification_mutes() to authenticated;
grant execute on function public.set_fit_twin_notification_mute(uuid,boolean) to authenticated;
grant execute on function public.get_fit_twin_activity_notifications(integer,timestamptz) to authenticated;
grant execute on function public.get_fit_twin_notification_unread_count() to authenticated;
grant execute on function public.mark_fit_twin_notifications_read(uuid) to authenticated;

comment on table private.fit_twin_activity_notification_preferences is
  'Private owner notification preference. Missing row means Fit Twin activity notifications are enabled by default.';
comment on table private.fit_twin_notification_mutes is
  'Private per-Fit-Twin notification mute state. Muting does not change the follow relationship or Following Feed.';
comment on table private.fit_twin_activity_notifications is
  'Private in-app Fit Twin activity notifications referencing canonical Following Feed activity events. Source deletion/privacy cascades remove the notification.';
comment on function public.get_fit_twin_activity_notifications(integer,timestamptz) is
  'Safe authenticated in-app Fit Twin notification list. Existing notifications survive mute/global-off/unfollow but never survive source privacy/deletion.';