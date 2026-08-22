create or replace function private.bootstrap_first_admin_after_signup()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('likesized:first-admin',0));
  if not exists(select 1 from private.admin_users) then
    insert into private.admin_users(user_id) values(new.id);
  end if;
  return new;
end;
$$;
revoke all on function private.bootstrap_first_admin_after_signup() from public,anon,authenticated;
create trigger bootstrap_first_admin_after_auth_signup
after insert on auth.users for each row
execute function private.bootstrap_first_admin_after_signup();

comment on function private.bootstrap_first_admin_after_signup() is 'On an empty installation only, atomically grants the first Auth account owner/admin access. Once any admin exists, later signups are never promoted.';
