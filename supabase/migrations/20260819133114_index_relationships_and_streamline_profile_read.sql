create index if not exists closet_items_user_id_idx
  on public.closet_items (user_id);

create index if not exists closet_items_product_id_idx
  on public.closet_items (product_id);

create index if not exists closet_items_variant_product_size_idx
  on public.closet_items (variant_id, product_id, size_label);

create index if not exists fit_reports_user_id_idx
  on public.fit_reports (user_id);

create index if not exists fit_reports_variant_product_size_idx
  on public.fit_reports (variant_id, product_id, size_label);

create index if not exists follows_followed_id_idx
  on public.follows (followed_id);

create index if not exists fit_matches_matched_user_id_idx
  on public.fit_matches (matched_user_id);

create index if not exists outfit_posts_user_id_idx
  on public.outfit_posts (user_id);

create index if not exists outfit_post_items_closet_item_id_idx
  on public.outfit_post_items (closet_item_id);

drop policy if exists "completed profiles readable" on public.profiles;
drop policy if exists "owner reads own profile" on public.profiles;

create policy "completed profiles readable to anon"
on public.profiles
for select
to anon
using (username is not null);

create policy "members read completed or own profile"
on public.profiles
for select
to authenticated
using (
  username is not null
  or (select auth.uid()) = id
);