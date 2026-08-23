-- Owner-locked catalog identity confidence model.
-- Product identity confidence is community evidence and does not require a barcode.
-- Barcodes are independent identifiers beneath a Product and earn their own evidence.
-- Five distinct confirming members may auto-promote an unambiguous candidate to a
-- corroborated canonical Product; verified remains authoritative/admin evidence only.

alter table public.catalog_candidates
  add column if not exists identity_confirmation_count integer not null default 0 check(identity_confirmation_count >= 0),
  add column if not exists identity_conflict_count integer not null default 0 check(identity_conflict_count >= 0),
  add column if not exists auto_promoted_at timestamptz;

alter table public.product_identifiers
  add column if not exists source_type public.product_data_source not null default 'system'::public.product_data_source,
  add column if not exists source_status public.product_data_status not null default 'verified'::public.product_data_status;

-- Resolution history must be able to distinguish accountable system promotion from an
-- admin decision. Existing rows are admin actions and remain so.
alter table public.catalog_resolution_actions
  alter column admin_user_id drop not null;
alter table public.catalog_resolution_actions
  add column if not exists actor_kind text not null default 'admin' check(actor_kind in ('admin','system'));
alter table public.catalog_resolution_actions
  drop constraint if exists catalog_resolution_actor_check;
alter table public.catalog_resolution_actions
  add constraint catalog_resolution_actor_check check(
    (actor_kind='admin' and admin_user_id is not null)
    or (actor_kind='system' and admin_user_id is null)
  );
alter table public.catalog_resolution_actions
  drop constraint if exists catalog_resolution_actions_action_check;
alter table public.catalog_resolution_actions
  add constraint catalog_resolution_actions_action_check check(action in (
    'map_existing','create_product','dismiss_flag','mark_needs_review','mark_needs_enrichment',
    'research_serpapi','merge','split','add_product_alias','add_brand_alias','remove_product_photo',
    'auto_map_existing','auto_create_product'
  ));

-- A member-provided barcode is evidence for a Product relationship. It is deliberately
-- private until the relationship is corroborated; ordinary Product search sees only
-- canonical product_identifiers.
create table if not exists private.product_barcode_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  fit_report_id uuid not null references public.fit_reports(id) on delete cascade,
  normalized_barcode text not null,
  original_value text not null,
  source_candidate_id uuid references public.catalog_candidates(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(product_id,user_id,normalized_barcode)
);
create index if not exists product_barcode_evidence_lookup_idx
  on private.product_barcode_evidence(normalized_barcode,product_id);
revoke all on table private.product_barcode_evidence from public,anon,authenticated;

create or replace function private.candidate_identity_conflict_count(p_candidate_id uuid)
returns integer
language sql
stable
security definer
set search_path=''
as $$
  select count(distinct coalesce(f.created_by::text,'flag:'||f.id::text))::integer
  from public.catalog_review_flags f
  where f.candidate_id=p_candidate_id
    and f.status='open'
    and f.flag_type in ('ambiguous_identity','possible_duplicate','retail_identifier_conflict');
$$;
revoke all on function private.candidate_identity_conflict_count(uuid) from public,anon,authenticated;

create or replace function private.candidate_default_size_kind(p_candidate_id uuid)
returns text
language sql
stable
security definer
set search_path=''
as $$
  with votes as (
    select ns.kind::text as kind,count(distinct gs.user_id) as people
    from public.garment_submissions gs
    join public.normalized_sizes ns on ns.id=gs.normalized_size_id
    where gs.candidate_id=p_candidate_id and ns.kind::text<>'not_sure'
    group by ns.kind
  ), ranked as (
    select kind,people,dense_rank() over(order by people desc) as rnk
    from votes
  )
  select case when count(*)=1 then min(kind) else null end
  from ranked where rnk=1;
$$;
revoke all on function private.candidate_default_size_kind(uuid) from public,anon,authenticated;

create or replace function public.lookup_corroborated_candidate_defaults(
  p_brand text,
  p_model text,
  p_garment_type_key text
)
returns table(candidate_id uuid,default_size_kind text,identity_confidence text)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_brand text:=public.normalize_search_text(coalesce(p_brand,''));
  v_model text:=public.normalize_search_text(coalesce(p_model,''));
  v_ids uuid[];
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if nullif(v_brand,'') is null or nullif(v_model,'') is null or nullif(btrim(coalesce(p_garment_type_key,'')),'') is null then return; end if;

  select array_agg(c.id order by c.id) into v_ids
  from public.catalog_candidates c
  where c.resolved_product_id is null
    and c.status<>'merged'
    and c.normalized_brand=v_brand
    and c.normalized_model=v_model
    and c.garment_type_key=p_garment_type_key
    and c.identity_confidence in ('corroborated'::public.product_data_status,'verified'::public.product_data_status);

  if coalesce(cardinality(v_ids),0)<>1 then return; end if;
  return query
  select c.id,private.candidate_default_size_kind(c.id),c.identity_confidence::text
  from public.catalog_candidates c where c.id=v_ids[1];
end;
$$;
revoke all on function public.lookup_corroborated_candidate_defaults(text,text,text) from public,anon;
grant execute on function public.lookup_corroborated_candidate_defaults(text,text,text) to authenticated;

create or replace function private.refresh_product_barcode_link(p_product_id uuid,p_barcode text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_barcode text:=public.normalize_identifier(coalesce(p_barcode,''));
  v_people integer:=0;
  v_existing_product uuid;
  v_original text;
  v_kind public.product_identifier_type;
begin
  if v_barcode is null or v_barcode !~ '^[0-9]{6,32}$' then return; end if;

  select count(distinct e.user_id),min(e.original_value)
  into v_people,v_original
  from private.product_barcode_evidence e
  where e.product_id=p_product_id and e.normalized_barcode=v_barcode;

  if v_people<2 then return; end if;

  select pi.product_id
  into v_existing_product
  from public.product_identifiers pi
  where pi.identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
    and pi.normalized_value=v_barcode
    and pi.retailer_id is null
  order by pi.created_at,pi.id
  limit 1;

  if v_existing_product is not null and v_existing_product<>p_product_id then
    update public.products set catalog_review_needed=true where id in (v_existing_product,p_product_id);
    insert into public.catalog_review_flags(flag_type,product_id,details)
    values
      ('retail_identifier_conflict',p_product_id,jsonb_build_object('reason','Barcode has corroborated member evidence for another Product','barcode',v_barcode,'other_product_id',v_existing_product)),
      ('retail_identifier_conflict',v_existing_product,jsonb_build_object('reason','Barcode has corroborated member evidence for another Product','barcode',v_barcode,'other_product_id',p_product_id))
    on conflict do nothing;
    return;
  end if;

  if v_existing_product=p_product_id then
    update public.product_identifiers
    set source_status=case when source_status='verified'::public.product_data_status then source_status else 'corroborated'::public.product_data_status end
    where product_id=p_product_id
      and identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
      and normalized_value=v_barcode
      and retailer_id is null;
    return;
  end if;

  v_kind:=case when v_barcode ~ '^([0-9]{8}|[0-9]{12,14})$' then 'upc'::public.product_identifier_type else 'barcode'::public.product_identifier_type end;
  insert into public.product_identifiers(product_id,identifier_type,original_value,normalized_value,source_type,source_status)
  values(p_product_id,v_kind,coalesce(v_original,v_barcode),v_barcode,'member'::public.product_data_source,'corroborated'::public.product_data_status)
  on conflict do nothing;
end;
$$;
revoke all on function private.refresh_product_barcode_link(uuid,text) from public,anon,authenticated;

create or replace function public.record_product_barcode_evidence(
  p_product_id uuid,
  p_fit_report_id uuid,
  p_barcode text
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_barcode text:=public.normalize_identifier(coalesce(p_barcode,''));
  v_status text:='provisional';
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_barcode is null or v_barcode !~ '^[0-9]{6,32}$' then raise exception 'Invalid barcode'; end if;
  if not exists(
    select 1 from public.fit_reports fr
    where fr.id=p_fit_report_id and fr.user_id=v_user and fr.product_id=p_product_id
  ) then raise exception 'Barcode evidence must belong to this member Product Fit Report'; end if;

  insert into private.product_barcode_evidence(product_id,user_id,fit_report_id,normalized_barcode,original_value)
  values(p_product_id,v_user,p_fit_report_id,v_barcode,btrim(p_barcode))
  on conflict(product_id,user_id,normalized_barcode)
  do update set fit_report_id=excluded.fit_report_id,original_value=excluded.original_value,created_at=now();

  perform private.refresh_product_barcode_link(p_product_id,v_barcode);
  select coalesce(pi.source_status::text,'provisional') into v_status
  from public.product_identifiers pi
  where pi.product_id=p_product_id
    and pi.identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
    and pi.normalized_value=v_barcode
    and pi.retailer_id is null
  order by pi.created_at,pi.id limit 1;
  return coalesce(v_status,'provisional');
end;
$$;
revoke all on function public.record_product_barcode_evidence(uuid,uuid,text) from public,anon;
grant execute on function public.record_product_barcode_evidence(uuid,uuid,text) to authenticated;

-- Preserve the safe one-time pending->canonical association transition while allowing
-- the actor to be either an authorized admin or the threshold-driven system.
create or replace function private.map_catalog_candidate_to_product(
  p_candidate_id uuid,
  p_product_id uuid,
  p_admin_user_id uuid,
  p_reason text,
  p_resolution_kind text,
  p_action text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_submission record;
  v_variant_id uuid;
  v_color_label text;
  v_color_normalized text;
  v_market_segment public.garment_market_segment;
  v_candidate public.catalog_candidates%rowtype;
  v_product record;
  v_barcode text;
begin
  select * into v_candidate from public.catalog_candidates where id=p_candidate_id for update;
  if v_candidate.id is null then raise exception 'Unknown candidate'; end if;
  if v_candidate.resolved_product_id is not null then raise exception 'Candidate already resolved'; end if;
  select p.id,p.brand_id,p.name,p.normalized_name,p.garment_type_key,p.market_segment,b.normalized_name as brand_normalized
  into v_product
  from public.products p join public.brands b on b.id=p.brand_id
  where p.id=p_product_id and p.catalog_status<>'rejected'::public.product_data_status;
  if v_product.id is null then raise exception 'Unknown Product'; end if;
  if v_product.garment_type_key is not null and v_product.garment_type_key<>v_candidate.garment_type_key then raise exception 'Garment type mismatch'; end if;
  v_market_segment:=v_product.market_segment;

  for v_submission in
    select * from public.garment_submissions
    where candidate_id=p_candidate_id and resolved_product_id is null
    order by created_at,id
    for update
  loop
    select label into v_color_label from public.color_families where key=v_submission.color_family_key;
    v_color_normalized:=public.normalize_search_text(coalesce(v_color_label,v_submission.color_family_key));
    select id into v_variant_id
    from public.product_variants
    where product_id=p_product_id
      and normalized_size_id=v_submission.normalized_size_id
      and coalesce(color_normalized,'')=coalesce(v_color_normalized,'')
    order by id limit 1;
    if v_variant_id is null then
      insert into public.product_variants(product_id,normalized_size_id,size_label,color_label,color_normalized,color_family_key,market_segment)
      values(p_product_id,v_submission.normalized_size_id,v_submission.size_label,v_color_label,v_color_normalized,v_submission.color_family_key,v_market_segment)
      returning id into v_variant_id;
    end if;

    update public.closet_items set product_id=p_product_id,variant_id=v_variant_id,updated_at=now()
      where id=v_submission.closet_item_id and user_id=v_submission.user_id and product_id is null;
    if not found then raise exception 'Pending Closet item is no longer unresolved'; end if;

    perform set_config('likesized.catalog_resolution','on',true);
    update public.fit_reports set product_id=p_product_id,variant_id=v_variant_id,updated_at=now()
      where id=v_submission.fit_report_id and user_id=v_submission.user_id and product_id is null;
    if not found then
      perform set_config('likesized.catalog_resolution','off',true);
      raise exception 'Pending Fit Report is no longer unresolved';
    end if;
    perform set_config('likesized.catalog_resolution','off',true);

    update public.garment_submissions set resolved_product_id=p_product_id,resolved_at=now()
      where id=v_submission.id;

    if v_submission.identifier_type in ('upc','barcode') and nullif(btrim(coalesce(v_submission.identifier_value,'')),'') is not null then
      v_barcode:=public.normalize_identifier(v_submission.identifier_value);
      insert into private.product_barcode_evidence(product_id,user_id,fit_report_id,normalized_barcode,original_value,source_candidate_id)
      values(p_product_id,v_submission.user_id,v_submission.fit_report_id,v_barcode,v_submission.identifier_value,p_candidate_id)
      on conflict(product_id,user_id,normalized_barcode)
      do update set fit_report_id=excluded.fit_report_id,original_value=excluded.original_value,source_candidate_id=excluded.source_candidate_id,created_at=now();
    end if;
  end loop;

  perform set_config('likesized.catalog_resolution','off',true);

  if v_candidate.normalized_brand is distinct from v_product.brand_normalized then
    insert into public.brand_aliases(brand_id,alias,normalized_alias)
    values(v_product.brand_id,v_candidate.brand_text,v_candidate.normalized_brand)
    on conflict do nothing;
  end if;
  if v_candidate.normalized_model is distinct from v_product.normalized_name then
    insert into public.product_aliases(product_id,alias,normalized_alias,created_by)
    values(p_product_id,v_candidate.model_text,v_candidate.normalized_model,p_admin_user_id)
    on conflict(product_id,normalized_alias) do nothing;
  end if;

  update public.catalog_candidates
  set status='merged',resolved_product_id=p_product_id,resolution_kind=p_resolution_kind,updated_at=now(),
      auto_promoted_at=case when p_admin_user_id is null then now() else auto_promoted_at end
  where id=p_candidate_id;
  update public.catalog_review_flags
  set status='resolved',resolved_by=p_admin_user_id,resolved_at=now(),resolution_note=p_reason
  where candidate_id=p_candidate_id and status='open';
  insert into public.catalog_resolution_actions(admin_user_id,candidate_id,product_id,action,reason,details,actor_kind)
  values(p_admin_user_id,p_candidate_id,p_product_id,p_action,p_reason,jsonb_build_object('resolution_kind',p_resolution_kind),case when p_admin_user_id is null then 'system' else 'admin' end);

  for v_barcode in
    select distinct e.normalized_barcode from private.product_barcode_evidence e where e.product_id=p_product_id
  loop
    perform private.refresh_product_barcode_link(p_product_id,v_barcode);
  end loop;
end;
$$;
revoke all on function private.map_catalog_candidate_to_product(uuid,uuid,uuid,text,text,text) from public,anon,authenticated;

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

  if v_confirmations<5 then return null; end if;
  if v_conflicts>=2 or v_conflicts>=v_confirmations then
    update public.catalog_candidates set status='needs_review',updated_at=now() where id=p_candidate_id and status<>'merged';
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
      format('Automatic community mapping after %s distinct confirmations and %s identity conflict(s)',v_confirmations,v_conflicts),
      'existing_product','auto_map_existing'
    );
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
  insert into public.products(brand_id,name,slug,category,normalized_name,product_family_id,garment_type_key,market_segment,department_key,catalog_status,catalog_review_needed)
  values(v_brand_id,v_candidate.model_text,v_slug,v_category,v_candidate.normalized_model,v_family_id,v_candidate.garment_type_key,v_market,v_candidate.department_key,'corroborated'::public.product_data_status,v_conflicts>0)
  returning id into v_product_id;

  perform private.map_catalog_candidate_to_product(
    p_candidate_id,v_product_id,null,
    format('Automatic community Product creation after %s distinct confirmations and %s identity conflict(s)',v_confirmations,v_conflicts),
    'new_product','auto_create_product'
  );
  return v_product_id;
end;
$$;
revoke all on function private.auto_promote_catalog_candidate(uuid) from public,anon,authenticated;

create or replace function private.refresh_catalog_candidate_identity(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.auto_promote_catalog_candidate(p_candidate_id);
end;
$$;
revoke all on function private.refresh_catalog_candidate_identity(uuid) from public,anon,authenticated;

create or replace function private.refresh_candidate_identity_after_submission()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.candidate_id is not null then perform private.refresh_catalog_candidate_identity(new.candidate_id); end if;
  return new;
end;
$$;
revoke all on function private.refresh_candidate_identity_after_submission() from public,anon,authenticated;
drop trigger if exists refresh_candidate_identity_after_submission on public.garment_submissions;
create trigger refresh_candidate_identity_after_submission
after insert or update of candidate_id on public.garment_submissions
for each row execute function private.refresh_candidate_identity_after_submission();

-- The old barcode helper no longer defines Product identity confidence. It now delegates
-- candidate confidence to all member submissions and Product barcode confidence to the
-- separate identifier-evidence relationship.
create or replace function private.refresh_barcode_identity_confidence(
  p_candidate_id uuid,
  p_product_id uuid,
  p_barcode text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_candidate_id is not null then perform private.refresh_catalog_candidate_identity(p_candidate_id); end if;
  if p_product_id is not null then perform private.refresh_product_barcode_link(p_product_id,p_barcode); end if;
end;
$$;
revoke all on function private.refresh_barcode_identity_confidence(uuid,uuid,text) from public,anon,authenticated;

-- Product barcode lookup checks canonical identifiers first, then one unique provisional
-- Product relationship, then one unique unresolved candidate. Ambiguity never auto-selects.
create or replace function public.lookup_barcode_catalog_match(p_barcode text)
returns table (
  match_kind text,
  product_id uuid,
  candidate_id uuid,
  brand_name text,
  product_name text,
  garment_type_key text,
  image_url text,
  identity_confidence text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_barcode text:=public.normalize_identifier(coalesce(p_barcode,''));
  v_product_ids uuid[];
  v_candidate_ids uuid[];
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_barcode !~ '^([0-9]{8}|[0-9]{12,14})$' then return; end if;

  select array_agg(distinct p.id order by p.id) into v_product_ids
  from public.product_identifiers pi
  join public.products p on p.id=pi.product_id
  where pi.identifier_type::text in ('upc','barcode')
    and pi.normalized_value=v_barcode
    and p.catalog_status<>'rejected'::public.product_data_status;

  if coalesce(cardinality(v_product_ids),0)=0 then
    select array_agg(distinct p.id order by p.id) into v_product_ids
    from private.product_barcode_evidence e
    join public.products p on p.id=e.product_id
    where e.normalized_barcode=v_barcode
      and p.catalog_status<>'rejected'::public.product_data_status;
  end if;

  if coalesce(cardinality(v_product_ids),0)=1 then
    return query
    select 'product'::text,p.id,null::uuid,b.name,p.name,p.garment_type_key,p.image_url,p.catalog_status::text
    from public.products p join public.brands b on b.id=p.brand_id where p.id=v_product_ids[1];
    return;
  elsif coalesce(cardinality(v_product_ids),0)>1 then
    return;
  end if;

  select array_agg(distinct c.id order by c.id) into v_candidate_ids
  from public.garment_submissions gs
  join public.catalog_candidates c on c.id=gs.candidate_id
  where c.resolved_product_id is null and c.status<>'merged'
    and gs.identifier_type in ('upc','barcode')
    and public.normalize_identifier(coalesce(gs.identifier_value,''))=v_barcode;

  if coalesce(cardinality(v_candidate_ids),0)=1 then
    return query
    select 'candidate'::text,null::uuid,c.id,c.brand_text,c.model_text,c.garment_type_key,null::text,c.identity_confidence::text
    from public.catalog_candidates c where c.id=v_candidate_ids[1] and c.resolved_product_id is null;
  end if;
end;
$$;
revoke all on function public.lookup_barcode_catalog_match(text) from public,anon;
grant execute on function public.lookup_barcode_catalog_match(text) to authenticated;

create or replace function public.confirm_barcode_catalog_match(
  p_barcode text,
  p_product_id uuid default null,
  p_candidate_id uuid default null
)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_barcode text:=public.normalize_identifier(coalesce(p_barcode,''));
  v_status text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if v_barcode !~ '^([0-9]{8}|[0-9]{12,14})$' then raise exception 'Invalid barcode'; end if;
  if (p_product_id is null)=(p_candidate_id is null) then raise exception 'Exactly one barcode match target is required'; end if;

  if p_candidate_id is not null then
    if not exists(
      select 1 from public.catalog_candidates c
      join public.garment_submissions gs on gs.candidate_id=c.id
      where c.id=p_candidate_id and c.resolved_product_id is null and c.status<>'merged'
        and gs.identifier_type in ('upc','barcode')
        and public.normalize_identifier(coalesce(gs.identifier_value,''))=v_barcode
    ) then raise exception 'Barcode candidate no longer matches'; end if;

    insert into private.barcode_identity_confirmations(user_id,normalized_barcode,candidate_id)
    values(v_user_id,v_barcode,p_candidate_id)
    on conflict(user_id,normalized_barcode,candidate_id) where candidate_id is not null do nothing;
    perform private.refresh_catalog_candidate_identity(p_candidate_id);
    select c.identity_confidence::text into v_status from public.catalog_candidates c where c.id=p_candidate_id;
    return v_status;
  end if;

  if not exists(
    select 1 from public.products p
    where p.id=p_product_id and p.catalog_status<>'rejected'::public.product_data_status
      and (
        exists(select 1 from public.product_identifiers pi where pi.product_id=p.id and pi.identifier_type::text in ('upc','barcode') and pi.normalized_value=v_barcode)
        or exists(select 1 from private.product_barcode_evidence e where e.product_id=p.id and e.normalized_barcode=v_barcode)
      )
  ) then raise exception 'Barcode Product no longer matches'; end if;

  insert into private.barcode_identity_confirmations(user_id,normalized_barcode,product_id)
  values(v_user_id,v_barcode,p_product_id)
  on conflict(user_id,normalized_barcode,product_id) where product_id is not null do nothing;
  perform private.refresh_product_barcode_link(p_product_id,v_barcode);
  select p.catalog_status::text into v_status from public.products p where p.id=p_product_id;
  return v_status;
end;
$$;
revoke all on function public.confirm_barcode_catalog_match(text,uuid,uuid) from public,anon;
grant execute on function public.confirm_barcode_catalog_match(text,uuid,uuid) to authenticated;

-- A different legitimate barcode for the same Product is not itself an identity conflict.
-- Barcode disagreement only raises review when that barcode is already tied to another Product.
create or replace function private.flag_product_identity_issue()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_current text;
  v_other_product uuid;
begin
  if new.source_status='rejected'::public.product_data_status then return new; end if;
  if new.field_key='barcode' then
    select pi.product_id into v_other_product
    from public.product_identifiers pi
    where pi.normalized_value=public.normalize_identifier(new.value_text)
      and pi.identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
      and pi.product_id<>new.product_id
    limit 1;
    if v_other_product is not null then
      update public.products set catalog_review_needed=true where id in (new.product_id,v_other_product);
    end if;
    return new;
  end if;

  if new.field_key='brand_name' then
    select b.name into v_current from public.products p join public.brands b on b.id=p.brand_id where p.id=new.product_id;
  elsif new.field_key='item_name' then
    select p.name into v_current from public.products p where p.id=new.product_id;
  elsif new.field_key='manufacturer_style' then
    select p.manufacturer_style_number into v_current from public.products p where p.id=new.product_id;
  end if;
  if public.normalize_search_text(coalesce(v_current,'')) is distinct from public.normalize_search_text(new.value_text) then
    update public.products set catalog_review_needed=true where id=new.product_id;
  end if;
  return new;
end;
$$;
revoke all on function private.flag_product_identity_issue() from public,anon,authenticated;

-- Initialize generalized confirmation counts/confidence for existing unresolved candidates,
-- but do not bulk auto-create Products merely because a migration was applied. Future
-- member evidence or an explicit admin action will evaluate the five-member promotion rule.
update public.catalog_candidates c
set identity_confirmation_count=s.people,
    identity_conflict_count=private.candidate_identity_conflict_count(c.id),
    identity_confidence=case
      when c.identity_confidence in ('verified'::public.product_data_status,'rejected'::public.product_data_status) then c.identity_confidence
      when s.people>=2 then 'corroborated'::public.product_data_status
      else 'provisional'::public.product_data_status
    end,
    updated_at=now()
from (
  select c2.id,count(distinct gs.user_id)::integer as people
  from public.catalog_candidates c2
  left join public.garment_submissions gs on gs.candidate_id=c2.id
  where c2.resolved_product_id is null
  group by c2.id
) s
where c.id=s.id and c.resolved_product_id is null;

comment on column public.catalog_candidates.identity_confirmation_count is
  'Distinct member submissions supporting this normalized Product identity. Barcode is not required.';
comment on column public.catalog_candidates.identity_conflict_count is
  'Independent open identity-review evidence used to gate automatic Product promotion.';
comment on table private.product_barcode_evidence is
  'Private per-member Product-to-barcode evidence. Two distinct member Fit Reports may corroborate one barcode relationship; one Product may have multiple barcodes.';
comment on function public.lookup_corroborated_candidate_defaults(text,text,text) is
  'Narrow New Fit Report helper: exact unresolved corroborated candidate identity and its unique member-derived broad size-system default. Not ordinary Product search.';
