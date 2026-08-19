-- LikeSized authoritative V1 architecture constraint refinement.
-- Mirrors hosted Supabase migration 20260819144343.

drop index if exists public.products_brand_normalized_identity_uq;
create unique index products_brand_normalized_identity_uq
  on public.products(
    brand_id,
    normalized_name,
    coalesce(garment_type_key,''),
    market_segment,
    coalesce(manufacturer_style_normalized,'')
  );

create or replace function private.normalize_brand_alias_row()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  new.normalized_alias := public.normalize_search_text(new.alias);
  return new;
end;
$$;
revoke all on function private.normalize_brand_alias_row() from public,anon,authenticated;
create trigger normalize_brand_alias_before_write
before insert or update of alias on public.brand_aliases
for each row execute function private.normalize_brand_alias_row();

revoke all on function public.parse_garment_size(text,public.garment_size_kind,text) from public,anon;
grant execute on function public.parse_garment_size(text,public.garment_size_kind,text) to authenticated;

revoke all on function public.normalize_search_text(text) from public,anon,authenticated;
revoke all on function public.normalize_identifier(text) from public,anon,authenticated;

alter table public.retailer_listings
  add constraint retailer_listing_url_pair check (
    (product_url is null and normalized_url is null)
    or (product_url is not null and normalized_url is not null)
  );

comment on column public.products.category is
  'Controlled broad category retained for compatibility/fallback. garment_type_key is the authoritative detailed taxonomy.';
comment on column public.products.market_segment is
  'Garment sizing/cut market (mens/womens/unisex/kids_youth/unknown), never a user gender identity.';
comment on column public.closet_items.size_label is
  'Original manufacturer/retailer size label exactly as supplied. normalized_size_id is the logical matching key.';
comment on column public.fit_reports.size_label is
  'Original manufacturer/retailer size label exactly as supplied. normalized_size_id is the logical matching key.';
