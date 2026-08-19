-- LikeSized V1 database schema
-- Canonical source for the initial hosted Supabase project.

create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public;

create type public.fit_rating as enum (
  'too_small',
  'snug',
  'just_right',
  'relaxed',
  'too_big'
);

create type public.garment_category as enum (
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'other'
);

create type public.visibility_level as enum (
  'private',
  'matches',
  'public'
);

create type public.fit_match_category as enum (
  'overall',
  'tops',
  'bottoms'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  default_measurement_visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null
    or (
      char_length(username) between 3 and 32
      and username ~ '^[A-Za-z0-9_]+$'
    )
  )
);

create unique index profiles_username_ci_uq
  on public.profiles (lower(username))
  where username is not null;

create table public.fit_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  height_in numeric(5,2) check (height_in is null or height_in > 0),
  weight_lb numeric(6,2) check (weight_lb is null or weight_lb > 0),
  chest_in numeric(5,2) check (chest_in is null or chest_in > 0),
  waist_in numeric(5,2) check (waist_in is null or waist_in > 0),
  hips_in numeric(5,2) check (hips_in is null or hips_in > 0),
  inseam_in numeric(5,2) check (inseam_in is null or inseam_in > 0),
  shoulders_in numeric(5,2) check (shoulders_in is null or shoulders_in > 0),
  torso_in numeric(5,2) check (torso_in is null or torso_in > 0),
  shoe_size_us numeric(4,1) check (shoe_size_us is null or shoe_size_us > 0),
  shirt_size text,
  pants_waist text,
  pants_inseam text,
  dress_size text,
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  website_url text,
  created_at timestamptz not null default now()
);

create unique index brands_name_ci_uq
  on public.brands (lower(name));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  name text not null,
  slug text unique not null,
  category public.garment_category not null,
  image_url text,
  retailer_url text,
  created_at timestamptz not null default now()
);

create unique index products_brand_name_ci_uq
  on public.products (brand_id, lower(name));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  color_label text,
  sku text,
  created_at timestamptz not null default now(),
  constraint product_variants_identity_uq unique (id, product_id, size_label)
);

create unique index product_variants_size_color_uq
  on public.product_variants (
    product_id,
    size_label,
    coalesce(color_label, '')
  );

create table public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid,
  size_label text not null,
  wears_count integer not null default 0 check (wears_count >= 0),
  purchased_at date,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint closet_variant_matches_product_size
    foreign key (variant_id, product_id, size_label)
    references public.product_variants (id, product_id, size_label)
);

create table public.fit_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  closet_item_id uuid not null unique references public.closet_items(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid,
  size_label text not null,
  fit public.fit_rating not null,
  fit_notes text,
  would_buy_again boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fit_report_variant_matches_product_size
    foreign key (variant_id, product_id, size_label)
    references public.product_variants (id, product_id, size_label)
);

create index fit_reports_product_lookup_idx
  on public.fit_reports (product_id, size_label, fit);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.fit_matches (
  user_id uuid not null references public.profiles(id) on delete cascade,
  matched_user_id uuid not null references public.profiles(id) on delete cascade,
  match_category public.fit_match_category not null,
  match_score smallint not null check (match_score between 0 and 100),
  calculated_at timestamptz not null default now(),
  primary key (user_id, matched_user_id, match_category),
  check (user_id <> matched_user_id)
);

create index fit_matches_rank_idx
  on public.fit_matches (user_id, match_category, match_score desc);

create table public.outfit_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create table public.outfit_post_items (
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  closet_item_id uuid not null references public.closet_items(id) on delete cascade,
  primary key (post_id, closet_item_id)
);

-- Create the public profile shell as soon as Supabase Auth creates auth.users.
-- Username intentionally starts null so signup never exposes an email-derived handle
-- and incomplete profiles stay hidden from other users until onboarding is finished.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into public.profiles (id)
select id
from auth.users
on conflict (id) do nothing;

-- Exact body measurements are owner-only. Safe match scores are stored separately.
alter table public.profiles enable row level security;
alter table public.fit_profiles enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.closet_items enable row level security;
alter table public.fit_reports enable row level security;
alter table public.follows enable row level security;
alter table public.fit_matches enable row level security;
alter table public.outfit_posts enable row level security;
alter table public.outfit_post_items enable row level security;

-- Profiles: incomplete profiles are visible only to their owner.
create policy "completed profiles readable"
on public.profiles
for select
to anon, authenticated
using (username is not null);

create policy "owner reads own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "owner updates own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Fit Profile: exact measurements never leave the owner through direct table access.
create policy "owner reads fit profile"
on public.fit_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "owner inserts fit profile"
on public.fit_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "owner updates fit profile"
on public.fit_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "owner deletes fit profile"
on public.fit_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Catalog: readable publicly; authenticated users may add missing catalog entries.
create policy "brands readable"
on public.brands
for select
to anon, authenticated
using (true);

create policy "authenticated users add brands"
on public.brands
for insert
to authenticated
with check (true);

create policy "products readable"
on public.products
for select
to anon, authenticated
using (true);

create policy "authenticated users add products"
on public.products
for insert
to authenticated
with check (true);

create policy "variants readable"
on public.product_variants
for select
to anon, authenticated
using (true);

create policy "authenticated users add variants"
on public.product_variants
for insert
to authenticated
with check (true);

-- Closet: ownership is private.
create policy "owner reads closet"
on public.closet_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "owner inserts closet"
on public.closet_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "owner updates closet"
on public.closet_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "owner deletes closet"
on public.closet_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Fit reports: fit evidence is shareable with signed-in members while raw measurements remain private.
create policy "members read fit reports"
on public.fit_reports
for select
to authenticated
using (true);

create policy "owner inserts fit report"
on public.fit_reports
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.closet_items ci
    where ci.id = fit_reports.closet_item_id
      and ci.user_id = (select auth.uid())
      and ci.product_id = fit_reports.product_id
      and ci.variant_id is not distinct from fit_reports.variant_id
      and ci.size_label = fit_reports.size_label
  )
);

create policy "owner updates fit report"
on public.fit_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.closet_items ci
    where ci.id = fit_reports.closet_item_id
      and ci.user_id = (select auth.uid())
      and ci.product_id = fit_reports.product_id
      and ci.variant_id is not distinct from fit_reports.variant_id
      and ci.size_label = fit_reports.size_label
  )
);

create policy "owner deletes fit report"
on public.fit_reports
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Following is social data; members may see relationships but only control their own follows.
create policy "members read follows"
on public.follows
for select
to authenticated
using (true);

create policy "owner creates follow"
on public.follows
for insert
to authenticated
with check ((select auth.uid()) = follower_id);

create policy "owner deletes follow"
on public.follows
for delete
to authenticated
using ((select auth.uid()) = follower_id);

-- Match rows are perspective-specific safe scores. Clients cannot write them directly.
create policy "owner reads match scores"
on public.fit_matches
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Outfit sharing stays member-readable while writes remain owner-controlled.
create policy "members read outfits"
on public.outfit_posts
for select
to authenticated
using (true);

create policy "owner inserts outfit"
on public.outfit_posts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "owner updates outfit"
on public.outfit_posts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "owner deletes outfit"
on public.outfit_posts
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "members read outfit item links"
on public.outfit_post_items
for select
to authenticated
using (true);

create policy "owner inserts outfit item link"
on public.outfit_post_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.outfit_posts op
    where op.id = outfit_post_items.post_id
      and op.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.closet_items ci
    where ci.id = outfit_post_items.closet_item_id
      and ci.user_id = (select auth.uid())
  )
);

create policy "owner deletes outfit item link"
on public.outfit_post_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.outfit_posts op
    where op.id = outfit_post_items.post_id
      and op.user_id = (select auth.uid())
  )
);

-- Explicit Data API privileges. RLS still controls which rows are reachable.
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select, insert, update, delete on public.fit_profiles to authenticated;

grant select on public.brands, public.products, public.product_variants to anon, authenticated;
grant insert on public.brands, public.products, public.product_variants to authenticated;

grant select, insert, update, delete on public.closet_items to authenticated;
grant select, insert, update, delete on public.fit_reports to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select on public.fit_matches to authenticated;
grant select, insert, update, delete on public.outfit_posts to authenticated;
grant select, insert, delete on public.outfit_post_items to authenticated;

-- Safe similarity helper. Raw measurements remain inside the private schema path.
create or replace function private.clamped_similarity(
  a numeric,
  b numeric,
  tolerance numeric
)
returns numeric
language sql
immutable
strict
set search_path = ''
as $$
  select greatest(0::numeric, 1 - abs(a - b) / tolerance);
$$;

revoke all on function private.clamped_similarity(numeric, numeric, numeric)
from public, anon, authenticated;

-- Privileged matcher: reads private fit profiles and writes only safe cached scores.
create or replace function private.calculate_fit_matches(
  p_match_category public.fit_match_category default 'overall',
  p_result_limit integer default 30
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_result_limit, 30), 1), 100);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  delete from public.fit_matches
  where fit_matches.user_id = v_user_id
    and fit_matches.match_category = p_match_category;

  if not exists (
    select 1
    from public.fit_profiles
    where fit_profiles.user_id = v_user_id
  ) then
    return;
  end if;

  insert into public.fit_matches (
    user_id,
    matched_user_id,
    match_category,
    match_score,
    calculated_at
  )
  with me as (
    select *
    from public.fit_profiles
    where fit_profiles.user_id = v_user_id
  ),
  candidates as (
    select fp.*
    from public.fit_profiles fp
    join public.profiles p on p.id = fp.user_id
    where fp.user_id <> v_user_id
      and p.username is not null
  ),
  weighted as (
    select
      c.user_id as matched_user_id,
      case
        when p_match_category = 'tops'::public.fit_match_category then
          (case when m.chest_in is not null and c.chest_in is not null
            then private.clamped_similarity(m.chest_in, c.chest_in, 5.0) * 0.34 else 0 end) +
          (case when m.shoulders_in is not null and c.shoulders_in is not null
            then private.clamped_similarity(m.shoulders_in, c.shoulders_in, 3.0) * 0.25 else 0 end) +
          (case when m.torso_in is not null and c.torso_in is not null
            then private.clamped_similarity(m.torso_in, c.torso_in, 4.0) * 0.16 else 0 end) +
          (case when m.height_in is not null and c.height_in is not null
            then private.clamped_similarity(m.height_in, c.height_in, 5.0) * 0.13 else 0 end) +
          (case when m.weight_lb is not null and c.weight_lb is not null
            then private.clamped_similarity(m.weight_lb, c.weight_lb, 45.0) * 0.07 else 0 end) +
          (case when m.waist_in is not null and c.waist_in is not null
            then private.clamped_similarity(m.waist_in, c.waist_in, 6.0) * 0.05 else 0 end)
        when p_match_category = 'bottoms'::public.fit_match_category then
          (case when m.waist_in is not null and c.waist_in is not null
            then private.clamped_similarity(m.waist_in, c.waist_in, 5.0) * 0.34 else 0 end) +
          (case when m.hips_in is not null and c.hips_in is not null
            then private.clamped_similarity(m.hips_in, c.hips_in, 5.0) * 0.28 else 0 end) +
          (case when m.inseam_in is not null and c.inseam_in is not null
            then private.clamped_similarity(m.inseam_in, c.inseam_in, 3.0) * 0.24 else 0 end) +
          (case when m.height_in is not null and c.height_in is not null
            then private.clamped_similarity(m.height_in, c.height_in, 5.0) * 0.09 else 0 end) +
          (case when m.weight_lb is not null and c.weight_lb is not null
            then private.clamped_similarity(m.weight_lb, c.weight_lb, 45.0) * 0.05 else 0 end)
        else
          (case when m.height_in is not null and c.height_in is not null
            then private.clamped_similarity(m.height_in, c.height_in, 5.0) * 0.12 else 0 end) +
          (case when m.weight_lb is not null and c.weight_lb is not null
            then private.clamped_similarity(m.weight_lb, c.weight_lb, 45.0) * 0.08 else 0 end) +
          (case when m.chest_in is not null and c.chest_in is not null
            then private.clamped_similarity(m.chest_in, c.chest_in, 6.0) * 0.20 else 0 end) +
          (case when m.waist_in is not null and c.waist_in is not null
            then private.clamped_similarity(m.waist_in, c.waist_in, 6.0) * 0.20 else 0 end) +
          (case when m.hips_in is not null and c.hips_in is not null
            then private.clamped_similarity(m.hips_in, c.hips_in, 6.0) * 0.16 else 0 end) +
          (case when m.inseam_in is not null and c.inseam_in is not null
            then private.clamped_similarity(m.inseam_in, c.inseam_in, 4.0) * 0.10 else 0 end) +
          (case when m.shoulders_in is not null and c.shoulders_in is not null
            then private.clamped_similarity(m.shoulders_in, c.shoulders_in, 4.0) * 0.08 else 0 end) +
          (case when m.torso_in is not null and c.torso_in is not null
            then private.clamped_similarity(m.torso_in, c.torso_in, 4.0) * 0.06 else 0 end)
      end as weighted_score,
      case
        when p_match_category = 'tops'::public.fit_match_category then
          (case when m.chest_in is not null and c.chest_in is not null then 0.34 else 0 end) +
          (case when m.shoulders_in is not null and c.shoulders_in is not null then 0.25 else 0 end) +
          (case when m.torso_in is not null and c.torso_in is not null then 0.16 else 0 end) +
          (case when m.height_in is not null and c.height_in is not null then 0.13 else 0 end) +
          (case when m.weight_lb is not null and c.weight_lb is not null then 0.07 else 0 end) +
          (case when m.waist_in is not null and c.waist_in is not null then 0.05 else 0 end)
        when p_match_category = 'bottoms'::public.fit_match_category then
          (case when m.waist_in is not null and c.waist_in is not null then 0.34 else 0 end) +
          (case when m.hips_in is not null and c.hips_in is not null then 0.28 else 0 end) +
          (case when m.inseam_in is not null and c.inseam_in is not null then 0.24 else 0 end) +
          (case when m.height_in is not null and c.height_in is not null then 0.09 else 0 end) +
          (case when m.weight_lb is not null and c.weight_lb is not null then 0.05 else 0 end)
        else
          (case when m.height_in is not null and c.height_in is not null then 0.12 else 0 end) +
          (case when m.weight_lb is not null and c.weight_lb is not null then 0.08 else 0 end) +
          (case when m.chest_in is not null and c.chest_in is not null then 0.20 else 0 end) +
          (case when m.waist_in is not null and c.waist_in is not null then 0.20 else 0 end) +
          (case when m.hips_in is not null and c.hips_in is not null then 0.16 else 0 end) +
          (case when m.inseam_in is not null and c.inseam_in is not null then 0.10 else 0 end) +
          (case when m.shoulders_in is not null and c.shoulders_in is not null then 0.08 else 0 end) +
          (case when m.torso_in is not null and c.torso_in is not null then 0.06 else 0 end)
      end as shared_weight
    from me m
    cross join candidates c
  ),
  scored as (
    select
      matched_user_id,
      case
        when shared_weight <= 0 then null
        else round(least(1::numeric, greatest(0::numeric, weighted_score / shared_weight)) * 100)::integer
      end as match_score
    from weighted
  ),
  ranked as (
    select matched_user_id, match_score
    from scored
    where match_score is not null
    order by match_score desc, matched_user_id
    limit v_limit
  )
  select
    v_user_id,
    ranked.matched_user_id,
    p_match_category,
    ranked.match_score,
    now()
  from ranked
  on conflict (user_id, matched_user_id, match_category)
  do update set
    match_score = excluded.match_score,
    calculated_at = excluded.calculated_at;

  return query
  select
    fm.matched_user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    fm.match_score::integer
  from public.fit_matches fm
  join public.profiles p on p.id = fm.matched_user_id
  where fm.user_id = v_user_id
    and fm.match_category = p_match_category
  order by fm.match_score desc, p.username
  limit v_limit;
end;
$$;

revoke all on function private.calculate_fit_matches(public.fit_match_category, integer)
from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.calculate_fit_matches(public.fit_match_category, integer)
to authenticated;

-- Exposed RPC stays SECURITY INVOKER; privileged work remains in private schema.
create or replace function public.get_fit_matches(
  p_match_category public.fit_match_category default 'overall',
  p_result_limit integer default 30
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.calculate_fit_matches(p_match_category, p_result_limit);
$$;

revoke all on function public.get_fit_matches(public.fit_match_category, integer)
from public, anon;

grant execute on function public.get_fit_matches(public.fit_match_category, integer)
to authenticated;

-- Any Fit Profile change invalidates cached scores in both directions.
create or replace function private.invalidate_fit_matches()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
  else
    v_user_id := new.user_id;
  end if;

  delete from public.fit_matches
  where fit_matches.user_id = v_user_id
     or fit_matches.matched_user_id = v_user_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.invalidate_fit_matches()
from public, anon, authenticated;

create trigger invalidate_fit_matches_after_change
  after insert or update or delete on public.fit_profiles
  for each row execute function private.invalidate_fit_matches();

comment on table public.fit_profiles is
  'Exact body measurements. Direct access is owner-only.';

comment on table public.fit_reports is
  'Garment fit evidence separated from private closet ownership and body measurements.';

comment on table public.fit_matches is
  'Safe cached match scores used by People My Size and future Fit Twins; contains no raw measurements.';
