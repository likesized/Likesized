create table private.following_activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('closet_shared','fit_report_added','outfit_posted')),
  closet_item_id uuid references public.closet_items(id) on delete cascade,
  fit_report_id uuid references public.fit_reports(id) on delete cascade,
  outfit_post_id uuid references public.outfit_posts(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  constraint following_activity_source_shape check (
    (event_type in ('closet_shared','fit_report_added') and closet_item_id is not null and fit_report_id is not null and outfit_post_id is null)
    or
    (event_type='outfit_posted' and closet_item_id is null and fit_report_id is null and outfit_post_id is not null)
  )
);

create index following_activity_actor_time_idx
  on private.following_activity_events(actor_id, occurred_at desc, id desc);
create index following_activity_closet_idx
  on private.following_activity_events(closet_item_id)
  where closet_item_id is not null;
create index following_activity_outfit_idx
  on private.following_activity_events(outfit_post_id)
  where outfit_post_id is not null;

revoke all on private.following_activity_events from public, anon, authenticated;

create or replace function private.record_fit_report_following_activity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_visibility public.closet_visibility;
  v_prior_reports bigint;
begin
  select ci.visibility
    into v_visibility
  from public.closet_items ci
  where ci.id=new.closet_item_id
    and ci.user_id=new.user_id;

  if v_visibility is distinct from 'shared'::public.closet_visibility then
    return new;
  end if;

  select count(*)
    into v_prior_reports
  from public.fit_reports fr
  where fr.closet_item_id=new.closet_item_id
    and fr.id<>new.id;

  insert into private.following_activity_events(
    actor_id,event_type,closet_item_id,fit_report_id,occurred_at
  ) values (
    new.user_id,
    case when v_prior_reports=0 then 'closet_shared' else 'fit_report_added' end,
    new.closet_item_id,
    new.id,
    new.created_at
  );

  return new;
end;
$$;

revoke all on function private.record_fit_report_following_activity() from public, anon, authenticated;

create trigger fit_report_following_activity_after_insert
after insert on public.fit_reports
for each row execute function private.record_fit_report_following_activity();

create or replace function private.record_closet_visibility_following_activity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_report_id uuid;
begin
  if old.visibility is not distinct from new.visibility then
    return new;
  end if;

  if new.visibility='private'::public.closet_visibility then
    delete from private.following_activity_events e
    where e.closet_item_id=new.id;
    return new;
  end if;

  if new.visibility='shared'::public.closet_visibility then
    select fr.id
      into v_report_id
    from public.fit_reports fr
    where fr.closet_item_id=new.id
      and fr.user_id=new.user_id
    order by fr.created_at desc, fr.id desc
    limit 1;

    if v_report_id is not null then
      insert into private.following_activity_events(
        actor_id,event_type,closet_item_id,fit_report_id,occurred_at
      ) values (
        new.user_id,'closet_shared',new.id,v_report_id,now()
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.record_closet_visibility_following_activity() from public, anon, authenticated;

create trigger closet_visibility_following_activity_after_update
after update of visibility on public.closet_items
for each row execute function private.record_closet_visibility_following_activity();

create or replace function private.record_outfit_following_activity()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  insert into private.following_activity_events(
    actor_id,event_type,outfit_post_id,occurred_at
  ) values (
    new.user_id,'outfit_posted',new.id,new.created_at
  );
  return new;
end;
$$;

revoke all on function private.record_outfit_following_activity() from public, anon, authenticated;

create trigger outfit_following_activity_after_insert
after insert on public.outfit_posts
for each row execute function private.record_outfit_following_activity();

create or replace function public.get_following_feed(
  p_result_limit integer default 50,
  p_before timestamptz default null
)
returns table (
  activity_id uuid,
  activity_type text,
  actor_id uuid,
  username text,
  display_name text,
  occurred_at timestamptz,
  relevant_match_category public.fit_match_category,
  closet_item_id uuid,
  fit_report_id uuid,
  outfit_post_id uuid,
  product_slug text,
  product_name text,
  brand_name text,
  garment_type_key text,
  size_label text,
  fit public.fit_rating,
  fit_notes text,
  would_buy_again boolean,
  outfit_caption text,
  outfit_photo_path text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_result_limit,50),1),100);
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode='28000';
  end if;

  return query
  select
    e.id,
    e.event_type,
    e.actor_id,
    p.username,
    p.display_name,
    e.occurred_at,
    case
      when e.event_type='outfit_posted' then 'overall'::public.fit_match_category
      when prod.category='tops'::public.garment_category then 'tops'::public.fit_match_category
      when prod.category='bottoms'::public.garment_category then 'bottoms'::public.fit_match_category
      else 'overall'::public.fit_match_category
    end,
    e.closet_item_id,
    e.fit_report_id,
    e.outfit_post_id,
    prod.slug,
    prod.name,
    b.name,
    prod.garment_type_key,
    fr.size_label,
    fr.fit,
    fr.fit_notes,
    fr.would_buy_again,
    op.caption,
    op.photo_url
  from private.following_activity_events e
  join public.follows f
    on f.follower_id=v_user_id
   and f.followed_id=e.actor_id
  join public.profiles p
    on p.id=e.actor_id
   and p.username is not null
  left join public.closet_items ci
    on ci.id=e.closet_item_id
  left join public.fit_reports fr
    on fr.id=e.fit_report_id
  left join public.products prod
    on prod.id=fr.product_id
  left join public.brands b
    on b.id=prod.brand_id
  left join public.outfit_posts op
    on op.id=e.outfit_post_id
  where (p_before is null or e.occurred_at<p_before)
    and (
      (
        e.event_type in ('closet_shared','fit_report_added')
        and ci.id is not null
        and ci.user_id=e.actor_id
        and ci.visibility='shared'::public.closet_visibility
        and fr.id is not null
        and fr.user_id=e.actor_id
        and fr.closet_item_id=ci.id
      )
      or
      (
        e.event_type='outfit_posted'
        and op.id is not null
        and op.user_id=e.actor_id
      )
    )
  order by e.occurred_at desc,e.id desc
  limit v_limit;
end;
$$;

revoke all on function public.get_following_feed(integer,timestamptz) from public, anon;
grant execute on function public.get_following_feed(integer,timestamptz) to authenticated;

comment on table private.following_activity_events is
  'Private canonical activity ledger for meaningful V1 Following Feed events. Raw body measurements are never stored here.';
comment on function public.get_following_feed(integer,timestamptz) is
  'Auth-bound safe Following Feed over the canonical follows relationship. Rechecks current Closet visibility so Private/deleted garment activity is not exposed.';