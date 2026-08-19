create table public.outfit_likes (
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index outfit_likes_user_id_idx
  on public.outfit_likes (user_id);

alter table public.outfit_likes enable row level security;

create policy "members read outfit likes"
on public.outfit_likes
for select
to authenticated
using (true);

create policy "owner likes outfit"
on public.outfit_likes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "owner unlikes outfit"
on public.outfit_likes
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.outfit_likes from anon, authenticated;
grant select, insert, delete on public.outfit_likes to authenticated;

comment on table public.outfit_likes is
  'Member-facing likes on outfit posts. Contains no body measurements or private Closet data.';