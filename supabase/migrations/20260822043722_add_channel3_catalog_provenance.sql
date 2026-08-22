-- Canonical Channel3 catalog import. This replaces generic web search for the
-- intake path and preserves the full selected source record with one Product.

alter table private.catalog_import_providers drop constraint if exists catalog_import_providers_provider_key_check;
alter table private.catalog_import_providers add constraint catalog_import_providers_provider_key_check
  check (provider_key in ('brave_search','diffbot_product','upcitemdb','sovrn_commerce','channel3_catalog'));

insert into private.catalog_import_providers(provider_key,enabled,monthly_request_limit,warning_percent,critical_percent,no_paid_overage)
values ('channel3_catalog',true,1000,80,95,true)
on conflict(provider_key) do update set enabled=true, monthly_request_limit=1000, warning_percent=80, critical_percent=95, no_paid_overage=true, updated_at=now();

create table private.catalog_source_records (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider_key text not null references private.catalog_import_providers(provider_key),
  external_product_id text not null check (char_length(external_product_id) between 1 and 200),
  source_url text,
  image_url text,
  source_payload jsonb not null,
  selected_by uuid not null references auth.users(id) on delete cascade,
  selected_at timestamptz not null default now(),
  unique(provider_key,external_product_id,product_id)
);
create index catalog_source_records_product_idx on private.catalog_source_records(product_id,selected_at desc);
alter table private.catalog_source_records enable row level security;
revoke all on private.catalog_source_records from public,anon,authenticated;

create or replace function public.record_catalog_source_selection(
  p_product_id uuid, p_provider_key text, p_external_product_id text,
  p_source_url text, p_image_url text, p_source_payload jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_provider_key not in ('channel3_catalog','upcitemdb') then raise exception 'Unsupported catalog provider'; end if;
  if p_external_product_id is null or char_length(btrim(p_external_product_id)) not between 1 and 200 then raise exception 'Invalid catalog identifier'; end if;
  if p_source_payload is null or octet_length(p_source_payload::text) > 24000 then raise exception 'Invalid catalog source payload'; end if;
  if p_source_url is not null and p_source_url !~ '^https?://' then raise exception 'Invalid source URL'; end if;
  if p_image_url is not null and p_image_url !~ '^https?://' then raise exception 'Invalid image URL'; end if;

  insert into private.catalog_source_records(product_id,provider_key,external_product_id,source_url,image_url,source_payload,selected_by)
  values(p_product_id,p_provider_key,btrim(p_external_product_id),p_source_url,p_image_url,p_source_payload,v_user_id)
  on conflict(provider_key,external_product_id,product_id) do update set
    source_url=excluded.source_url, image_url=excluded.image_url, source_payload=excluded.source_payload, selected_by=excluded.selected_by, selected_at=now();

  if p_image_url is not null then
    update public.products set image_url=coalesce(image_url,p_image_url) where id=p_product_id;
  end if;
end;
$$;
revoke all on function public.record_catalog_source_selection(uuid,text,text,text,text,jsonb) from public,anon;
grant execute on function public.record_catalog_source_selection(uuid,text,text,text,text,jsonb) to authenticated;

comment on table private.catalog_source_records is 'Full selected external catalog payload retained with the one canonical Product; it is private provenance, not a duplicate catalog.';
