-- LikeSized canonical migration: username changes are allowed once every 30 days.
-- Previous usernames remain reserved to the same account for 30 days by the existing reservation system.

create table private.username_change_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_changed_at timestamptz not null,
  updated_at timestamptz not null default now()
);
revoke all on table private.username_change_state from public,anon,authenticated;
insert into private.username_change_state(user_id,last_changed_at,updated_at)
select ur.user_id,max(ur.created_at),now() from private.username_reservations ur group by ur.user_id
on conflict(user_id) do update set last_changed_at=greatest(private.username_change_state.last_changed_at,excluded.last_changed_at),updated_at=now();
create or replace function private.enforce_username_change_cooldown() returns trigger language plpgsql security definer set search_path='' as $$
declare v_last_changed timestamptz;begin
 if old.username is not distinct from new.username then return new; end if;
 if old.username is null then return new; end if;
 select ucs.last_changed_at into v_last_changed from private.username_change_state ucs where ucs.user_id=new.id for update;
 if v_last_changed is not null and v_last_changed+interval '30 days'>now() then raise exception 'USERNAME_CHANGE_COOLDOWN' using errcode='P0001'; end if;
 insert into private.username_change_state(user_id,last_changed_at,updated_at) values(new.id,now(),now()) on conflict(user_id) do update set last_changed_at=excluded.last_changed_at,updated_at=now();return new;
end;$$;
revoke all on function private.enforce_username_change_cooldown() from public,anon,authenticated;
drop trigger if exists enforce_username_change_cooldown_before_write on public.profiles;
create trigger enforce_username_change_cooldown_before_write before update of username on public.profiles for each row execute function private.enforce_username_change_cooldown();
create or replace function public.get_username_change_status(p_username text default null::text)
returns table(can_change boolean,next_change_at timestamptz,format_valid boolean,available boolean)
language plpgsql stable security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();v_current text;v_last_changed timestamptz;v_candidate text:=nullif(btrim(coalesce(p_username,'')),'');v_normalized text;begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select p.username into v_current from public.profiles p where p.id=v_user_id;
 select ucs.last_changed_at into v_last_changed from private.username_change_state ucs where ucs.user_id=v_user_id;
 can_change:=v_last_changed is null or v_last_changed+interval '30 days'<=now();next_change_at:=case when can_change then null else v_last_changed+interval '30 days' end;format_valid:=v_candidate is not null and v_candidate~'^[A-Za-z0-9_]{3,32}$';
 if not format_valid then available:=false;return next;return;end if;
 v_normalized:=lower(v_candidate);
 available:=(v_current is not null and lower(v_current)=v_normalized) or (not exists(select 1 from public.profiles p where p.id<>v_user_id and p.username is not null and lower(p.username)=v_normalized) and not exists(select 1 from private.username_reservations ur where ur.normalized_username=v_normalized and ur.user_id<>v_user_id and ur.reserved_until>now()));return next;
end;$$;
revoke all on function public.get_username_change_status(text) from public,anon;grant execute on function public.get_username_change_status(text) to authenticated;
comment on table private.username_change_state is 'Internal username-change cooldown state. Members may change username at most once every 30 days.';
comment on function public.get_username_change_status(text) is 'Returns current-member username cooldown and candidate availability without exposing other profiles or reservations.';
