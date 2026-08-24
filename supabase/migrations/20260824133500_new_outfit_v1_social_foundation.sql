-- LikeSized canonical migration: New Outfit V1 editorial/social foundation.
-- Published Outfits are public content. Drafts are owner-only unpublished work.
-- This migration deliberately does NOT revive per-garment Closet privacy or mutate Closet visibility.

create type public.outfit_post_status as enum ('draft','published');

alter table public.outfit_posts
  alter column photo_url drop not null,
  add column headline text,
  add column story text,
  add column status public.outfit_post_status not null default 'published'::public.outfit_post_status,
  add column comments_enabled boolean not null default true,
  add column published_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add column like_count integer not null default 0 check (like_count >= 0),
  add column comment_count integer not null default 0 check (comment_count >= 0),
  add column share_count integer not null default 0 check (share_count >= 0),
  add column view_count integer not null default 0 check (view_count >= 0),
  add column follows_generated_count integer not null default 0 check (follows_generated_count >= 0),
  add constraint outfit_posts_headline_length check (
    headline is null or char_length(btrim(headline)) between 1 and 100
  ),
  add constraint outfit_posts_story_length check (
    story is null or char_length(story) <= 5000
  );

update public.outfit_posts
set
  headline = coalesce(nullif(left(btrim(caption),100),''),'Outfit'),
  story = nullif(btrim(caption),''),
  published_at = created_at,
  updated_at = created_at;

update public.outfit_posts op
set like_count = (
  select count(*)::integer from public.outfit_likes ol where ol.post_id=op.id
);

comment on column public.outfit_posts.caption is
  'Legacy compatibility mirror only. New Outfit V1 canonical editorial fields are headline and story.';
comment on column public.outfit_posts.photo_url is
  'Legacy compatibility mirror of the current main Outfit display photo path. Canonical gallery rows live in outfit_photos.';

-- Member blocking is private control state. It removes follows immediately and prevents future interaction.
create table public.member_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.member_blocks enable row level security;
create policy "members read own blocks" on public.member_blocks for select to authenticated
using ((select auth.uid())=blocker_id);
create policy "members create own blocks" on public.member_blocks for insert to authenticated
with check ((select auth.uid())=blocker_id);
create policy "members remove own blocks" on public.member_blocks for delete to authenticated
using ((select auth.uid())=blocker_id);
grant select,insert,delete on public.member_blocks to authenticated;

create or replace function private.members_blocked(p_a uuid,p_b uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select p_a is not null and p_b is not null and exists(
    select 1 from public.member_blocks mb
    where (mb.blocker_id=p_a and mb.blocked_id=p_b)
       or (mb.blocker_id=p_b and mb.blocked_id=p_a)
  );
$$;
revoke all on function private.members_blocked(uuid,uuid) from public;
grant execute on function private.members_blocked(uuid,uuid) to anon,authenticated,service_role;

create or replace function public.block_member(p_blocked_id uuid)
returns void
language plpgsql
security invoker
set search_path=''
as $$
declare v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_blocked_id is null or p_blocked_id=v_user_id then raise exception 'Invalid member'; end if;
  if not exists(select 1 from public.profiles p where p.id=p_blocked_id and p.username is not null) then raise exception 'Member not found'; end if;
  insert into public.member_blocks(blocker_id,blocked_id) values(v_user_id,p_blocked_id)
  on conflict do nothing;
  delete from public.follows
  where (follower_id=v_user_id and followed_id=p_blocked_id)
     or (follower_id=p_blocked_id and followed_id=v_user_id);
end;
$$;
revoke all on function public.block_member(uuid) from public,anon;
grant execute on function public.block_member(uuid) to authenticated;

create or replace function public.unblock_member(p_blocked_id uuid)
returns void
language sql
security invoker
set search_path=''
as $$
  delete from public.member_blocks where blocker_id=auth.uid() and blocked_id=p_blocked_id;
$$;
revoke all on function public.unblock_member(uuid) from public,anon;
grant execute on function public.unblock_member(uuid) to authenticated;

create or replace function private.reject_blocked_follow()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if private.members_blocked(new.follower_id,new.followed_id) then
    raise exception 'Blocked members cannot follow each other';
  end if;
  return new;
end;
$$;
revoke all on function private.reject_blocked_follow() from public,anon,authenticated;
drop trigger if exists reject_blocked_follow_before_insert on public.follows;
create trigger reject_blocked_follow_before_insert
before insert on public.follows
for each row execute function private.reject_blocked_follow();

-- Published Outfit media uses the existing public-facing bucket. Draft media stays in a separate private bucket.
update storage.buckets set public=true where id='outfit-photos';
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('outfit-draft-photos','outfit-draft-photos',false,8388608,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "owners read outfit draft photos" on storage.objects for select to authenticated
using(bucket_id='outfit-draft-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "owners upload outfit draft photos" on storage.objects for insert to authenticated
with check(bucket_id='outfit-draft-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "owners update outfit draft photos" on storage.objects for update to authenticated
using(bucket_id='outfit-draft-photos' and (storage.foldername(name))[1]=(select auth.uid()::text))
with check(bucket_id='outfit-draft-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "owners delete outfit draft photos" on storage.objects for delete to authenticated
using(bucket_id='outfit-draft-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));

create table public.outfit_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  bucket text not null check (bucket in ('outfit-photos','outfit-draft-photos')),
  display_path text not null,
  feed_path text not null,
  sort_order smallint not null check (sort_order between 0 and 5),
  is_main boolean not null default false,
  created_at timestamptz not null default now(),
  constraint outfit_photos_post_order_uq unique(post_id,sort_order) deferrable initially deferred
);
create unique index outfit_photos_one_main_uq on public.outfit_photos(post_id) where is_main;
create index outfit_photos_post_idx on public.outfit_photos(post_id,sort_order);

insert into public.outfit_photos(post_id,bucket,display_path,feed_path,sort_order,is_main,created_at)
select
  op.id,
  'outfit-photos',
  op.photo_url,
  case
    when op.photo_url like '%/display.webp' then regexp_replace(op.photo_url,'/display\.webp$','/feed.webp')
    else op.photo_url
  end,
  0,
  true,
  op.created_at
from public.outfit_posts op
where op.photo_url is not null;

alter table public.outfit_photos enable row level security;
create policy "published outfit photo metadata readable" on public.outfit_photos for select to anon,authenticated
using(exists(
  select 1 from public.outfit_posts op
  where op.id=outfit_photos.post_id
    and op.status='published'::public.outfit_post_status
    and ((select auth.uid()) is null or not private.members_blocked((select auth.uid()),op.user_id))
));
create policy "owners read own outfit photo metadata" on public.outfit_photos for select to authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_photos.post_id and op.user_id=(select auth.uid())));
create policy "owners insert outfit photo metadata" on public.outfit_photos for insert to authenticated
with check(exists(select 1 from public.outfit_posts op where op.id=outfit_photos.post_id and op.user_id=(select auth.uid())));
create policy "owners update outfit photo metadata" on public.outfit_photos for update to authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_photos.post_id and op.user_id=(select auth.uid())))
with check(exists(select 1 from public.outfit_posts op where op.id=outfit_photos.post_id and op.user_id=(select auth.uid())));
create policy "owners delete outfit photo metadata" on public.outfit_photos for delete to authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_photos.post_id and op.user_id=(select auth.uid())));
grant select on public.outfit_photos to anon;
grant select,insert,update,delete on public.outfit_photos to authenticated;

create table public.outfit_occasions (
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  occasion text not null check (occasion in (
    'everyday','work','business_casual','business_formal','school_campus','brunch','date_night','dinner','night_out','party','wedding_guest','formal_event','concert','festival','beach','poolside','vacation_resort','travel','gym_workout','golf','outdoors','lounge_home','running_errands','holiday_special_occasion'
  )),
  sort_order smallint not null check (sort_order between 0 and 1),
  primary key(post_id,occasion),
  unique(post_id,sort_order)
);
create index outfit_occasions_search_idx on public.outfit_occasions(occasion,post_id);
alter table public.outfit_occasions enable row level security;
create policy "published outfit occasions readable" on public.outfit_occasions for select to anon,authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_occasions.post_id and op.status='published'::public.outfit_post_status and ((select auth.uid()) is null or not private.members_blocked((select auth.uid()),op.user_id))));
create policy "owners read own outfit occasions" on public.outfit_occasions for select to authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_occasions.post_id and op.user_id=(select auth.uid())));
grant select on public.outfit_occasions to anon,authenticated;

create table public.outfit_style_tags (
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  normalized_tag text not null check (char_length(normalized_tag) between 1 and 30),
  display_tag text not null check (char_length(display_tag) between 1 and 30),
  sort_order smallint not null check (sort_order between 0 and 2),
  primary key(post_id,normalized_tag),
  unique(post_id,sort_order)
);
create index outfit_style_tags_search_idx on public.outfit_style_tags(normalized_tag,post_id);
alter table public.outfit_style_tags enable row level security;
create policy "published outfit style tags readable" on public.outfit_style_tags for select to anon,authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_style_tags.post_id and op.status='published'::public.outfit_post_status and ((select auth.uid()) is null or not private.members_blocked((select auth.uid()),op.user_id))));
create policy "owners read own outfit style tags" on public.outfit_style_tags for select to authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_style_tags.post_id and op.user_id=(select auth.uid())));
grant select on public.outfit_style_tags to anon,authenticated;

create table public.outfit_photo_tags (
  photo_id uuid not null references public.outfit_photos(id) on delete cascade,
  closet_item_id uuid not null references public.closet_items(id) on delete cascade,
  x numeric(6,5) not null check (x between 0 and 1),
  y numeric(6,5) not null check (y between 0 and 1),
  created_at timestamptz not null default now(),
  primary key(photo_id,closet_item_id)
);
alter table public.outfit_photo_tags enable row level security;
create policy "members read published outfit hotspots" on public.outfit_photo_tags for select to authenticated
using(exists(
  select 1 from public.outfit_photos ph
  join public.outfit_posts op on op.id=ph.post_id
  where ph.id=outfit_photo_tags.photo_id
    and (op.user_id=(select auth.uid()) or (op.status='published'::public.outfit_post_status and not private.members_blocked((select auth.uid()),op.user_id)))
));
grant select on public.outfit_photo_tags to authenticated;

-- Drafts are owner-only. Published posts are readable publicly; blocked members disappear from one another while signed in.
drop policy if exists "members read outfits" on public.outfit_posts;
create policy "published outfits readable" on public.outfit_posts for select to anon,authenticated
using(status='published'::public.outfit_post_status and ((select auth.uid()) is null or not private.members_blocked((select auth.uid()),user_id)));
create policy "owners read own outfit drafts" on public.outfit_posts for select to authenticated
using((select auth.uid())=user_id);
grant select on public.outfit_posts to anon;

-- Tagged Closet links remain member-only so logged-out shared pages cannot expose garment details.
drop policy if exists "members read outfit item links" on public.outfit_post_items;
create policy "members read published outfit item links" on public.outfit_post_items for select to authenticated
using(exists(
  select 1 from public.outfit_posts op
  where op.id=outfit_post_items.post_id
    and (op.user_id=(select auth.uid()) or (op.status='published'::public.outfit_post_status and not private.members_blocked((select auth.uid()),op.user_id)))
));

-- Likes remain member-only rows; public counts live on the post.
drop policy if exists "owner likes outfit" on public.outfit_likes;
create policy "member likes visible outfit" on public.outfit_likes for insert to authenticated
with check(
  (select auth.uid())=user_id
  and exists(select 1 from public.outfit_posts op where op.id=outfit_likes.post_id and op.status='published'::public.outfit_post_status and not private.members_blocked((select auth.uid()),op.user_id))
);

create or replace function private.update_outfit_like_count()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.outfit_posts
  set like_count=(select count(*)::integer from public.outfit_likes ol where ol.post_id=coalesce(new.post_id,old.post_id)),updated_at=now()
  where id=coalesce(new.post_id,old.post_id);
  return coalesce(new,old);
end;
$$;
revoke all on function private.update_outfit_like_count() from public,anon,authenticated;
drop trigger if exists outfit_like_count_after_change on public.outfit_likes;
create trigger outfit_like_count_after_change after insert or delete on public.outfit_likes
for each row execute function private.update_outfit_like_count();

create table public.outfit_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (
    char_length(btrim(body)) between 1 and 500
    and body !~* '(https?://|www\.)'
  ),
  created_at timestamptz not null default now()
);
create index outfit_comments_post_time_idx on public.outfit_comments(post_id,created_at,id);
alter table public.outfit_comments enable row level security;
create policy "members read visible outfit comments" on public.outfit_comments for select to authenticated
using(exists(select 1 from public.outfit_posts op where op.id=outfit_comments.post_id and (op.user_id=(select auth.uid()) or (op.status='published'::public.outfit_post_status and not private.members_blocked((select auth.uid()),op.user_id)))));
create policy "members add visible outfit comments" on public.outfit_comments for insert to authenticated
with check(
  (select auth.uid())=user_id
  and exists(select 1 from public.outfit_posts op where op.id=outfit_comments.post_id and op.status='published'::public.outfit_post_status and op.comments_enabled and not private.members_blocked((select auth.uid()),op.user_id))
);
create policy "commenter or outfit owner deletes comment" on public.outfit_comments for delete to authenticated
using(
  user_id=(select auth.uid())
  or exists(select 1 from public.outfit_posts op where op.id=outfit_comments.post_id and op.user_id=(select auth.uid()))
);
grant select,insert,delete on public.outfit_comments to authenticated;

create or replace function private.update_outfit_comment_count()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.outfit_posts
  set comment_count=(select count(*)::integer from public.outfit_comments oc where oc.post_id=coalesce(new.post_id,old.post_id)),updated_at=now()
  where id=coalesce(new.post_id,old.post_id);
  return coalesce(new,old);
end;
$$;
revoke all on function private.update_outfit_comment_count() from public,anon,authenticated;
create trigger outfit_comment_count_after_change after insert or delete on public.outfit_comments
for each row execute function private.update_outfit_comment_count();

-- Internal-only shop click attribution. Creators do not receive this metric in V1.
create table private.outfit_shop_clicks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.outfit_posts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index outfit_shop_clicks_post_idx on private.outfit_shop_clicks(post_id,created_at desc);
revoke all on private.outfit_shop_clicks from public,anon,authenticated;

create or replace function private.normalize_outfit_style_tag(p_value text)
returns text
language sql
immutable
set search_path=''
as $$
  select lower(regexp_replace(btrim(regexp_replace(coalesce(p_value,''),'^#+','','g')),'[^[:alnum:]]+','','g'));
$$;
revoke all on function private.normalize_outfit_style_tag(text) from public,anon,authenticated;

create or replace function public.save_outfit_post_content(
  p_post_id uuid,
  p_headline text,
  p_story text,
  p_closet_item_ids uuid[],
  p_occasions text[],
  p_style_tags text[],
  p_comments_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_status public.outfit_post_status;
  v_headline text:=nullif(btrim(coalesce(p_headline,'')),'');
  v_story text:=nullif(btrim(coalesce(p_story,'')),'');
  v_item_ids uuid[]:=coalesce(p_closet_item_ids,array[]::uuid[]);
  v_occasions text[]:=coalesce(p_occasions,array[]::text[]);
  v_styles text[]:=coalesce(p_style_tags,array[]::text[]);
  v_count integer;
  v_value text;
  v_normalized text;
  v_index integer:=0;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_post_id is null then raise exception 'Outfit id is required'; end if;
  if v_headline is not null and char_length(v_headline)>100 then raise exception 'Headline is too long'; end if;
  if v_story is not null and char_length(v_story)>5000 then raise exception 'Outfit Story is too long'; end if;
  if cardinality(v_item_ids)>6 or cardinality(v_occasions)>2 or cardinality(v_styles)>3 then raise exception 'Too many Outfit selections'; end if;
  if cardinality(v_item_ids)<>(select count(distinct x) from unnest(v_item_ids) x where x is not null) then raise exception 'Garments must be unique'; end if;
  if cardinality(v_occasions)<>(select count(distinct x) from unnest(v_occasions) x where x is not null) then raise exception 'Occasions must be unique'; end if;

  select status into v_status from public.outfit_posts where id=p_post_id and user_id=v_user_id;
  if not found then
    insert into public.outfit_posts(id,user_id,caption,headline,story,status,comments_enabled,created_at,updated_at)
    values(p_post_id,v_user_id,v_headline,v_headline,v_story,'draft',coalesce(p_comments_enabled,true),now(),now());
    v_status:='draft';
  else
    update public.outfit_posts
    set caption=v_headline,headline=v_headline,story=v_story,comments_enabled=coalesce(p_comments_enabled,true),updated_at=now()
    where id=p_post_id and user_id=v_user_id;
  end if;

  select count(*)::integer into v_count from public.closet_items ci
  where ci.user_id=v_user_id and ci.id=any(v_item_ids);
  if v_count<>cardinality(v_item_ids) then raise exception 'Every tagged garment must belong to the current member'; end if;
  select count(distinct fr.closet_item_id)::integer into v_count from public.fit_reports fr
  where fr.user_id=v_user_id and fr.closet_item_id=any(v_item_ids);
  if v_count<>cardinality(v_item_ids) then raise exception 'Every tagged garment must have Fit Report evidence'; end if;

  delete from public.outfit_post_items where post_id=p_post_id;
  insert into public.outfit_post_items(post_id,closet_item_id)
  select p_post_id,x from unnest(v_item_ids) x;

  delete from public.outfit_occasions where post_id=p_post_id;
  v_index:=0;
  foreach v_value in array v_occasions loop
    insert into public.outfit_occasions(post_id,occasion,sort_order) values(p_post_id,v_value,v_index);
    v_index:=v_index+1;
  end loop;

  delete from public.outfit_style_tags where post_id=p_post_id;
  v_index:=0;
  foreach v_value in array v_styles loop
    v_value:=btrim(regexp_replace(v_value,'^#+','','g'));
    if char_length(v_value) not between 1 and 30 then raise exception 'Style tags must be 1 to 30 characters'; end if;
    v_normalized:=private.normalize_outfit_style_tag(v_value);
    if v_normalized='' or char_length(v_normalized)>30 then raise exception 'Invalid style tag'; end if;
    insert into public.outfit_style_tags(post_id,normalized_tag,display_tag,sort_order)
    values(p_post_id,v_normalized,v_value,v_index);
    v_index:=v_index+1;
  end loop;

  if v_status='published'::public.outfit_post_status then
    if v_headline is null or cardinality(v_item_ids) not between 1 and 6 or cardinality(v_occasions) not between 1 and 2 then
      raise exception 'Published Outfits must keep headline, garments and occasion';
    end if;
  end if;

  return p_post_id;
end;
$$;
revoke all on function public.save_outfit_post_content(uuid,text,text,uuid[],text[],text[],boolean) from public,anon;
grant execute on function public.save_outfit_post_content(uuid,text,text,uuid[],text[],text[],boolean) to authenticated;

create or replace function public.register_outfit_photo(
  p_post_id uuid,
  p_photo_id uuid,
  p_bucket text,
  p_display_path text,
  p_feed_path text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_bucket not in ('outfit-photos','outfit-draft-photos') then raise exception 'Invalid Outfit photo bucket'; end if;
  if not exists(select 1 from public.outfit_posts op where op.id=p_post_id and op.user_id=v_user_id) then raise exception 'Outfit not found'; end if;
  if p_display_path !~ ('^'||v_user_id::text||'/'||p_post_id::text||'/'||p_photo_id::text||'/display\.webp$')
     or p_feed_path !~ ('^'||v_user_id::text||'/'||p_post_id::text||'/'||p_photo_id::text||'/feed\.webp$') then
    raise exception 'Invalid Outfit photo path';
  end if;
  select count(*)::integer into v_count from public.outfit_photos where post_id=p_post_id;
  if v_count>=6 then raise exception 'Outfits allow at most 6 photos'; end if;
  insert into public.outfit_photos(id,post_id,bucket,display_path,feed_path,sort_order,is_main)
  values(p_photo_id,p_post_id,p_bucket,p_display_path,p_feed_path,v_count,v_count=0);
  return p_photo_id;
end;
$$;
revoke all on function public.register_outfit_photo(uuid,uuid,text,text,text) from public,anon;
grant execute on function public.register_outfit_photo(uuid,uuid,text,text,text) to authenticated;

create or replace function public.sync_outfit_photo_order(
  p_post_id uuid,
  p_photo_ids uuid[],
  p_main_photo_id uuid
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user_id uuid:=auth.uid(); v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.outfit_posts where id=p_post_id and user_id=v_user_id) then raise exception 'Outfit not found'; end if;
  if cardinality(coalesce(p_photo_ids,array[]::uuid[])) not between 1 and 6 then raise exception 'Choose 1 to 6 Outfit photos'; end if;
  if p_main_photo_id is null or not (p_main_photo_id=any(p_photo_ids)) then raise exception 'Main photo must be in the gallery'; end if;
  select count(*)::integer into v_count from public.outfit_photos where post_id=p_post_id and id=any(p_photo_ids);
  if v_count<>cardinality(p_photo_ids) or v_count<>(select count(*)::integer from public.outfit_photos where post_id=p_post_id) then raise exception 'Photo order does not match this Outfit'; end if;
  update public.outfit_photos ph
  set sort_order=q.ord-1,is_main=(ph.id=p_main_photo_id)
  from unnest(p_photo_ids) with ordinality q(id,ord)
  where ph.post_id=p_post_id and ph.id=q.id;
  update public.outfit_posts op
  set photo_url=(select ph.display_path from public.outfit_photos ph where ph.post_id=p_post_id and ph.id=p_main_photo_id),updated_at=now()
  where op.id=p_post_id and op.user_id=v_user_id;
end;
$$;
revoke all on function public.sync_outfit_photo_order(uuid,uuid[],uuid) from public,anon;
grant execute on function public.sync_outfit_photo_order(uuid,uuid[],uuid) to authenticated;

create or replace function public.replace_outfit_photo_tags(p_photo_id uuid,p_tags jsonb)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_post_id uuid;
  v_item jsonb;
  v_closet_item_id uuid;
  v_x numeric;
  v_y numeric;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select ph.post_id into v_post_id
  from public.outfit_photos ph join public.outfit_posts op on op.id=ph.post_id
  where ph.id=p_photo_id and op.user_id=v_user_id;
  if v_post_id is null then raise exception 'Outfit photo not found'; end if;
  if jsonb_typeof(coalesce(p_tags,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_tags,'[]'::jsonb))>6 then raise exception 'Invalid photo tags'; end if;
  delete from public.outfit_photo_tags where photo_id=p_photo_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_tags,'[]'::jsonb)) loop
    v_closet_item_id:=(v_item->>'closet_item_id')::uuid;
    v_x:=(v_item->>'x')::numeric;
    v_y:=(v_item->>'y')::numeric;
    if v_x not between 0 and 1 or v_y not between 0 and 1 then raise exception 'Invalid hotspot position'; end if;
    if not exists(select 1 from public.outfit_post_items oi where oi.post_id=v_post_id and oi.closet_item_id=v_closet_item_id) then raise exception 'Hotspot garment is not tagged in this Outfit'; end if;
    insert into public.outfit_photo_tags(photo_id,closet_item_id,x,y)
    values(p_photo_id,v_closet_item_id,v_x,v_y);
  end loop;
end;
$$;
revoke all on function public.replace_outfit_photo_tags(uuid,jsonb) from public,anon;
grant execute on function public.replace_outfit_photo_tags(uuid,jsonb) to authenticated;

create or replace function public.publish_outfit_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user_id uuid:=auth.uid(); v_photo_count integer; v_item_count integer; v_occ_count integer; v_main_path text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.outfit_posts op where op.id=p_post_id and op.user_id=v_user_id and op.headline is not null) then raise exception 'Outfit headline is required'; end if;
  select count(*)::integer,min(display_path) filter(where is_main) into v_photo_count,v_main_path from public.outfit_photos where post_id=p_post_id and bucket='outfit-photos';
  if v_photo_count not between 1 and 6 or v_main_path is null or v_photo_count<>(select count(*)::integer from public.outfit_photos where post_id=p_post_id) then raise exception 'Published Outfits require 1 to 6 public photos and one main photo'; end if;
  select count(*)::integer into v_item_count from public.outfit_post_items where post_id=p_post_id;
  select count(*)::integer into v_occ_count from public.outfit_occasions where post_id=p_post_id;
  if v_item_count not between 1 and 6 then raise exception 'Choose 1 to 6 Closet garments'; end if;
  if v_occ_count not between 1 and 2 then raise exception 'Choose 1 or 2 occasions'; end if;
  update public.outfit_posts
  set status='published',published_at=coalesce(published_at,now()),photo_url=v_main_path,caption=headline,updated_at=now()
  where id=p_post_id and user_id=v_user_id;
end;
$$;
revoke all on function public.publish_outfit_post(uuid) from public,anon;
grant execute on function public.publish_outfit_post(uuid) to authenticated;

-- Compatibility boundary for the retired one-photo creator. It no longer changes Closet visibility.
create or replace function public.create_outfit_post(
  p_post_id uuid,
  p_caption text,
  p_photo_url text,
  p_closet_item_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_user_id uuid:=auth.uid(); v_count integer; v_photo_id uuid:=gen_random_uuid(); v_feed_path text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_post_id is null or nullif(btrim(coalesce(p_photo_url,'')),'') is null then raise exception 'Invalid outfit post'; end if;
  v_count:=coalesce(cardinality(p_closet_item_ids),0);
  if v_count not between 1 and 6 then raise exception 'Choose 1 to 6 Closet items'; end if;
  perform public.save_outfit_post_content(
    p_post_id,
    coalesce(nullif(left(btrim(coalesce(p_caption,'')),100),''),'Outfit'),
    null,
    p_closet_item_ids,
    array['everyday'],
    array[]::text[],
    true
  );
  v_feed_path:=case when p_photo_url like '%/display.webp' then regexp_replace(p_photo_url,'/display\.webp$','/feed.webp') else p_photo_url end;
  insert into public.outfit_photos(id,post_id,bucket,display_path,feed_path,sort_order,is_main)
  values(v_photo_id,p_post_id,'outfit-photos',p_photo_url,v_feed_path,0,true)
  on conflict do nothing;
  update public.outfit_posts set photo_url=p_photo_url,status='published',published_at=now(),updated_at=now() where id=p_post_id and user_id=v_user_id;
  return p_post_id;
end;
$$;
revoke all on function public.create_outfit_post(uuid,text,text,uuid[]) from public,anon;
grant execute on function public.create_outfit_post(uuid,text,text,uuid[]) to authenticated;

-- Draft inserts must never create Following activity. Only the first transition to Published creates it.
drop trigger if exists outfit_following_activity_after_insert on public.outfit_posts;
create or replace function private.record_outfit_following_activity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.status='published'::public.outfit_post_status
     and (tg_op='INSERT' or old.status is distinct from 'published'::public.outfit_post_status) then
    insert into private.following_activity_events(actor_id,event_type,outfit_post_id,occurred_at)
    values(new.user_id,'outfit_posted',new.id,coalesce(new.published_at,new.created_at));
  end if;
  return new;
end;
$$;
revoke all on function private.record_outfit_following_activity() from public,anon,authenticated;
create trigger outfit_following_activity_after_publish
after insert or update of status on public.outfit_posts
for each row execute function private.record_outfit_following_activity();

-- Replace current community-aware Following helper so blocks and drafts cannot leak through SECURITY DEFINER.
create or replace function private.get_following_feed_for_current_user_community(
  p_result_limit integer,
  p_before timestamptz,
  p_fit_community public.fit_community
)
returns table(
  activity_id uuid,activity_type text,actor_id uuid,username text,display_name text,occurred_at timestamptz,
  relevant_match_category public.fit_match_category,closet_item_id uuid,fit_report_id uuid,outfit_post_id uuid,
  product_slug text,product_name text,brand_name text,garment_type_key text,size_label text,fit public.fit_rating,
  fit_notes text,would_buy_again boolean,outfit_caption text,outfit_photo_path text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_result_limit,50),1),100);
  v_community public.fit_community;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select coalesce(p_fit_community,fp.fit_community,'both'::public.fit_community) into v_community
  from public.fit_profiles fp where fp.user_id=v_user_id;
  return query
  select
    e.id,e.event_type,e.actor_id,p.username,p.display_name,e.occurred_at,
    case when e.event_type='outfit_posted' then 'overall'::public.fit_match_category
      when prod.category='tops'::public.garment_category then 'tops'::public.fit_match_category
      when prod.category='bottoms'::public.garment_category then 'bottoms'::public.fit_match_category
      else 'overall'::public.fit_match_category end,
    e.closet_item_id,e.fit_report_id,e.outfit_post_id,prod.slug,prod.name,b.name,prod.garment_type_key,
    fr.size_label,fr.fit,fr.fit_notes,fr.would_buy_again,op.headline,op.photo_url
  from private.following_activity_events e
  join public.follows f on f.follower_id=v_user_id and f.followed_id=e.actor_id
  join public.profiles p on p.id=e.actor_id and p.username is not null
  join public.fit_profiles actor_fp on actor_fp.user_id=e.actor_id and actor_fp.completed_at is not null
  left join public.closet_items ci on ci.id=e.closet_item_id
  left join public.fit_reports fr on fr.id=e.fit_report_id
  left join public.products prod on prod.id=fr.product_id
  left join public.brands b on b.id=prod.brand_id
  left join public.outfit_posts op on op.id=e.outfit_post_id
  where (p_before is null or e.occurred_at<p_before)
    and not private.members_blocked(v_user_id,e.actor_id)
    and (v_community='both'::public.fit_community or actor_fp.fit_community='both'::public.fit_community or actor_fp.fit_community=v_community)
    and (
      (e.event_type in ('closet_shared','fit_report_added') and ci.id is not null and ci.user_id=e.actor_id and ci.visibility='shared'::public.closet_visibility and fr.id is not null and fr.user_id=e.actor_id and fr.closet_item_id=ci.id)
      or
      (e.event_type='outfit_posted' and op.id is not null and op.user_id=e.actor_id and op.status='published'::public.outfit_post_status)
    )
  order by e.occurred_at desc,e.id desc
  limit v_limit;
end;
$$;

-- Safe public engagement counters. Raw interaction identities remain member/admin-only.
create or replace function public.record_outfit_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_owner uuid; v_viewer uuid:=auth.uid();
begin
  select user_id into v_owner from public.outfit_posts where id=p_post_id and status='published'::public.outfit_post_status;
  if v_owner is null then return; end if;
  if v_viewer is not null and (v_viewer=v_owner or private.members_blocked(v_viewer,v_owner)) then return; end if;
  update public.outfit_posts set view_count=view_count+1 where id=p_post_id;
end;
$$;
revoke all on function public.record_outfit_view(uuid) from public;
grant execute on function public.record_outfit_view(uuid) to anon,authenticated;

create or replace function public.record_outfit_share(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_owner uuid; v_viewer uuid:=auth.uid();
begin
  select user_id into v_owner from public.outfit_posts where id=p_post_id and status='published'::public.outfit_post_status;
  if v_owner is null then return; end if;
  if v_viewer is not null and private.members_blocked(v_viewer,v_owner) then return; end if;
  update public.outfit_posts set share_count=share_count+1 where id=p_post_id;
end;
$$;
revoke all on function public.record_outfit_share(uuid) from public;
grant execute on function public.record_outfit_share(uuid) to anon,authenticated;

create or replace function public.follow_from_outfit(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare v_viewer uuid:=auth.uid(); v_owner uuid; v_inserted integer;
begin
  if v_viewer is null then raise exception 'Authentication required'; end if;
  select user_id into v_owner from public.outfit_posts where id=p_post_id and status='published'::public.outfit_post_status;
  if v_owner is null or v_owner=v_viewer then return false; end if;
  if private.members_blocked(v_viewer,v_owner) then raise exception 'Blocked members cannot follow each other'; end if;
  insert into public.follows(follower_id,followed_id) values(v_viewer,v_owner) on conflict do nothing;
  get diagnostics v_inserted=row_count;
  if v_inserted>0 then update public.outfit_posts set follows_generated_count=follows_generated_count+1 where id=p_post_id; end if;
  return v_inserted>0;
end;
$$;
revoke all on function public.follow_from_outfit(uuid) from public,anon;
grant execute on function public.follow_from_outfit(uuid) to authenticated;

create or replace function public.record_outfit_shop_click(p_post_id uuid,p_product_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_user_id uuid:=auth.uid(); v_owner uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select user_id into v_owner from public.outfit_posts where id=p_post_id and status='published'::public.outfit_post_status;
  if v_owner is null or private.members_blocked(v_user_id,v_owner) then raise exception 'Outfit not available'; end if;
  if not exists(
    select 1 from public.outfit_post_items oi
    join public.fit_reports fr on fr.closet_item_id=oi.closet_item_id
    where oi.post_id=p_post_id and fr.product_id=p_product_id
  ) then raise exception 'Product is not part of this Outfit'; end if;
  insert into private.outfit_shop_clicks(post_id,product_id,user_id) values(p_post_id,p_product_id,v_user_id);
end;
$$;
revoke all on function public.record_outfit_shop_click(uuid,uuid) from public,anon;
grant execute on function public.record_outfit_shop_click(uuid,uuid) to authenticated;

-- Reporting adds Outfit comments while retaining historical report reasons for compatibility.
alter type public.moderation_target_type add value if not exists 'outfit_comment';
alter table public.content_reports drop constraint if exists content_reports_reason_check;
alter table public.content_reports add constraint content_reports_reason_check check(reason in (
  'spam','harassment','inappropriate_content','scam_misleading','other',
  'nudity_or_sexual_content','harassment_or_hate','violence_or_dangerous_content','spam_or_scam','privacy_violation'
));

create or replace function public.report_content(
  p_target_type public.moderation_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_user_id uuid:=auth.uid(); v_owner_id uuid; v_report_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_target_type='outfit_post' then
    select user_id into v_owner_id from public.outfit_posts where id=p_target_id and status='published'::public.outfit_post_status;
  elsif p_target_type='outfit_comment' then
    select oc.user_id into v_owner_id from public.outfit_comments oc join public.outfit_posts op on op.id=oc.post_id where oc.id=p_target_id and op.status='published'::public.outfit_post_status;
  else
    select user_id into v_owner_id from public.fit_reference_photos where id=p_target_id;
  end if;
  if v_owner_id is null then raise exception 'Content not found'; end if;
  insert into public.content_reports(reporter_id,target_type,target_id,reported_user_id,reason,details)
  values(v_user_id,p_target_type,p_target_id,v_owner_id,p_reason,nullif(btrim(p_details),''))
  on conflict(reporter_id,target_type,target_id) do update
  set reason=excluded.reason,details=excluded.details,status='open',resolved_at=null,resolved_by=null
  returning id into v_report_id;
  return v_report_id;
end;
$$;

comment on table public.outfit_comments is 'Plain-text V1 Outfit comments. No media or clickable external links are allowed.';
comment on table public.outfit_style_tags is 'Creator-entered optional style language, maximum three tags; normalized_tag supports future keyword discovery.';
comment on table public.outfit_occasions is 'Required fixed Outfit occasion vocabulary, one or two values on published Outfits.';
comment on table private.outfit_shop_clicks is 'Internal-only commerce attribution. V1 creators do not receive Shop click counts.';
