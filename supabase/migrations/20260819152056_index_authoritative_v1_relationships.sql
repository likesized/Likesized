-- LikeSized canonical migration: 20260819152056_index_authoritative_v1_relationships
-- Exact SQL applied to the connected Supabase project.

create index if not exists brand_aliases_brand_id_idx on public.brand_aliases(brand_id);
create index if not exists closet_items_normalized_size_id_idx on public.closet_items(normalized_size_id);
create index if not exists fit_profiles_current_version_id_idx on public.fit_profiles(current_version_id);
create index if not exists fit_reports_normalized_size_id_idx on public.fit_reports(normalized_size_id);
create index if not exists garment_type_fit_dimensions_dimension_key_idx on public.garment_type_fit_dimensions(dimension_key);
create index if not exists garment_types_match_profile_key_idx on public.garment_types(match_profile_key);
create index if not exists match_profile_measurements_measurement_type_key_idx on public.match_profile_measurements(measurement_type_key);
create index if not exists product_families_garment_type_key_idx on public.product_families(garment_type_key);
create index if not exists product_identifiers_retailer_id_idx on public.product_identifiers(retailer_id);
create index if not exists product_identifiers_retailer_listing_id_idx on public.product_identifiers(retailer_listing_id);
create index if not exists product_identifiers_variant_id_idx on public.product_identifiers(variant_id);
create index if not exists product_materials_material_key_idx on public.product_materials(material_key);
create index if not exists product_variants_normalized_size_id_idx on public.product_variants(normalized_size_id);
create index if not exists products_garment_type_key_idx on public.products(garment_type_key);
create index if not exists products_product_family_id_idx on public.products(product_family_id);
create index if not exists retailer_listings_retailer_id_idx on public.retailer_listings(retailer_id);
create index if not exists retailer_listings_variant_id_idx on public.retailer_listings(variant_id);
