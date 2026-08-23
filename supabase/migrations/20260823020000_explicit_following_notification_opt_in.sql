create table private.following_notification_subscriptions (
  follower_id uuid not null,
  followed_id uuid not null,
  enabled_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  foreign key (follower_id, followed_id)
    references public.follows(follower_id, followed_id)
    on delete cascade
);

revoke all on private.following_notification_subscriptions from public, anon, authenticated;

create or replace function private.get_following_notification_subscriptions_for_current_user()
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
  select subscription.followed_id
  from private.following_notification_subscriptions subscription
  where subscription.follower_id=v_user_id
  order by subscription.enabled_at desc, subscription.followed_id;
end;
$$;

create or replace function private.set_following_notification_subscription_for_current_user(
  p_followed_id uuid,
  p_enabled boolean
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
  if p_followed_id is null or p_enabled is null or p_followed_id=v_user_id then
    raise exception 'Invalid following notification subscription';
  end if;
  if not exists (
    select 1
    from public.profiles profile
    where profile.id=p_followed_id
      and profile.username is not null
  ) then
    raise exception 'Member not found';
  end if;

  if p_enabled then
    insert into public.follows(follower_id, followed_id)
    values(v_user_id, p_followed_id)
    on conflict (follower_id, followed_id) do nothing;

    insert into private.following_notification_subscriptions(follower_id, followed_id, enabled_at)
    values(v_user_id, p_followed_id, now())
    on conflict (follower_id, followed_id) do update
      set enabled_at=excluded.enabled_at;
  else
    delete from private.following_notification_subscriptions subscription
    where subscription.follower_id=v_user_id
      and subscription.followed_id=p_followed_id;
  end if;

  return p_enabled;
end;
$$;

create or replace function private.fan_out_fit_twin_activity_notification()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into private.fit_twin_activity_notifications(recipient_id, activity_id, created_at)
  select follow.follower_id, new.id, new.occurred_at
  from public.follows follow
  join private.following_notification_subscriptions subscription
    on subscription.follower_id=follow.follower_id
   and subscription.followed_id=follow.followed_id
  left join private.fit_twin_activity_notification_preferences preference
    on preference.user_id=follow.follower_id
  where follow.followed_id=new.actor_id
    and coalesce(preference.enabled,true)
  on conflict (recipient_id, activity_id) do nothing;

  return new;
end;
$$;

revoke all on function private.get_following_notification_subscriptions_for_current_user() from public, anon;
revoke all on function private.set_following_notification_subscription_for_current_user(uuid,boolean) from public, anon;
revoke all on function private.fan_out_fit_twin_activity_notification() from public, anon, authenticated;
grant execute on function private.get_following_notification_subscriptions_for_current_user() to authenticated;
grant execute on function private.set_following_notification_subscription_for_current_user(uuid,boolean) to authenticated;

create or replace function public.get_following_notification_subscriptions()
returns table (followed_id uuid)
language sql
security invoker
set search_path=''
as $$
  select * from private.get_following_notification_subscriptions_for_current_user();
$$;

create or replace function public.set_following_notification_subscription(
  p_followed_id uuid,
  p_enabled boolean
)
returns boolean
language sql
security invoker
set search_path=''
as $$
  select private.set_following_notification_subscription_for_current_user(p_followed_id,p_enabled);
$$;

revoke all on function public.get_following_notification_subscriptions() from public, anon;
revoke all on function public.set_following_notification_subscription(uuid,boolean) from public, anon;
grant execute on function public.get_following_notification_subscriptions() to authenticated;
grant execute on function public.set_following_notification_subscription(uuid,boolean) to authenticated;

comment on table private.following_notification_subscriptions is
  'Explicit per-person notification opt-in. Following alone only adds activity to the Style Feed. Enabling a subscription also creates the follow relationship when needed.';
comment on table private.fit_twin_notification_mutes is
  'Legacy mute state retained for compatibility. Current following activity fanout uses explicit following_notification_subscriptions instead.';
comment on function public.set_following_notification_subscription(uuid,boolean) is
  'Turns a followed member notification bell on or off. Turning it on auto-follows the member; turning it off preserves the follow relationship.';
