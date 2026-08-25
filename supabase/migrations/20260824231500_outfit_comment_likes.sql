-- LikeSized canonical migration: comment-level Like controls for published Outfits.
-- Comments stay plain-text. Like state is member-private while the safe aggregate count
-- is stored on the visible comment row.

alter table public.outfit_comments
  add column like_count integer not null default 0 check (like_count >= 0);

create table public.outfit_comment_likes (
  comment_id uuid not null references public.outfit_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id,user_id)
);
create index outfit_comment_likes_user_idx on public.outfit_comment_likes(user_id,created_at desc);

alter table public.outfit_comment_likes enable row level security;

create policy "members read own outfit comment likes"
on public.outfit_comment_likes for select to authenticated
using ((select auth.uid())=user_id);

create policy "members like visible outfit comments"
on public.outfit_comment_likes for insert to authenticated
with check (
  (select auth.uid())=user_id
  and exists (
    select 1
    from public.outfit_comments oc
    join public.outfit_posts op on op.id=oc.post_id
    where oc.id=outfit_comment_likes.comment_id
      and op.status='published'::public.outfit_post_status
      and op.comments_enabled
      and not private.members_blocked((select auth.uid()),op.user_id)
  )
);

create policy "members remove own outfit comment likes"
on public.outfit_comment_likes for delete to authenticated
using ((select auth.uid())=user_id);

grant select,insert,delete on public.outfit_comment_likes to authenticated;

create or replace function private.update_outfit_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_comment_id uuid:=coalesce(new.comment_id,old.comment_id);
begin
  update public.outfit_comments oc
  set like_count=(
    select count(*)::integer
    from public.outfit_comment_likes ocl
    where ocl.comment_id=v_comment_id
  )
  where oc.id=v_comment_id;
  return coalesce(new,old);
end;
$$;
revoke all on function private.update_outfit_comment_like_count() from public,anon,authenticated;

create trigger outfit_comment_like_count_after_change
after insert or delete on public.outfit_comment_likes
for each row execute function private.update_outfit_comment_like_count();

comment on table public.outfit_comment_likes is
  'Member-private Like state for plain-text Outfit comments. outfit_comments.like_count is the safe visible aggregate.';
