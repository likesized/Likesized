create table public.fit_twin_settings (
  singleton boolean primary key default true check (singleton),
  threshold_percent integer not null default 85 check (threshold_percent between 50 and 99),
  updated_at timestamptz not null default now()
);

insert into public.fit_twin_settings (singleton, threshold_percent)
values (true, 85)
on conflict (singleton) do nothing;

alter table public.fit_twin_settings enable row level security;

create policy "Authenticated members can read Fit Twin settings"
on public.fit_twin_settings for select
to authenticated
using (true);

create table public.product_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index product_likes_product_id_idx on public.product_likes(product_id);
alter table public.product_likes enable row level security;

create policy "Members read their product likes"
on public.product_likes for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Members create their product likes"
on public.product_likes for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Members remove their product likes"
on public.product_likes for delete to authenticated
using ((select auth.uid()) = user_id);

create table public.wish_locker_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wish_locker_items_product_id_idx on public.wish_locker_items(product_id);
alter table public.wish_locker_items enable row level security;

create policy "Members read their Wish Locker"
on public.wish_locker_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Members add to their Wish Locker"
on public.wish_locker_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Members remove from their Wish Locker"
on public.wish_locker_items for delete to authenticated
using ((select auth.uid()) = user_id);

comment on table public.fit_twin_settings is 'One configurable product-wide threshold for the Fit Twin designation among people a member follows.';
comment on table public.product_likes is 'Private garment/product likes. Distinct from Outfit likes and Wish Locker intent.';
comment on table public.wish_locker_items is 'Private products a member specifically wants to buy. Distinct from ordinary product likes.';
