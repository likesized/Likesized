create or replace function public.enforce_product_family_compatibility()
returns trigger
language plpgsql
set search_path=public
as $$
declare
  f_brand uuid;
  f_garment_type text;
  f_market_segment public.garment_market_segment;
begin
  if new.product_family_id is null then
    return new;
  end if;

  select pf.brand_id,pf.garment_type_key,pf.market_segment
    into f_brand,f_garment_type,f_market_segment
  from public.product_families pf
  where pf.id=new.product_family_id;

  if f_brand is null then
    raise exception 'Product family does not exist';
  end if;

  if f_brand is distinct from new.brand_id
     or f_garment_type is distinct from new.garment_type_key
     or f_market_segment is distinct from new.market_segment then
    raise exception 'Product family must match product brand, garment type, and market segment';
  end if;

  return new;
end;
$$;

drop trigger if exists product_family_compatibility_guard on public.products;
create trigger product_family_compatibility_guard
before insert or update of product_family_id,brand_id,garment_type_key,market_segment
on public.products
for each row
execute function public.enforce_product_family_compatibility();

comment on function public.enforce_product_family_compatibility() is
  'Protects Product Family evidence integrity: a product may join a family only when brand, garment type, and market/cut segment match. Family linkage remains optional and intentionally conservative.';
