-- LikeSized V1 database schema
create extension if not exists "pgcrypto";

create type fit_rating as enum ('too_small','snug','just_right','relaxed','too_big');
create type garment_category as enum ('tops','bottoms','dresses','outerwear','shoes','other');
create type visibility_level as enum ('private','matches','public');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  default_measurement_visibility visibility_level not null default 'private',
  created_at timestamptz not null default now()
);

create table public.fit_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  height_in numeric(5,2),
  weight_lb numeric(6,2),
  chest_in numeric(5,2),
  waist_in numeric(5,2),
  hips_in numeric(5,2),
  inseam_in numeric(5,2),
  shoulders_in numeric(5,2),
  torso_in numeric(5,2),
  shoe_size_us numeric(4,1),
  shirt_size text,
  pants_waist text,
  pants_inseam text,
  dress_size text,
  updated_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  website_url text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  name text not null,
  slug text unique not null,
  category garment_category not null,
  image_url text,
  retailer_url text,
  created_at timestamptz not null default now(),
  unique(brand_id, name)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_label text not null,
  color_label text,
  sku text,
  unique(product_id, size_label, color_label)
);

create table public.closet_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid references public.product_variants(id),
  size_label text not null,
  fit fit_rating not null,
  fit_notes text,
  wears_count integer not null default 0 check (wears_count >= 0),
  would_buy_again boolean,
  purchased_at date,
  photo_url text,
  created_at timestamptz not null default now()
);

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
  primary key(post_id, closet_item_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id, followed_id),
  check(follower_id <> followed_id)
);

-- Exact measurements are private by default. Product reports can be public while
-- profile measurement values remain hidden; the app exposes calculated match scores.
alter table public.profiles enable row level security;
alter table public.fit_profiles enable row level security;
alter table public.closet_items enable row level security;
alter table public.outfit_posts enable row level security;
alter table public.outfit_post_items enable row level security;
alter table public.follows enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;

create policy "public profiles readable" on public.profiles for select using (true);
create policy "owner updates profile" on public.profiles for update using (auth.uid() = id);
create policy "owner reads fit profile" on public.fit_profiles for select using (auth.uid() = user_id);
create policy "owner writes fit profile" on public.fit_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public brands readable" on public.brands for select using (true);
create policy "public products readable" on public.products for select using (true);
create policy "public variants readable" on public.product_variants for select using (true);
create policy "closet reports readable" on public.closet_items for select using (true);
create policy "owner writes closet" on public.closet_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outfits readable" on public.outfit_posts for select using (true);
create policy "owner writes outfits" on public.outfit_posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "outfit item links readable" on public.outfit_post_items for select using (true);
create policy "owner follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Safe match endpoint: returns scores without returning raw fit_profile measurements.
-- V1 prototype. Tune tolerances with real data before treating percentages as calibrated confidence.
create or replace function public.get_fit_matches(match_category text default 'overall', result_limit integer default 30)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  match_score integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me public.fit_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into me from public.fit_profiles where fit_profiles.user_id = auth.uid();
  if not found then
    return;
  end if;

  return query
  with candidates as (
    select fp.*, p.username, p.display_name, p.avatar_url
    from public.fit_profiles fp
    join public.profiles p on p.id = fp.user_id
    where fp.user_id <> auth.uid()
  ), scored as (
    select
      c.user_id,
      c.username,
      c.display_name,
      c.avatar_url,
      case
        when match_category = 'tops' then
          (
            coalesce(greatest(0, 1 - abs(me.chest_in - c.chest_in) / 5.0) * 0.34, 0) +
            coalesce(greatest(0, 1 - abs(me.shoulders_in - c.shoulders_in) / 3.0) * 0.25, 0) +
            coalesce(greatest(0, 1 - abs(me.torso_in - c.torso_in) / 4.0) * 0.16, 0) +
            coalesce(greatest(0, 1 - abs(me.height_in - c.height_in) / 5.0) * 0.13, 0) +
            coalesce(greatest(0, 1 - abs(me.weight_lb - c.weight_lb) / 45.0) * 0.07, 0) +
            coalesce(greatest(0, 1 - abs(me.waist_in - c.waist_in) / 6.0) * 0.05, 0)
          )
        when match_category = 'bottoms' then
          (
            coalesce(greatest(0, 1 - abs(me.waist_in - c.waist_in) / 5.0) * 0.34, 0) +
            coalesce(greatest(0, 1 - abs(me.hips_in - c.hips_in) / 5.0) * 0.28, 0) +
            coalesce(greatest(0, 1 - abs(me.inseam_in - c.inseam_in) / 3.0) * 0.24, 0) +
            coalesce(greatest(0, 1 - abs(me.height_in - c.height_in) / 5.0) * 0.09, 0) +
            coalesce(greatest(0, 1 - abs(me.weight_lb - c.weight_lb) / 45.0) * 0.05, 0)
          )
        else
          (
            coalesce(greatest(0, 1 - abs(me.height_in - c.height_in) / 5.0) * 0.12, 0) +
            coalesce(greatest(0, 1 - abs(me.weight_lb - c.weight_lb) / 45.0) * 0.08, 0) +
            coalesce(greatest(0, 1 - abs(me.chest_in - c.chest_in) / 6.0) * 0.20, 0) +
            coalesce(greatest(0, 1 - abs(me.waist_in - c.waist_in) / 6.0) * 0.20, 0) +
            coalesce(greatest(0, 1 - abs(me.hips_in - c.hips_in) / 6.0) * 0.16, 0) +
            coalesce(greatest(0, 1 - abs(me.inseam_in - c.inseam_in) / 4.0) * 0.10, 0) +
            coalesce(greatest(0, 1 - abs(me.shoulders_in - c.shoulders_in) / 4.0) * 0.08, 0) +
            coalesce(greatest(0, 1 - abs(me.torso_in - c.torso_in) / 4.0) * 0.06, 0)
          )
      end as raw_score
    from candidates c
  )
  select s.user_id, s.username, s.display_name, s.avatar_url,
         round(least(1, greatest(0, s.raw_score)) * 100)::integer as match_score
  from scored s
  order by s.raw_score desc
  limit greatest(1, least(result_limit, 100));
end;
$$;

revoke all on function public.get_fit_matches(text, integer) from public;
grant execute on function public.get_fit_matches(text, integer) to authenticated;
