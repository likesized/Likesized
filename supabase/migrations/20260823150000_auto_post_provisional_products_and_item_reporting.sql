-- Owner-approved catalog flow: an unambiguous first member submission becomes a
-- searchable/usable Provisional Product automatically. Routine new-item entry does
-- not create an admin chore. Review is exception-driven by conflicts, duplicate
-- signals, identifier/listing collisions, or an explicit member report.

alter table public.products
  add column if not exists identity_confirmation_count integer not null default 0
    check(identity_confirmation_count >= 0);

alter table public.catalog_review_flags
  add column if not exists priority text not null default 'medium'
    check(priority in ('low','medium','high')),
  add column if not exists priority_score smallint not null default 2
    check(priority_score between 1 and 3);

alter table public.catalog_review_flags
  drop constraint if exists catalog_review_flags_flag_type_check;
alter table public.catalog_review_flags
  add constraint catalog_review_flags_flag_type_check check(flag_type in (
    'possible_duplicate','conflicting_product_fact','ambiguous_identity','reported_spam',
    'retail_identifier_conflict','member_report'
  ));

create unique index if not exists catalog_review_member_report_open_uq
  on public.catalog_review_flags(product_id,created_by)
  where flag_type='member_report' and status='open' and product_id is not null and created_by is not null;

create index if not exists catalog_review_flags_priority_idx
  on public.catalog_review_flags(status,priority_score desc,created_at);

create or replace function private.recalculate_product_review_priority(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status public.product_data_status;
  v_member_reporters integer:=0;
  v_conflict_signals integer:=0;
  v_score smallint:=2;
  v_priority text:='medium';
begin
  if p_product_id is null then return; end if;
  select catalog_status into v_status from public.products where id=p_product_id;
  if v_status is null then return; end if;

  select count(distinct created_by)::integer into v_member_reporters
  from public.catalog_review_flags
  where product_id=p_product_id and status='open' and flag_type='member_report' and created_by is not null;

  select count(*)::integer into v_conflict_signals
  from public.catalog_review_flags
  where product_id=p_product_id and status='open'
    and flag_type in ('possible_duplicate','conflicting_product_fact','ambiguous_identity','retail_identifier_conflict');

  if v_status='provisional'::public.product_data_status then
    v_score:=3;
  elsif v_status='corroborated'::public.product_data_status then
    v_score:=case when v_member_reporters>=2 or v_conflict_signals>=2 then 3 else 2 end;
  elsif v_status='verified'::public.product_data_status then
    v_score:=case
      when v_member_reporters>=3 or v_conflict_signals>=3 then 3
      when v_member_reporters>=2 or v_conflict_signals>=2 then 2
      else 1
    end;
  else
    v_score:=2;
  end if;

  v_priority:=case v_score when 3 then 'high' when 2 then 'medium' else 'low' end;
  update public.catalog_review_flags
  set priority=v_priority,priority_score=v_score
  where product_id=p_product_id and status='open'
    and (priority is distinct from v_priority or priority_score is distinct from v_score);
end;
$$;
revoke all on function private.recalculate_product_review_priority(uuid) from public,anon,authenticated;

create or replace function private.recalculate_candidate_review_priority(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status public.product_data_status;
  v_reporters integer:=0;
  v_conflicts integer:=0;
  v_score smallint:=2;
  v_priority text:='medium';
begin
  if p_candidate_id is null then return; end if;
  select identity_confidence,identity_conflict_count into v_status,v_conflicts
  from public.catalog_candidates where id=p_candidate_id;
  if v_status is null then return; end if;

  select count(distinct created_by)::integer into v_reporters
  from public.catalog_review_flags
  where candidate_id=p_candidate_id and status='open' and created_by is not null;

  if v_status='provisional'::public.product_data_status then
    v_score:=3;
  elsif v_status='corroborated'::public.product_data_status then
    v_score:=case when greatest(v_reporters,v_conflicts)>=2 then 3 else 2 end;
  elsif v_status='verified'::public.product_data_status then
    v_score:=case
      when greatest(v_reporters,v_conflicts)>=3 then 3
      when greatest(v_reporters,v_conflicts)>=2 then 2
      else 1
    end;
  else
    v_score:=2;
  end if;

  v_priority:=case v_score when 3 then 'high' when 2 then 'medium' else 'low' end;
  update public.catalog_review_flags
  set priority=v_priority,priority_score=v_score
  where candidate_id=p_candidate_id and status='open'
    and (priority is distinct from v_priority or priority_score is distinct from v_score);
end;
$$;
revoke all on function private.recalculate_candidate_review_priority(uuid) from public,anon,authenticated;

create or replace function private.refresh_catalog_review_priority_after_flag()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op<>'INSERT' then
    perform private.recalculate_product_review_priority(old.product_id);
    perform private.recalculate_candidate_review_priority(old.candidate_id);
  end if;
  if tg_op<>'DELETE' then
    perform private.recalculate_product_review_priority(new.product_id);
    perform private.recalculate_candidate_review_priority(new.candidate_id);
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function private.refresh_catalog_review_priority_after_flag() from public,anon,authenticated;

drop trigger if exists catalog_review_priority_after_flag_change on public.catalog_review_flags;
create trigger catalog_review_priority_after_flag_change
after insert or delete or update of status,product_id,candidate_id,created_by,flag_type
on public.catalog_review_flags
for each row execute function private.refresh_catalog_review_priority_after_flag();

create or replace function private.refresh_product_review_priority_after_status()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.recalculate_product_review_priority(new.id);
  return new;
end;
$$;
revoke all on function private.refresh_product_review_priority_after_status() from public,anon,authenticated;

drop trigger if exists product_review_priority_after_status on public.products;
create trigger product_review_priority_after_status
after update of catalog_status on public.products
for each row when (old.catalog_status is distinct from new.catalog_status)
execute function private.refresh_product_review_priority_after_status();

create or replace function private.refresh_candidate_review_priority_after_status()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.recalculate_candidate_review_priority(new.id);
  return new;
end;
$$;
revoke all on function private.refresh_candidate_review_priority_after_status() from public,anon,authenticated;

drop trigger if exists candidate_review_priority_after_status on public.catalog_candidates;
create trigger candidate_review_priority_after_status
after update of identity_confidence,identity_conflict_count on public.catalog_candidates
for each row execute function private.refresh_candidate_review_priority_after_status();

create or replace function private.refresh_product_identity_confidence(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_people integer:=0;
begin
  if p_product_id is null then return; end if;
  select count(distinct user_id)::integer into v_people
  from public.fit_reports where product_id=p_product_id;

  update public.products
  set identity_confirmation_count=v_people,
      catalog_status=case
        when catalog_status in ('verified'::public.product_data_status,'rejected'::public.product_data_status) then catalog_status
        when catalog_status='provisional'::public.product_data_status and v_people>=2 then 'corroborated'::public.product_data_status
        else catalog_status
      end
  where id=p_product_id;

  perform private.recalculate_product_review_priority(p_product_id);
end;
$$;
revoke all on function private.refresh_product_identity_confidence(uuid) from public,anon,authenticated;

create or replace function private.refresh_product_identity_after_fit_report()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op<>'INSERT' then perform private.refresh_product_identity_confidence(old.product_id); end if;
  if tg_op<>'DELETE' then perform private.refresh_product_identity_confidence(new.product_id); end if;
  return coalesce(new,old);
end;
$$;
revoke all on function private.refresh_product_identity_after_fit_report() from public,anon,authenticated;

drop trigger if exists fit_reports_refresh_product_identity_confidence on public.fit_reports;
create trigger fit_reports_refresh_product_identity_confidence
after insert or delete or update of product_id on public.fit_reports
for each row execute function private.refresh_product_identity_after_fit_report();

create or replace function private.flag_possible_product_neighbors(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_product record;
  v_related uuid[];
begin
  select id,brand_id,garment_type_key,normalized_name into v_product
  from public.products where id=p_product_id and catalog_status<>'rejected'::public.product_data_status;
  if v_product.id is null or char_length(v_product.normalized_name)<6 then return; end if;

  select array_agg(p.id order by p.id) into v_related
  from public.products p
  where p.id<>p_product_id
    and p.catalog_status<>'rejected'::public.product_data_status
    and p.brand_id=v_product.brand_id
    and p.garment_type_key is not distinct from v_product.garment_type_key
    and p.normalized_name<>v_product.normalized_name
    and char_length(p.normalized_name)>=6
    and abs(char_length(p.normalized_name)-char_length(v_product.normalized_name))<=12
    and (p.normalized_name like v_product.normalized_name||'%' or v_product.normalized_name like p.normalized_name||'%');

  if coalesce(cardinality(v_related),0)>0 then
    update public.products set catalog_review_needed=true where id=p_product_id;
    insert into public.catalog_review_flags(flag_type,product_id,details)
    values('possible_duplicate',p_product_id,jsonb_build_object(
      'reason','A same-brand same-type Product has a closely related normalized name',
      'related_product_ids',to_jsonb(v_related),
      'detector','prefix_name_similarity'
    )) on conflict do nothing;
  end if;
end;
$$;
revoke all on function private.flag_possible_product_neighbors(uuid) from public,anon,authenticated;

create or replace function public.report_product_item(
  p_product_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_report_id uuid;
  v_reason text:=btrim(coalesce(p_reason,''));
  v_details text:=nullif(btrim(coalesce(p_details,'')),'');
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_reason not in ('inappropriate_content','image_mismatch','incorrect_information','other') then
    raise exception 'Invalid report reason' using errcode='22023';
  end if;
  if v_details is not null and char_length(v_details)>500 then raise exception 'Report details are too long' using errcode='22023'; end if;
  if not exists(select 1 from public.products where id=p_product_id and catalog_status<>'rejected'::public.product_data_status) then
    raise exception 'Product not found';
  end if;

  insert into public.catalog_review_flags(flag_type,product_id,details,created_by)
  values('member_report',p_product_id,jsonb_build_object('report_reason',v_reason,'details',v_details),v_user)
  on conflict (product_id,created_by) where flag_type='member_report' and status='open' and product_id is not null and created_by is not null
  do update set details=excluded.details,created_at=now()
  returning id into v_report_id;

  update public.products set catalog_review_needed=true where id=p_product_id;
  perform private.recalculate_product_review_priority(p_product_id);
  return v_report_id;
end;
$$;
revoke all on function public.report_product_item(uuid,text,text) from public,anon;
grant execute on function public.report_product_item(uuid,text,text) to authenticated;

-- Supersede the former five-member canonicalization gate. Candidates remain useful as
-- a short staging/audit object, but a clean unique first member submission now becomes
-- the lowest-trust Provisional Product immediately. Any blocking flag keeps the
-- candidate unresolved for review instead of creating questionable Product truth.
create or replace function private.auto_promote_catalog_candidate(p_candidate_id uuid)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_candidate public.catalog_candidates%rowtype;
  v_confirmations integer:=0;
  v_conflicts integer:=0;
  v_product_ids uuid[];
  v_product_id uuid;
  v_brand_id uuid;
  v_brand_slug text;
  v_family_id uuid;
  v_category public.garment_category;
  v_market public.garment_market_segment:='unknown'::public.garment_market_segment;
  v_slug text;
  v_product_status public.product_data_status;
begin
  select * into v_candidate from public.catalog_candidates where id=p_candidate_id for update;
  if v_candidate.id is null or v_candidate.resolved_product_id is not null then return v_candidate.resolved_product_id; end if;

  select count(distinct gs.user_id) into v_confirmations from public.garment_submissions gs where gs.candidate_id=p_candidate_id;
  v_conflicts:=private.candidate_identity_conflict_count(p_candidate_id);

  update public.catalog_candidates
  set identity_confirmation_count=v_confirmations,
      identity_conflict_count=v_conflicts,
      identity_confidence=case
        when identity_confidence in ('verified'::public.product_data_status,'rejected'::public.product_data_status) then identity_confidence
        when v_confirmations>=2 then 'corroborated'::public.product_data_status
        else 'provisional'::public.product_data_status
      end,
      updated_at=now()
  where id=p_candidate_id;

  if v_confirmations<1 then return null; end if;
  if v_conflicts>0 then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=p_candidate_id and status<>'merged';
    perform private.recalculate_candidate_review_priority(p_candidate_id);
    return null;
  end if;

  select array_agg(p.id order by p.id) into v_product_ids
  from public.products p
  join public.brands b on b.id=p.brand_id
  where p.catalog_status<>'rejected'::public.product_data_status
    and b.normalized_name=v_candidate.normalized_brand
    and p.normalized_name=v_candidate.normalized_model
    and p.garment_type_key=v_candidate.garment_type_key;

  if coalesce(cardinality(v_product_ids),0)=1 then
    v_product_id:=v_product_ids[1];
    perform private.map_catalog_candidate_to_product(
      p_candidate_id,v_product_id,null,
      format('Automatic exact Product mapping after %s distinct member confirmation(s)',v_confirmations),
      'existing_product','auto_map_existing'
    );
    perform private.refresh_product_identity_confidence(v_product_id);
    return v_product_id;
  elsif coalesce(cardinality(v_product_ids),0)>1 then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=p_candidate_id;
    insert into public.catalog_review_flags(flag_type,candidate_id,details)
    values('ambiguous_identity',p_candidate_id,jsonb_build_object('reason','Multiple canonical Products share the candidate normalized identity','product_ids',to_jsonb(v_product_ids)))
    on conflict do nothing;
    return null;
  end if;

  select id,slug into v_brand_id,v_brand_slug from public.brands where normalized_name=v_candidate.normalized_brand limit 1;
  if v_brand_id is null then
    v_brand_slug:=left(trim(both '-' from regexp_replace(lower(v_candidate.brand_text),'[^a-z0-9]+','-','g')),70);
    if nullif(v_brand_slug,'') is null then v_brand_slug:='brand-'||substr(v_candidate.id::text,1,8); end if;
    if exists(select 1 from public.brands where slug=v_brand_slug) then v_brand_slug:=left(v_brand_slug,58)||'-'||substr(v_candidate.id::text,1,8); end if;
    insert into public.brands(name,slug,normalized_name)
    values(v_candidate.brand_text,v_brand_slug,v_candidate.normalized_brand)
    returning id into v_brand_id;
  end if;

  select category into v_category from public.garment_types where key=v_candidate.garment_type_key;
  if v_candidate.department_key='womens' then v_market:='womens'::public.garment_market_segment;
  elsif v_candidate.department_key='mens' then v_market:='mens'::public.garment_market_segment;
  elsif v_candidate.department_key='unisex' then v_market:='unisex'::public.garment_market_segment;
  elsif v_candidate.department_key in ('girls','boys','kids_unisex','baby_toddler') then v_market:='kids_youth'::public.garment_market_segment;
  end if;

  select id into v_family_id from public.product_families
  where brand_id=v_brand_id and normalized_name=v_candidate.normalized_model and garment_type_key=v_candidate.garment_type_key and market_segment=v_market
  order by id limit 1;
  if v_family_id is null then
    insert into public.product_families(brand_id,name,normalized_name,garment_type_key,market_segment)
    values(v_brand_id,v_candidate.model_text,v_candidate.normalized_model,v_candidate.garment_type_key,v_market)
    returning id into v_family_id;
  end if;

  v_slug:=left(trim(both '-' from regexp_replace(lower(v_brand_slug||'-'||v_candidate.model_text||'-'||v_market::text),'[^a-z0-9]+','-','g')),140);
  if exists(select 1 from public.products where slug=v_slug) then v_slug:=left(v_slug,127)||'-'||substr(v_candidate.id::text,1,8); end if;
  v_product_status:=case when v_confirmations>=2 then 'corroborated'::public.product_data_status else 'provisional'::public.product_data_status end;

  insert into public.products(
    brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment,department_key,
    catalog_status,catalog_review_needed,identity_confirmation_count
  ) values(
    v_brand_id,v_candidate.model_text,v_slug,v_category,v_candidate.normalized_model,v_family_id,v_candidate.garment_type_key,v_market,v_candidate.department_key,
    v_product_status,false,v_confirmations
  ) returning id into v_product_id;

  perform private.map_catalog_candidate_to_product(
    p_candidate_id,v_product_id,null,
    format('Automatic community Product post after %s distinct member confirmation(s) with no blocking flags',v_confirmations),
    'new_product','auto_create_product'
  );
  perform private.refresh_product_identity_confidence(v_product_id);
  perform private.flag_possible_product_neighbors(v_product_id);
  return v_product_id;
end;
$$;
revoke all on function private.auto_promote_catalog_candidate(uuid) from public,anon,authenticated;

-- Backfill Product confirmation counts without demoting previously established trust.
do $$
declare v_product_id uuid; begin
  for v_product_id in select id from public.products loop
    perform private.refresh_product_identity_confidence(v_product_id);
  end loop;
end $$;

-- Existing real member-submitted candidates should no longer sit in a routine review
-- queue merely because they were the first/only item. Clean ones resolve immediately;
-- flagged candidates remain unresolved.
do $$
declare v_candidate_id uuid; begin
  for v_candidate_id in
    select c.id from public.catalog_candidates c
    where c.resolved_product_id is null
      and exists(select 1 from public.garment_submissions gs where gs.candidate_id=c.id)
    order by c.created_at,c.id
  loop
    perform private.auto_promote_catalog_candidate(v_candidate_id);
  end loop;
end $$;

-- Re-score any flags that predate this migration.
do $$
declare v_id uuid; begin
  for v_id in select distinct product_id from public.catalog_review_flags where product_id is not null and status='open' loop
    perform private.recalculate_product_review_priority(v_id);
  end loop;
  for v_id in select distinct candidate_id from public.catalog_review_flags where candidate_id is not null and status='open' loop
    perform private.recalculate_candidate_review_priority(v_id);
  end loop;
end $$;

comment on column public.products.identity_confirmation_count is
  'Distinct members with Fit Reports currently attached to the Product; first clean submission may auto-post Provisional, 2+ may promote Provisional to Corroborated, Verified remains admin/authoritative.';
comment on function public.report_product_item(uuid,text,text) is
  'One member-facing Product report boundary for inappropriate content, image mismatch, incorrect information, or other concerns. Creates/refreshes an exception-driven catalog review flag whose priority derives from Product trust and independent report/conflict volume.';
comment on column public.catalog_review_flags.priority is
  'Current review urgency. Provisional/uncorroborated targets rate high; Corroborated normally medium; Verified normally low, with multiple independent signals escalating priority.';
