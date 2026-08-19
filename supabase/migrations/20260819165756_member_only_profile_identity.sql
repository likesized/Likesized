-- V1 privacy decision: completed member profile identity is readable only to signed-in LikeSized members.
-- Raw current/historical body measurements and private size references remain owner-only under their existing RLS.

drop policy if exists "completed profiles readable to anon" on public.profiles;

revoke select on public.profiles from anon;
grant select on public.profiles to authenticated;

comment on table public.profiles is
  'Member identity shell. Completed usernames/display names/bios are discoverable to authenticated LikeSized members only; raw Fit Profile data lives in separate owner-private tables.';
