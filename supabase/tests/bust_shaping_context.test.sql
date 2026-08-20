begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, private, extensions;
select plan(16);

select is(
  (select coverage_weight from public.match_profile_measurements where profile_key='tops_default' and measurement_type_key='full_bust'),
  0.000000::numeric,
  'generic Tops still does not require Full Bust'
);

insert into public.brands(id,name,slug,normalized_name)
values('b5000000-0000-4000-8000-000000000001'::uuid,'Bust Context Test','bust-context-test','bustcontexttest');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values
('b5000000-0000-4000-8000-000000000010'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Womens Blouse','womens-blouse-test','tops','womensblousetest','blouse','womens'),
('b5000000-0000-4000-8000-000000000011'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Unisex Blouse','unisex-blouse-test','tops','unisexblousetest','blouse','unisex'),
('b5000000-0000-4000-8000-000000000012'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Unknown Blouse','unknown-blouse-test','tops','unknownblousetest','blouse','unknown'),
('b5000000-0000-4000-8000-000000000013'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Mens Blazer','mens-blazer-test','outerwear','mensblazertest','blazers','mens'),
('b5000000-0000-4000-8000-000000000014'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Womens Blazer','womens-blazer-test','outerwear','womensblazertest','blazers','womens'),
('b5000000-0000-4000-8000-000000000015'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Womens Dress','womens-dress-test','dresses','womensdresstest','dresses','womens'),
('b5000000-0000-4000-8000-000000000016'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Womens Bodysuit','womens-bodysuit-test','other','womensbodysuittest','bodysuits','womens'),
('b5000000-0000-4000-8000-000000000017'::uuid,'b5000000-0000-4000-8000-000000000001'::uuid,'Bra Test','bra-context-test','other','bracontexttest','bras_intimate','womens');

select ok(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000010'::uuid) where measurement_type_key='full_bust') >
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000010'::uuid) where measurement_type_key='chest_circumference'),
  'explicit womens blouse makes Full Bust primary to Chest'
);

select ok(
  (select coverage_weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000010'::uuid) where measurement_type_key='full_bust') > 0,
  'womens blouse treats missing Full Bust as a real confidence gap'
);

select ok(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000010'::uuid) where measurement_type_key='chest_circumference') > 0,
  'Chest remains useful general upper-body evidence for a womens blouse'
);

select is(
  (select coverage_weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000011'::uuid) where measurement_type_key='full_bust'),
  0.000000::numeric,
  'unisex blouse does not require Full Bust'
);

select ok(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000011'::uuid) where measurement_type_key='full_bust') <
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000011'::uuid) where measurement_type_key='chest_circumference'),
  'unisex blouse keeps Full Bust optional and secondary to Chest'
);

select is(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000012'::uuid) where measurement_type_key='full_bust'),
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000012'::uuid) where measurement_type_key='chest_circumference'),
  'unknown market segment does not infer womens bust shaping'
);

select is(
  (select count(*) from private.product_match_measurements('b5000000-0000-4000-8000-000000000013'::uuid) where measurement_type_key='full_bust'),
  0::bigint,
  'mens tailored jacket removes Full Bust'
);

select is(
  (select count(*) from private.product_match_measurements('b5000000-0000-4000-8000-000000000013'::uuid) where measurement_type_key='chest_circumference'),
  1::bigint,
  'mens tailored jacket keeps Chest'
);

select ok(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000014'::uuid) where measurement_type_key='full_bust') >
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000014'::uuid) where measurement_type_key='chest_circumference'),
  'explicit womens tailored jacket makes Full Bust primary while keeping Chest'
);

select ok(
  (select coverage_weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000014'::uuid) where measurement_type_key='full_bust') > 0,
  'womens tailored jacket gives Full Bust confidence relevance'
);

select ok(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000015'::uuid) where measurement_type_key='full_bust') >
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000015'::uuid) where measurement_type_key='chest_circumference'),
  'womens dress keeps Full Bust primary to Chest'
);

select ok(
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000016'::uuid) where measurement_type_key='full_bust') >
  (select weight from private.product_match_measurements('b5000000-0000-4000-8000-000000000016'::uuid) where measurement_type_key='chest_circumference'),
  'womens bodysuit keeps Full Bust primary to Chest'
);

select is(
  (select count(*) from private.product_match_measurements('b5000000-0000-4000-8000-000000000017'::uuid) where measurement_type_key='full_bust'),
  1::bigint,
  'bra model continues to use Full Bust through its specialized match profile'
);

select is(
  (select count(*) from private.product_match_measurements('b5000000-0000-4000-8000-000000000017'::uuid) where measurement_type_key='chest_circumference'),
  0::bigint,
  'bra model does not substitute generic Chest for its specialized bust geometry'
);

select ok(
  (select bust_to_chest_ratio_weight from private.bust_shaping_product_rules where garment_type_key='blouse') > 0
  and (select bust_to_chest_ratio_weight from private.bust_shaping_product_rules where garment_type_key='blouse') <= .04,
  'Chest-vs-Full-Bust proportion remains a low-weight refinement'
);

select is(
  has_table_privilege('authenticated','private.bust_shaping_product_rules','SELECT'),
  false,
  'authenticated members cannot read private bust-shaping rules directly'
);

select * from finish();
rollback;
