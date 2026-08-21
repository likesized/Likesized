-- LikeSized canonical migration: reserve prior usernames for 30 days after a change.
-- Current usernames remain case-insensitively unique through profiles_username_ci_uq.
-- Reservations are private/internal and never exposed as public profile history.

create table private.username_reservations (
  normalized_username text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reserved_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_reservations_normalized_format
    check (normalized_username ~ '^[a-z0-9_]{3,32}$')
);

create index username_reservations_user_idx
  on private.username_reservations(user_id, reserved_until desc);

revoke all on table private.username_reservations from public, anon, authenticated;

create or replace function private.enforce_username_reservation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_new_normalized text;
  v_old_normalized text;
  v_lock_first text;
  v_lock_second text;
  v_reserved_user_id uuid;
begin
  v_new_normalized := case when new.username is null then null else lower(new.username) end;
  v_old_normalized := case
    when tg_op='UPDATE' and old.username is not null then lower(old.username)
    else null
  end;

  -- Serialize claims/releases of the same username. Lock in lexical order so
  -- two simultaneous username swaps cannot deadlock each other.
  if v_new_normalized is not null and v_old_normalized is not null
     and v_new_normalized is distinct from v_old_normalized then
    v_lock_first := least(v_new_normalized, v_old_normalized);
    v_lock_second := greatest(v_new_normalized, v_old_normalized);
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('likesized-username:' || v_lock_first, 0));
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('likesized-username:' || v_lock_second, 0));
  elsif v_new_normalized is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('likesized-username:' || v_new_normalized, 0));
  elsif v_old_normalized is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('likesized-username:' || v_old_normalized, 0));
  end if;

  if v_new_normalized is not null then
    delete from private.username_reservations ur
    where ur.normalized_username=v_new_normalized
      and ur.reserved_until<=now();

    select ur.user_id
      into v_reserved_user_id
    from private.username_reservations ur
    where ur.normalized_username=v_new_normalized
      and ur.reserved_until>now();

    if v_reserved_user_id is not null and v_reserved_user_id<>new.id then
      raise unique_violation using message='Username is temporarily reserved';
    end if;

    -- Reclaiming your own prior username removes its reservation immediately.
    delete from private.username_reservations ur
    where ur.normalized_username=v_new_normalized
      and ur.user_id=new.id;
  end if;

  if tg_op='UPDATE'
     and v_old_normalized is not null
     and v_old_normalized is distinct from v_new_normalized then
    insert into private.username_reservations(
      normalized_username,user_id,reserved_until,created_at,updated_at
    ) values (
      v_old_normalized,new.id,now()+interval '30 days',now(),now()
    )
    on conflict(normalized_username) do update set
      user_id=excluded.user_id,
      reserved_until=excluded.reserved_until,
      updated_at=now()
    where private.username_reservations.user_id=excluded.user_id
       or private.username_reservations.reserved_until<=now();

    if not found then
      raise unique_violation using message='Username reservation conflict';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_username_reservation() from public, anon, authenticated;

drop trigger if exists enforce_username_reservation_before_write on public.profiles;
create trigger enforce_username_reservation_before_write
before insert or update of username on public.profiles
for each row execute function private.enforce_username_reservation();
