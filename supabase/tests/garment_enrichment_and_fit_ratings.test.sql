begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(27);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
 ('b0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','garment-a@likesized.test',now(),now()),
 ('b0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','garment-b@likesized.test',now(),now()),
 ('b0000000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','garment-c@likesized.test',now(),now()),
 ('b0000000-0000-4000-8000-000000000004'::uuid,'authenticated','authenticated','garment-d@likesized.test',now(),now());

-- Each test member gets enough current body evidence for a qualified Tops match.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
select public.save_fit_profile('garment_a','imperial'::public.unit_system,'[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":25,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
select public.save_fit_profile('garment_b','imperial'::public.unit_system,'[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":25,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
select public.save_fit_profile('garment_c','imperial'::public.unit_system,'[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":25,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
select public.save_fit_profile('garment_d','imperial'::public.unit_system,'[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"torso_body_length","entered_value":25,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
reset role;

select has_column('public','fit_reports','fit_rating','Fit Reports have a separate 1-5 Fit Rating');
select is((select label from public.materials where key='cashmere'),'Cashmere','care-label composition catalog includes added fiber types');

insert into public.brands(id,name,slug,normalized_name)
values('b1000000-0000-4000-8000-000000000001'::uuid,'Garment Evidence Brand','garment-evidence-brand','garmentevidencebrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,manufacturer_style_number,catalog_status)
values
 ('b2000000-0000-4000-8000-000000000001'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Target Tee','target-tee-evidence','tops','targettee','t_shirt','unisex','TEE-100','provisional'),
 ('b2000000-0000-4000-8000-000000000002'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Peer Tee','peer-tee-evidence','tops','peertee','t_shirt','unisex','TEE-200','provisional'),
 ('b2000000-0000-4000-8000-000000000003'::uuid,'b1000000-0000-4000-8000-000000000001'::uuid,'Verified Tee','verified-tee-evidence','tops','verifiedtee','t_shirt','unisex','TEE-300','verified');
insert into public.product_identifiers(product_id,identifier_type,original_value,normalized_value)
values('b2000000-0000-4000-8000-000000000003'::uuid,'upc','012345678905','012345678905');
insert into public.retailer_listings(product_id,product_url,normalized_url)
values('b2000000-0000-4000-8000-000000000003'::uuid,'https://example.test/verified-tee','https://example.test/verified-tee');

-- A member cannot masquerade as a trusted manufacturer source.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
select throws_like(
 $$insert into public.product_attribute_evidence(product_id,attribute_key,option_key,source_type,source_status,confidence,submitted_by) values('b2000000-0000-4000-8000-000000000001'::uuid,'fit_cut','slim','manufacturer','verified',1,'b0000000-0000-4000-8000-000000000001'::uuid)$$,
 '%row-level security%',
 'members cannot submit manufacturer/verified garment facts'
);
select public.record_member_product_evidence(
 'b2000000-0000-4000-8000-000000000001'::uuid,'t_shirt','unisex',
 '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 '[{"material_key":"cotton","percentage":100}]'::jsonb,'member-label'
);
-- Same member logging the same Product again is not a second vote.
select public.record_member_product_evidence(
 'b2000000-0000-4000-8000-000000000001'::uuid,'t_shirt','unisex',
 '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 '[{"material_key":"cotton","percentage":100}]'::jsonb,'member-label-repeat'
);
reset role;

select is((select source_status::text from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),'provisional','first member garment attribute is provisional');
select is((select source_status::text from public.product_materials where product_id='b2000000-0000-4000-8000-000000000001'::uuid and material_key='cotton'),'provisional','first member material composition is provisional');
select is((select catalog_status::text from public.products where id='b2000000-0000-4000-8000-000000000001'::uuid),'provisional','one member does not verify or corroborate Product classification');
select is((select count(*)::integer from public.product_attribute_evidence where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),1,'repeat logging by the same member counts as one attribute vote');

create temporary table provisional_wrist on commit drop as
select weight from private.product_match_measurements('b2000000-0000-4000-8000-000000000001'::uuid) where measurement_type_key='wrist_circumference';
select ok((select weight from provisional_wrist)>0,'provisional long-sleeve evidence may softly introduce wrist relevance');

-- Give the peer Product one provisional matching construction attribute and a Shared Fit Report.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
select public.record_member_product_evidence(
 'b2000000-0000-4000-8000-000000000002'::uuid,'t_shirt','unisex',
 '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 '[{"material_key":"cotton","percentage":100}]'::jsonb,'peer-label'
);
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('b3000000-0000-4000-8000-000000000002'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,fit_rating,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000021'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','too_small',2,false,now()-interval '1 day');
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
create temporary table before_corroboration on commit drop as
select * from public.get_product_evidence_candidates('b2000000-0000-4000-8000-000000000001'::uuid,null,50);
reset role;
select is((select evidence_level::text from before_corroboration where user_id='b0000000-0000-4000-8000-000000000002'::uuid),'brand_garment_type','one-member provisional attribute overlap does not create Similar Garments evidence');
select is((select attribute_overlap from before_corroboration where user_id='b0000000-0000-4000-8000-000000000002'::uuid),0,'provisional overlap is excluded from Similar Garments overlap count');

-- A second independent member agreeing with both Products promotes the facts.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
select public.record_member_product_evidence('b2000000-0000-4000-8000-000000000001'::uuid,'t_shirt','unisex','[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,'[{"material_key":"cotton","percentage":100}]'::jsonb,'second-member');
select public.record_member_product_evidence('b2000000-0000-4000-8000-000000000002'::uuid,'t_shirt','unisex','[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,'[{"material_key":"cotton","percentage":100}]'::jsonb,'second-member');
reset role;

select is((select source_status::text from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),'corroborated','two independent members promote agreeing attribute evidence');
select ok((select confidence from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length')>=.80,'corroborated attribute confidence is at least 0.80');
select is((select catalog_status::text from public.products where id='b2000000-0000-4000-8000-000000000001'::uuid),'corroborated','two members agreeing on garment type and segment corroborate Product classification');
select ok((select weight from private.product_match_measurements('b2000000-0000-4000-8000-000000000001'::uuid) where measurement_type_key='wrist_circumference')>(select weight from provisional_wrist),'corroboration increases the attribute contribution to the match path');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
create temporary table after_corroboration on commit drop as
select * from public.get_product_evidence_candidates('b2000000-0000-4000-8000-000000000001'::uuid,null,50);
reset role;
select is((select evidence_level::text from after_corroboration where user_id='b0000000-0000-4000-8000-000000000002'::uuid),'similar_garments','corroborated controlled overlap qualifies as Similar Garments evidence');
select ok((select attribute_overlap from after_corroboration where user_id='b0000000-0000-4000-8000-000000000002'::uuid)>=1,'corroborated overlap contributes to the Similar Garments overlap count');

-- Conflicting later member evidence flags review but does not displace the stronger consensus.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
select public.record_member_product_evidence('b2000000-0000-4000-8000-000000000001'::uuid,'t_shirt','unisex','[{"attribute_key":"sleeve_length","option_key":"short"}]'::jsonb,'[]'::jsonb,'conflicting-member');
reset role;
select ok((select catalog_review_needed from public.products where id='b2000000-0000-4000-8000-000000000001'::uuid),'conflicting member garment facts flag the Product for review');
select is((select option_key from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),'long','one conflicting vote does not replace the stronger long-sleeve consensus');

-- Product resolution prefers exact identifiers before any new catalog creation.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
select is(public.resolve_catalog_product(null,'Wrong Typed Brand',null,'012345678905',null),'b2000000-0000-4000-8000-000000000003'::uuid,'known UPC resolves the existing canonical Product');
select is(public.resolve_catalog_product(null,'Wrong Typed Brand',null,null,'https://example.test/verified-tee'),'b2000000-0000-4000-8000-000000000003'::uuid,'known normalized product URL resolves the existing canonical Product');
select is(public.resolve_catalog_product(null,'Garment Evidence Brand','TEE-300',null,null),'b2000000-0000-4000-8000-000000000003'::uuid,'Brand + manufacturer Style ID resolves the existing canonical Product');
reset role;

-- Add latest Shared exact-product reports from two unique wearers plus a Private report.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('b3000000-0000-4000-8000-000000000001'::uuid,'b0000000-0000-4000-8000-000000000001'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,fit_rating,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000011'::uuid,'b0000000-0000-4000-8000-000000000001'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','just_right',5,true,now());
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,fit_rating,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000022'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','snug',4,true,now());
select throws_like(
 $$insert into public.fit_reports(user_id,closet_item_id,product_id,size_label,fit,fit_rating) values('b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','just_right',6)$$,
 '%fit_rating%',
 'Fit Rating rejects values outside 1-5'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('b3000000-0000-4000-8000-000000000004'::uuid,'b0000000-0000-4000-8000-000000000004'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','private');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,fit_rating,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000041'::uuid,'b0000000-0000-4000-8000-000000000004'::uuid,'b3000000-0000-4000-8000-000000000004'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','too_big',1,false,now());
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
create temporary table fit_summary on commit drop as select * from public.get_product_fit_summary('b2000000-0000-4000-8000-000000000002'::uuid);
reset role;
select is((select average_rating from fit_summary),4.5::numeric,'exact-product average Fit Rating uses latest Shared observation per unique wearer');
select is((select rating_count from fit_summary),2,'community rating count excludes repeated and Private observations');
select is((select total_fit_count from fit_summary),2,'physical fit distribution uses the same unique Shared wearer population');
select is((select just_right_count from fit_summary),1,'latest unique-wearer distribution counts Just right');
select is((select snug_count from fit_summary),1,'latest unique-wearer distribution counts Snug');

select * from finish();
rollback;
