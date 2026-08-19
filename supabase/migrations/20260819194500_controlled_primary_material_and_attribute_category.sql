insert into public.garment_attribute_definitions(key,label,category,sort_order)
values('primary_material','Primary material / fabric family',null,35)
on conflict (key) do update
set label=excluded.label,
    category=excluded.category,
    sort_order=excluded.sort_order;

insert into public.garment_attribute_options(attribute_key,option_key,label,sort_order)
values
  ('primary_material','cotton','Cotton',10),
  ('primary_material','denim','Denim',20),
  ('primary_material','linen','Linen',30),
  ('primary_material','wool','Wool',40),
  ('primary_material','cashmere','Cashmere',50),
  ('primary_material','silk','Silk',60),
  ('primary_material','polyester','Polyester',70),
  ('primary_material','nylon','Nylon',80),
  ('primary_material','rayon_viscose','Rayon / viscose',90),
  ('primary_material','modal_lyocell','Modal / lyocell / Tencel',100),
  ('primary_material','acrylic','Acrylic',110),
  ('primary_material','leather','Leather',120),
  ('primary_material','suede','Suede',130),
  ('primary_material','fleece','Fleece',140),
  ('primary_material','canvas','Canvas',150),
  ('primary_material','mixed_blend','Mixed / no dominant material',160),
  ('primary_material','other','Other',170)
on conflict (attribute_key,option_key) do update
set label=excluded.label,
    sort_order=excluded.sort_order;

create or replace function public.enforce_product_attribute_category()
returns trigger
language plpgsql
set search_path=public
as $$
declare
  product_category public.garment_category;
  attribute_category public.garment_category;
begin
  select p.category into product_category
  from public.products p
  where p.id=new.product_id;

  if product_category is null then
    raise exception 'Product attribute requires an existing Product';
  end if;

  select d.category into attribute_category
  from public.garment_attribute_definitions d
  where d.key=new.attribute_key;

  if not found then
    raise exception 'Unknown garment attribute';
  end if;

  if attribute_category is not null and attribute_category is distinct from product_category then
    raise exception 'Garment attribute is not valid for this Product category';
  end if;

  return new;
end;
$$;

drop trigger if exists product_attribute_category_guard on public.product_attribute_values;
create trigger product_attribute_category_guard
before insert or update of product_id,attribute_key
on public.product_attribute_values
for each row
execute function public.enforce_product_attribute_category();

comment on function public.enforce_product_attribute_category() is
  'Protects Similar Garments evidence quality by allowing global attributes on any Product while category-scoped attributes may be attached only to Products in that category.';
