begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, private, extensions;
select plan(22);

select is(
  (select count(*) from public.measurement_types where default_tolerance_canonical is null or default_tolerance_canonical<=0),
  0::bigint,
  'every canonical body measurement has a positive tolerance'
);

select is(
  (select count(*) from public.garment_types gt where gt.active and not exists(select 1 from private.garment_match_measurements(gt.key))),
  0::bigint,
  'every active garment type resolves to an effective measurement model'
);

select is(
  (select count(*) from public.measurement_types mt
   where mt.key<>'overbust'
     and not exists(select 1 from public.match_profile_measurements mpm where mpm.measurement_type_key=mt.key)
     and not exists(select 1 from public.garment_type_match_adjustments gta where gta.measurement_type_key=mt.key and gta.extra_weight>0)),
  0::bigint,
  'every Fit Profile measurement shown by V1 participates in at least one relevant match path'
);

select is(round(private.fit_measurement_similarity(100,100,10),6),1.000000::numeric,'exact measurements have similarity 1');
select is(round(private.fit_measurement_similarity(100,105,10),6),0.500000::numeric,'half a tolerance apart has similarity 0.5');
select is(round(private.fit_measurement_similarity(100,110,10),6),0.062500::numeric,'one full tolerance apart decays smoothly to 0.0625 instead of a hard zero');

select is(private.confidence_adjusted_match(1,1,1,1,1,5,5),100,'complete exact reliable evidence can score 100');
select ok(private.confidence_adjusted_match(1,1,.35,.35,1,2,6)<100,'sparse exact evidence cannot score 100');
select is(private.confidence_adjusted_match(.80,1,1,1,1,5,5),80,'confidence adjustment never boosts raw similarity');

select is(
  (select coverage_weight from public.match_profile_measurements where profile_key='tops_default' and measurement_type_key='full_bust'),
  0.000000::numeric,
  'generic Tops confidence does not require Full Bust'
);
select is(
  (select coverage_weight from public.match_profile_measurements where profile_key='overall' and measurement_type_key='full_bust'),
  0.000000::numeric,
  'generic Overall confidence does not require Full Bust'
);

select ok(
  (select weight from private.garment_match_measurements('t_shirt') where measurement_type_key='arm_sleeve_length') <
  (select weight from public.match_profile_measurements where profile_key='tops_default' and measurement_type_key='arm_sleeve_length'),
  'T-shirt matching downweights full sleeve length'
);
select is((select count(*) from private.garment_match_measurements('tank') where measurement_type_key='arm_sleeve_length'),0::bigint,'sleeveless tank matching removes sleeve length');
select is((select count(*) from private.garment_match_measurements('shorts') where measurement_type_key='inseam'),0::bigint,'shorts matching removes inseam');
select is((select count(*) from private.garment_match_measurements('skirts') where measurement_type_key='inseam'),0::bigint,'skirt matching removes inseam');
select ok((select count(*) from private.garment_match_measurements('jeans') where measurement_type_key in ('knee_circumference','calf_circumference','crotch_depth','total_crotch_length'))=4,'jeans matching uses advanced leg/crotch dimensions when available');
select is((select minimum_coverage from public.match_profiles where key='bra'),.65000::numeric,'bra matching requires substantial shared bust/underbust evidence');
select is((select tolerance_multiplier from public.garment_attribute_match_adjustments where attribute_key='stretch_level' and option_key='high' and measurement_type_key='full_hip_seat'),1.2500::numeric,'high-stretch garments widen circumference tolerance in a controlled way');
select ok(
  (select weight_multiplier from public.garment_attribute_match_adjustments where attribute_key='rise' and option_key='high' and measurement_type_key='natural_waist') >
  (select weight_multiplier from public.garment_attribute_match_adjustments where attribute_key='rise' and option_key='high' and measurement_type_key='lower_pants_waist'),
  'high-rise garments shift fit importance toward natural waist'
);

insert into public.brands(id,name,slug,normalized_name)
values('de000000-0000-4000-8000-000000000001'::uuid,'Engine Test Brand','engine-test-brand','enginetestbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values
('de000000-0000-4000-8000-000000000002'::uuid,'de000000-0000-4000-8000-000000000001'::uuid,'Mens Test Tee','mens-test-tee','tops','menstesttee','t_shirt','mens'),
('de000000-0000-4000-8000-000000000003'::uuid,'de000000-0000-4000-8000-000000000001'::uuid,'Unisex Long Sleeve','unisex-long-sleeve','tops','unisexlongsleeve','t_shirt','unisex');

select is(
  (select count(*) from private.product_match_measurements('de000000-0000-4000-8000-000000000002'::uuid) where measurement_type_key='full_bust'),
  0::bigint,
  'mens Product matching removes Full Bust instead of penalizing missing bust data'
);
select is(
  (select count(*) from private.product_match_measurements('de000000-0000-4000-8000-000000000002'::uuid) where measurement_type_key='chest_circumference'),
  1::bigint,
  'mens Product matching keeps Chest as the upper-torso circumference signal'
);

insert into public.product_attribute_values(product_id,attribute_key,option_key)
values
('de000000-0000-4000-8000-000000000003'::uuid,'sleeve_length','long'),
('de000000-0000-4000-8000-000000000003'::uuid,'collar_style','button_down');
select is(
  (select count(*) from private.product_match_measurements('de000000-0000-4000-8000-000000000003'::uuid) where measurement_type_key='wrist_circumference'),
  1::bigint,
  'long-sleeve Product attributes can introduce Wrist Circumference as an advanced fit signal'
);
select is(
  (select count(*) from private.product_match_measurements('de000000-0000-4000-8000-000000000003'::uuid) where measurement_type_key='neck_collar_circumference'),
  1::bigint,
  'collar style can introduce Neck / Collar Circumference as an advanced fit signal'
);

select * from finish();
rollback;
