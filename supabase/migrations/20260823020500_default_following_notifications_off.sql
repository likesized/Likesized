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
    select preference.enabled
    from private.fit_twin_activity_notification_preferences preference
    where preference.user_id=v_user_id
  ),false);
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

    insert into private.fit_twin_activity_notification_preferences(user_id, enabled, updated_at)
    values(v_user_id, true, now())
    on conflict (user_id) do update
      set enabled=true,
          updated_at=excluded.updated_at;
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
    and coalesce(preference.enabled,false)
  on conflict (recipient_id, activity_id) do nothing;

  return new;
end;
$$;

comment on table private.fit_twin_activity_notification_preferences is
  'Private master switch for following activity notifications. Missing row means notifications are off. A member bell opt-in turns this master switch on.';
