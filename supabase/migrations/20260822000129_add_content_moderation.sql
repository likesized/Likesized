create type public.moderation_target_type as enum ('outfit_post', 'fit_reference_photo');
create type public.moderation_report_status as enum ('open', 'dismissed', 'content_removed');

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

insert into private.admin_users (user_id)
select id from auth.users order by created_at, id limit 1
on conflict (user_id) do nothing;

create or replace function private.is_admin(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admin_users a where a.user_id = p_user_id);
$$;
revoke all on function private.is_admin(uuid) from public, anon, authenticated;
grant execute on function private.is_admin(uuid) to authenticated;

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.moderation_target_type not null,
  target_id uuid not null,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('nudity_or_sexual_content','harassment_or_hate','violence_or_dangerous_content','spam_or_scam','privacy_violation','other')),
  details text check (details is null or char_length(details) <= 500),
  status public.moderation_report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  unique (reporter_id, target_type, target_id)
);
create index content_reports_queue_idx on public.content_reports(status, created_at);
create index content_reports_target_idx on public.content_reports(target_type, target_id);
alter table public.content_reports enable row level security;

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.content_reports(id) on delete set null,
  admin_user_id uuid not null references auth.users(id),
  action text not null check (action in ('dismiss_report','remove_content')),
  target_type public.moderation_target_type not null,
  target_id uuid not null,
  reported_user_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
create index moderation_actions_created_idx on public.moderation_actions(created_at desc);
alter table public.moderation_actions enable row level security;

create policy "Members create content reports" on public.content_reports for insert to authenticated
with check ((select auth.uid()) = reporter_id and (select auth.uid()) <> reported_user_id);
create policy "Members read their own reports" on public.content_reports for select to authenticated
using ((select auth.uid()) = reporter_id or private.is_admin());
create policy "Admins update content reports" on public.content_reports for update to authenticated
using (private.is_admin()) with check (private.is_admin());
create policy "Admins read moderation actions" on public.moderation_actions for select to authenticated
using (private.is_admin());
create policy "Admins create moderation actions" on public.moderation_actions for insert to authenticated
with check (private.is_admin() and (select auth.uid()) = admin_user_id);

create policy "Admins delete outfit posts" on public.outfit_posts for delete to authenticated using (private.is_admin());
create policy "Admins delete fit photo metadata" on public.fit_reference_photos for delete to authenticated using (private.is_admin());
create policy "Admins delete outfit photo files" on storage.objects for delete to authenticated using (bucket_id = 'outfit-photos' and private.is_admin());
create policy "Admins delete fit reference photo files" on storage.objects for delete to authenticated using (bucket_id = 'fit-reference-photos' and private.is_admin());

grant select, insert, update on public.content_reports to authenticated;
grant select, insert on public.moderation_actions to authenticated;

create or replace function public.is_current_user_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin();
$$;
revoke all on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.report_content(
  p_target_type public.moderation_target_type,
  p_target_id uuid,
  p_reason text,
  p_details text default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_owner_id uuid; v_report_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_target_type = 'outfit_post' then
    select user_id into v_owner_id from public.outfit_posts where id = p_target_id;
  else
    select user_id into v_owner_id from public.fit_reference_photos where id = p_target_id;
  end if;
  if v_owner_id is null then raise exception 'Content not found'; end if;
  insert into public.content_reports(reporter_id,target_type,target_id,reported_user_id,reason,details)
  values(v_user_id,p_target_type,p_target_id,v_owner_id,p_reason,nullif(trim(p_details),''))
  on conflict(reporter_id,target_type,target_id) do update set reason=excluded.reason,details=excluded.details,status='open',resolved_at=null,resolved_by=null
  returning id into v_report_id;
  return v_report_id;
end;
$$;
revoke all on function public.report_content(public.moderation_target_type,uuid,text,text) from public, anon;
grant execute on function public.report_content(public.moderation_target_type,uuid,text,text) to authenticated;

comment on table public.content_reports is 'Member reports for member-visible outfit posts and shared Fit Report photos. Reporters can see only their own reports; admins can review the queue.';
comment on table public.moderation_actions is 'Append-only owner/admin audit trail for report dismissal and content removal.';

create table public.catalog_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id) on delete cascade,
  field_kind text not null check (field_kind in ('garment_type','market_segment','attribute','description')),
  field_key text not null,
  locked_value text not null,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.catalog_moderation_actions enable row level security;
create policy "Admins read catalog moderation actions" on public.catalog_moderation_actions for select to authenticated using (private.is_admin());
grant select on public.catalog_moderation_actions to authenticated;

alter table public.products add column description text check (description is null or char_length(description) <= 1000);
alter table public.products add column description_status public.product_data_status not null default 'provisional';

create table public.product_description_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 1000),
  source_type public.product_data_source not null default 'member',
  source_status public.product_data_status not null default 'provisional',
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index product_description_evidence_member_uq on public.product_description_evidence(product_id,submitted_by) where submitted_by is not null;
alter table public.product_description_evidence enable row level security;
create policy "Members read product description evidence" on public.product_description_evidence for select to authenticated using (true);
create policy "Members add provisional product descriptions" on public.product_description_evidence for insert to authenticated with check (source_type='member' and source_status='provisional' and submitted_by=(select auth.uid()));
grant select,insert on public.product_description_evidence to authenticated;

create or replace function private.apply_product_description_evidence()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_current text; v_agree integer; v_conflict integer; v_status public.product_data_status;
begin
  select description,description_status into v_current,v_status from public.products where id=new.product_id;
  if new.source_type='admin' and new.source_status='verified' then
    update public.products set description=new.description,description_status='verified',catalog_review_needed=false where id=new.product_id; return new;
  end if;
  if v_status='verified' then
    if v_current is distinct from new.description then update public.products set catalog_review_needed=true where id=new.product_id; end if; return new;
  end if;
  select count(distinct submitted_by) into v_agree from public.product_description_evidence where product_id=new.product_id and description=new.description and source_type='member' and source_status<>'rejected';
  select count(distinct submitted_by) into v_conflict from public.product_description_evidence where product_id=new.product_id and description<>new.description and source_type='member' and source_status<>'rejected';
  if v_conflict>0 then update public.products set catalog_review_needed=true where id=new.product_id; end if;
  if v_agree>=2 and v_conflict=0 then update public.products set description=new.description,description_status='corroborated' where id=new.product_id;
  elsif v_current is null then update public.products set description=new.description,description_status='provisional' where id=new.product_id; end if;
  return new;
end;
$$;
revoke all on function private.apply_product_description_evidence() from public,anon,authenticated;
create trigger apply_product_description_evidence_after_insert after insert on public.product_description_evidence for each row execute function private.apply_product_description_evidence();

create or replace function public.record_member_product_description(p_product_id uuid,p_description text)
returns void language sql security invoker set search_path='' as $$
  insert into public.product_description_evidence(product_id,description,source_type,source_status,submitted_by)
  values(p_product_id,trim(p_description),'member','provisional',auth.uid())
  on conflict(product_id,submitted_by) where submitted_by is not null do nothing;
$$;
revoke all on function public.record_member_product_description(uuid,text) from public,anon;
grant execute on function public.record_member_product_description(uuid,text) to authenticated;

create or replace function public.admin_lock_product_field(
  p_product_id uuid,
  p_field_kind text,
  p_field_key text,
  p_locked_value text,
  p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare v_admin uuid := auth.uid();
begin
  if not private.is_admin(v_admin) then raise exception 'Admin access required'; end if;
  if nullif(trim(p_locked_value),'') is null or char_length(trim(p_reason)) not between 1 and 500 then raise exception 'A locked value and moderation reason are required'; end if;
  if p_field_kind = 'garment_type' then
    if not exists(select 1 from public.garment_types where key=p_locked_value and active) then raise exception 'Unknown garment type'; end if;
    update public.products set garment_type_key=p_locked_value,catalog_status='verified',catalog_review_needed=false where id=p_product_id;
    insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,'garment_type',p_locked_value,'admin','verified',1,p_reason,v_admin)
    on conflict(product_id,field_key,submitted_by) where submitted_by is not null do update set value_text=excluded.value_text,source_type='admin',source_status='verified',confidence=1,source_reference=excluded.source_reference,created_at=now();
  elsif p_field_kind = 'market_segment' then
    update public.products set market_segment=p_locked_value::public.garment_market_segment,catalog_status='verified',catalog_review_needed=false where id=p_product_id;
    insert into public.product_metadata_evidence(product_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,'market_segment',p_locked_value,'admin','verified',1,p_reason,v_admin)
    on conflict(product_id,field_key,submitted_by) where submitted_by is not null do update set value_text=excluded.value_text,source_type='admin',source_status='verified',confidence=1,source_reference=excluded.source_reference,created_at=now();
  elsif p_field_kind = 'attribute' then
    if not exists(select 1 from public.garment_attribute_options where attribute_key=p_field_key and option_key=p_locked_value) then raise exception 'Unknown controlled attribute value'; end if;
    insert into public.product_attribute_evidence(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_field_key,p_locked_value,'admin','verified',1,p_reason,v_admin)
    on conflict(product_id,attribute_key,submitted_by) where submitted_by is not null do update set option_key=excluded.option_key,source_type='admin',source_status='verified',confidence=1,source_reference=excluded.source_reference,created_at=now();
    update public.products set catalog_status='verified',catalog_review_needed=false where id=p_product_id;
  elsif p_field_kind = 'description' then
    insert into public.product_description_evidence(product_id,description,source_type,source_status,submitted_by)
    values(p_product_id,p_locked_value,'admin','verified',v_admin)
    on conflict(product_id,submitted_by) where submitted_by is not null do update set description=excluded.description,source_type='admin',source_status='verified',created_at=now();
    update public.product_description_evidence set source_status='rejected' where product_id=p_product_id and source_type='member' and description<>p_locked_value;
  else raise exception 'Unknown field kind'; end if;
  update public.product_metadata_evidence set source_status='rejected' where product_id=p_product_id and source_type='member' and field_key=p_field_key and value_text<>p_locked_value;
  update public.product_attribute_evidence set source_status='rejected' where product_id=p_product_id and source_type='member' and attribute_key=p_field_key and option_key<>p_locked_value;
  insert into public.catalog_moderation_actions(admin_user_id,product_id,field_kind,field_key,locked_value,reason)
  values(v_admin,p_product_id,p_field_kind,p_field_key,p_locked_value,p_reason);
end;
$$;
revoke all on function public.admin_lock_product_field(uuid,text,text,text,text) from public,anon;
grant execute on function public.admin_lock_product_field(uuid,text,text,text,text) to authenticated;

comment on table public.catalog_moderation_actions is 'Append-only owner decisions that lock disputed controlled product tags. Later member conflicts remain evidence and cannot overwrite the verified value.';
