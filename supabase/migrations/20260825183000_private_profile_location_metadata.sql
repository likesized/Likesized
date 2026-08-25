-- LikeSized private profile location metadata.
-- City/state is collected during initial Fit Profile setup, remains private to the member,
-- and can support future anonymous regional aggregate insights without becoming public profile data.

create table public.profile_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  city text,
  state_region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_locations_city_length check (
    city is null or char_length(btrim(city)) between 1 and 80
  ),
  constraint profile_locations_state_region_code check (
    state_region is null or state_region in (
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
    )
  ),
  constraint profile_locations_pair check (
    (city is null and state_region is null)
    or (city is not null and state_region is not null)
  )
);

create index profile_locations_region_idx
  on public.profile_locations (state_region, lower(city))
  where city is not null and state_region is not null;

comment on table public.profile_locations is
  'Private member city/state metadata. Owner-readable/editable only; state is stored as a canonical US postal code; not part of public profile projections.';

alter table public.profile_locations enable row level security;

revoke all on table public.profile_locations from public, anon;
grant select, insert, update on table public.profile_locations to authenticated;

create policy "owner reads own profile location"
on public.profile_locations for select to authenticated
using ((select auth.uid()) = user_id);

create policy "owner inserts own profile location"
on public.profile_locations for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "owner updates own profile location"
on public.profile_locations for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
