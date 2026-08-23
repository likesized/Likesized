alter table public.catalog_candidates
  add column if not exists identity_confidence public.product_data_status not null default 'provisional'::public.product_data_status;

create table if not exists private.barcode_identity_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_barcode text not null,
  candidate_id uuid references public.catalog_candidates(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint barcode_identity_confirmation_target_check
    check ((candidate_id is not null and product_id is null) or (candidate_id is null and product_id is not null))
);

create unique index if not exists barcode_identity_confirmations_candidate_user_uq
  on private.barcode_identity_confirmations(user_id, normalized_barcode, candidate_id)
  where candidate_id is not null;

create unique index if not exists barcode_identity_confirmations_product_user_uq
  on private.barcode_identity_confirmations(user_id, normalized_barcode, product_id)
  where product_id is not null;

create index if not exists barcode_identity_confirmations_candidate_lookup_idx
  on private.barcode_identity_confirmations(candidate_id, normalized_barcode);

create index if not exists barcode_identity_confirmations_product_lookup_idx
  on private.barcode_identity_confirmations(product_id, normalized_barcode);

revoke all on table private.barcode_identity_confirmations from public, anon, authenticated;

create or replace function private.refresh_barcode_identity_confidence(
  p_candidate_id uuid,
  p_product_id uuid,
  p_barcode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barcode text := public.normalize_identifier(coalesce(p_barcode, ''));
  v_submitter_count integer := 0;
  v_confirmed_submitter_count integer := 0;
  v_confirmed_wearer_count integer := 0;
begin
  if v_barcode = '' then return; end if;

  if p_candidate_id is not null then
    select
      count(distinct gs.user_id),
      count(distinct gs.user_id) filter (
        where exists (
          select 1
          from private.barcode_identity_confirmations bic
          where bic.candidate_id = p_candidate_id
            and bic.user_id = gs.user_id
            and bic.normalized_barcode = v_barcode
        )
      )
    into v_submitter_count, v_confirmed_submitter_count
    from public.garment_submissions gs
    where gs.candidate_id = p_candidate_id
      and gs.identifier_type in ('upc', 'barcode')
      and public.normalize_identifier(coalesce(gs.identifier_value, '')) = v_barcode;

    if v_submitter_count >= 2 and v_confirmed_submitter_count >= 1 then
      update public.catalog_candidates
      set identity_confidence = 'corroborated'::public.product_data_status,
          updated_at = now()
      where id = p_candidate_id
        and resolved_product_id is null
        and identity_confidence = 'provisional'::public.product_data_status;
    end if;
  end if;

  if p_product_id is not null then
    select count(distinct bic.user_id)
    into v_confirmed_wearer_count
    from private.barcode_identity_confirmations bic
    where bic.product_id = p_product_id
      and bic.normalized_barcode = v_barcode
      and exists (
        select 1
        from public.fit_reports fr
        where fr.user_id = bic.user_id
          and fr.product_id = p_product_id
      );

    if v_confirmed_wearer_count >= 2 then
      update public.products
      set catalog_status = 'corroborated'::public.product_data_status
      where id = p_product_id
        and catalog_status = 'provisional'::public.product_data_status;
    end if;
  end if;
end;
$$;

revoke all on function private.refresh_barcode_identity_confidence(uuid, uuid, text) from public, anon, authenticated;

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
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_barcode text := public.normalize_identifier(coalesce(p_barcode, ''));
  v_product_ids uuid[];
  v_candidate_ids uuid[];
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if v_barcode !~ '^([0-9]{8}|[0-9]{12,14})$' then return; end if;

  select array_agg(distinct p.id order by p.id)
  into v_product_ids
  from public.product_identifiers pi
  join public.products p on p.id = pi.product_id
  where pi.identifier_type::text in ('upc', 'barcode')
    and pi.normalized_value = v_barcode
    and p.catalog_status <> 'rejected'::public.product_data_status;

  if coalesce(cardinality(v_product_ids), 0) = 1 then
    return query
    select
      'product'::text,
      p.id,
      null::uuid,
      b.name,
      p.name,
      p.garment_type_key,
      p.image_url,
      p.catalog_status::text
    from public.products p
    join public.brands b on b.id = p.brand_id
    where p.id = v_product_ids[1];
    return;
  elsif coalesce(cardinality(v_product_ids), 0) > 1 then
    return;
  end if;

  select array_agg(distinct c.id order by c.id)
  into v_candidate_ids
  from public.garment_submissions gs
  join public.catalog_candidates c on c.id = gs.candidate_id
  where c.resolved_product_id is null
    and c.status <> 'merged'
    and gs.identifier_type in ('upc', 'barcode')
    and public.normalize_identifier(coalesce(gs.identifier_value, '')) = v_barcode;

  if coalesce(cardinality(v_candidate_ids), 0) = 1 then
    return query
    select
      'candidate'::text,
      null::uuid,
      c.id,
      c.brand_text,
      c.model_text,
      c.garment_type_key,
      null::text,
      c.identity_confidence::text
    from public.catalog_candidates c
    where c.id = v_candidate_ids[1]
      and c.resolved_product_id is null;
  end if;
end;
$$;

revoke all on function public.lookup_barcode_catalog_match(text) from public, anon;
grant execute on function public.lookup_barcode_catalog_match(text) to authenticated;

create or replace function public.confirm_barcode_catalog_match(
  p_barcode text,
  p_product_id uuid default null,
  p_candidate_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_barcode text := public.normalize_identifier(coalesce(p_barcode, ''));
  v_status text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if v_barcode !~ '^([0-9]{8}|[0-9]{12,14})$' then raise exception 'Invalid barcode'; end if;
  if (p_product_id is null) = (p_candidate_id is null) then raise exception 'Exactly one barcode match target is required'; end if;

  if p_candidate_id is not null then
    if not exists (
      select 1
      from public.catalog_candidates c
      join public.garment_submissions gs on gs.candidate_id = c.id
      where c.id = p_candidate_id
        and c.resolved_product_id is null
        and c.status <> 'merged'
        and gs.identifier_type in ('upc', 'barcode')
        and public.normalize_identifier(coalesce(gs.identifier_value, '')) = v_barcode
    ) then raise exception 'Barcode candidate no longer matches'; end if;

    insert into private.barcode_identity_confirmations(user_id, normalized_barcode, candidate_id)
    values(v_user_id, v_barcode, p_candidate_id)
    on conflict (user_id, normalized_barcode, candidate_id) where candidate_id is not null do nothing;

    perform private.refresh_barcode_identity_confidence(p_candidate_id, null, v_barcode);
    select c.identity_confidence::text into v_status from public.catalog_candidates c where c.id = p_candidate_id;
    return v_status;
  end if;

  if not exists (
    select 1
    from public.products p
    join public.product_identifiers pi on pi.product_id = p.id
    where p.id = p_product_id
      and p.catalog_status <> 'rejected'::public.product_data_status
      and pi.identifier_type::text in ('upc', 'barcode')
      and pi.normalized_value = v_barcode
  ) then raise exception 'Barcode Product no longer matches'; end if;

  insert into private.barcode_identity_confirmations(user_id, normalized_barcode, product_id)
  values(v_user_id, v_barcode, p_product_id)
  on conflict (user_id, normalized_barcode, product_id) where product_id is not null do nothing;

  perform private.refresh_barcode_identity_confidence(null, p_product_id, v_barcode);
  select p.catalog_status::text into v_status from public.products p where p.id = p_product_id;
  return v_status;
end;
$$;

revoke all on function public.confirm_barcode_catalog_match(text, uuid, uuid) from public, anon;
grant execute on function public.confirm_barcode_catalog_match(text, uuid, uuid) to authenticated;

create or replace function private.refresh_barcode_candidate_after_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.candidate_id is not null
     and new.identifier_type in ('upc', 'barcode')
     and nullif(btrim(coalesce(new.identifier_value, '')), '') is not null then
    perform private.refresh_barcode_identity_confidence(new.candidate_id, null, new.identifier_value);
  end if;
  return new;
end;
$$;

revoke all on function private.refresh_barcode_candidate_after_submission() from public, anon, authenticated;

drop trigger if exists refresh_barcode_candidate_after_submission on public.garment_submissions;
create trigger refresh_barcode_candidate_after_submission
after insert or update of candidate_id, identifier_type, identifier_value
on public.garment_submissions
for each row execute function private.refresh_barcode_candidate_after_submission();

create or replace function private.refresh_barcode_product_after_fit_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barcode text;
begin
  if new.product_id is null then return new; end if;
  for v_barcode in
    select distinct bic.normalized_barcode
    from private.barcode_identity_confirmations bic
    where bic.product_id = new.product_id
  loop
    perform private.refresh_barcode_identity_confidence(null, new.product_id, v_barcode);
  end loop;
  return new;
end;
$$;

revoke all on function private.refresh_barcode_product_after_fit_report() from public, anon, authenticated;

drop trigger if exists refresh_barcode_product_after_fit_report on public.fit_reports;
create trigger refresh_barcode_product_after_fit_report
after insert or update of product_id
on public.fit_reports
for each row execute function private.refresh_barcode_product_after_fit_report();

create or replace function private.transfer_barcode_confirmations_after_candidate_resolution()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barcode text;
begin
  if new.resolved_product_id is null or old.resolved_product_id is not null then return new; end if;

  insert into private.barcode_identity_confirmations(user_id, normalized_barcode, product_id)
  select bic.user_id, bic.normalized_barcode, new.resolved_product_id
  from private.barcode_identity_confirmations bic
  where bic.candidate_id = new.id
  on conflict (user_id, normalized_barcode, product_id) where product_id is not null do nothing;

  if new.identity_confidence = 'corroborated'::public.product_data_status then
    update public.products
    set catalog_status = 'corroborated'::public.product_data_status
    where id = new.resolved_product_id
      and catalog_status = 'provisional'::public.product_data_status;
  end if;

  for v_barcode in
    select distinct bic.normalized_barcode
    from private.barcode_identity_confirmations bic
    where bic.product_id = new.resolved_product_id
  loop
    perform private.refresh_barcode_identity_confidence(null, new.resolved_product_id, v_barcode);
  end loop;

  return new;
end;
$$;

revoke all on function private.transfer_barcode_confirmations_after_candidate_resolution() from public, anon, authenticated;

drop trigger if exists transfer_barcode_confirmations_after_candidate_resolution on public.catalog_candidates;
create trigger transfer_barcode_confirmations_after_candidate_resolution
after update of resolved_product_id
on public.catalog_candidates
for each row execute function private.transfer_barcode_confirmations_after_candidate_resolution();

comment on column public.catalog_candidates.identity_confidence is
  'Evidence strength for unresolved Product identity. Workflow status remains catalog_candidates.status; two distinct members on the same barcode plus an explicit barcode-match confirmation may raise identity confidence to corroborated.';

comment on table private.barcode_identity_confirmations is
  'Private per-member confirmations from the New Fit Report "Is this the item?" barcode step. A confirmation strengthens identity only when paired with the member''s actual Fit Report/submission.';
