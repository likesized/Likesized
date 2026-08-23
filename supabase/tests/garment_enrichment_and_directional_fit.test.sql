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

select hasnt_column('public','fit_reports','fit_rating','Fit Reports do not carry the abandoned satisfaction-rating field');
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

-- Member evidence is report-scoped. These private reports are only provenance anchors and
-- therefore do not participate in the later Shared recommendation/fit-distribution checks.
insert into public.closet_items(id,user_id,product_id,size_label,visibility) values
('b3000000-0000-4000-8000-000000000101','b0000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','M','private'),
('b3000000-0000-4000-8000-000000000102','b0000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000002','M','private'),
('b3000000-0000-4000-8000-000000000103','b0000000-0000-4000-8000-000000000003','b2000000-0000-4000-8000-000000000001','M','private'),
('b3000000-0000-4000-8000-000000000203','b0000000-0000-4000-8000-000000000003','b2000000-0000-4000-8000-000000000002','M','private'),
('b3000000-0000-4000-8000-000000000104','b0000000-0000-4000-8000-000000000004','b2000000-0000-4000-8000-000000000001','M','private');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again) values
('b4000000-0000-4000-8000-000000000101','b0000000-0000-4000-8000-000000000001','b3000000-0000-4000-8000-000000000101','b2000000-0000-4000-8000-000000000001','M','just_right',true),
('b4000000-0000-4000-8000-000000000102','b0000000-0000-4000-8000-000000000002','b3000000-0000-4000-8000-000000000102','b2000000-0000-4000-8000-000000000002','M','just_right',true),
('b4000000-0000-4000-8000-000000000103','b0000000-0000-4000-8000-000000000003','b3000000-0000-4000-8000-000000000103','b2000000-0000-4000-8000-000000000001','M','just_right',true),
('b4000000-0000-4000-8000-000000000203','b0000000-0000-4000-8000-000000000003','b3000000-0000-4000-8000-000000000203','b2000000-0000-4000-8000-000000000002','M','just_right',true),
('b4000000-0000-4000-8000-000000000104','b0000000-0000-4000-8000-000000000004','b3000000-0000-4000-8000-000000000104','b2000000-0000-4000-8000-000000000001','M','just_right',true);

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
 p_product_id := 'b2000000-0000-4000-8000-000000000001'::uuid,
 p_fit_report_id := 'b4000000-0000-4000-8000-000000000101'::uuid,
 p_garment_type := 't_shirt',
 p_market_segment := 'unisex',
 p_attributes := '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 p_materials := '[{"material_key":"cotton","percentage":100}]'::jsonb,
 p_source_reference := 'member-label'
);
-- Updating the same counted Fit Report replaces its prior evidence instead of adding a vote.
select public.record_member_product_evidence(
 p_product_id := 'b2000000-0000-4000-8000-000000000001'::uuid,
 p_fit_report_id := 'b4000000-0000-4000-8000-000000000101'::uuid,
 p_garment_type := 't_shirt',
 p_market_segment := 'unisex',
 p_attributes := '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 p_materials := '[{"material_key":"cotton","percentage":100}]'::jsonb,
 p_source_reference := 'member-label-repeat'
);
reset role;

select is((select count(*)::integer from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),0,'report-scoped physical answers do not become a canonical single-value Product attribute');
select is((select source_status::text from public.product_materials where product_id='b2000000-0000-4000-8000-000000000001'::uuid and material_key='cotton'),'provisional','first member material composition is provisional');
select is((select catalog_status::text from public.products where id='b2000000-0000-4000-8000-000000000001'::uuid),'provisional','one member does not verify or corroborate Product classification');
select is((select count(*)::integer from public.product_attribute_evidence where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),1,'updating the same Fit Report keeps one attribute evidence row');

create temporary table provisional_wrist on commit drop as
select weight from private.product_match_measurements('b2000000-0000-4000-8000-000000000001'::uuid) where measurement_type_key='wrist_circumference';
select is((select count(*) from provisional_wrist),0::bigint,'report-scoped long-sleeve evidence does not rewrite the canonical Product match-measurement map');

-- Give the peer Product one matching report-scoped physical answer and a Shared bad Fit Report.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
select public.record_member_product_evidence(
 p_product_id := 'b2000000-0000-4000-8000-000000000002'::uuid,
 p_fit_report_id := 'b4000000-0000-4000-8000-000000000102'::uuid,
 p_garment_type := 't_shirt',
 p_market_segment := 'unisex',
 p_attributes := '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 p_materials := '[{"material_key":"cotton","percentage":100}]'::jsonb,
 p_source_reference := 'peer-label'
);
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('b3000000-0000-4000-8000-000000000002'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000021'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','too_small',false,now()-interval '1 day');
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
create temporary table before_corroboration on commit drop as
select * from public.get_product_evidence_candidates('b2000000-0000-4000-8000-000000000001'::uuid,null,50);
reset role;
select is((select evidence_level::text from before_corroboration where fit_report_id='b4000000-0000-4000-8000-000000000021'::uuid),'brand_garment_type','report-scoped physical-answer overlap does not create Similar Garments Product evidence');
select is((select attribute_overlap from before_corroboration where fit_report_id='b4000000-0000-4000-8000-000000000021'::uuid),0,'report-scoped physical answers are excluded from Product-level Similar Garments overlap');

-- A second independent member can corroborate Product classification/material evidence while
-- the controlled physical answers remain report-scoped variant evidence.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
select public.record_member_product_evidence(
 p_product_id := 'b2000000-0000-4000-8000-000000000001'::uuid,
 p_fit_report_id := 'b4000000-0000-4000-8000-000000000103'::uuid,
 p_garment_type := 't_shirt',
 p_market_segment := 'unisex',
 p_attributes := '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 p_materials := '[{"material_key":"cotton","percentage":100}]'::jsonb,
 p_source_reference := 'second-member'
);
select public.record_member_product_evidence(
 p_product_id := 'b2000000-0000-4000-8000-000000000002'::uuid,
 p_fit_report_id := 'b4000000-0000-4000-8000-000000000203'::uuid,
 p_garment_type := 't_shirt',
 p_market_segment := 'unisex',
 p_attributes := '[{"attribute_key":"sleeve_length","option_key":"long"}]'::jsonb,
 p_materials := '[{"material_key":"cotton","percentage":100}]'::jsonb,
 p_source_reference := 'second-member'
);
reset role;

select is((select count(distinct submitted_by)::integer from public.product_attribute_evidence where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length' and option_key='long'),2,'two independent report-scoped observations remain preserved as two member evidence sources');
select is((select count(*)::integer from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),0,'multiple report-scoped physical answers still do not create a canonical single-value Product attribute');
select is((select catalog_status::text from public.products where id='b2000000-0000-4000-8000-000000000001'::uuid),'corroborated','two members agreeing on garment type and segment corroborate Product classification');
select is((select count(*) from private.product_match_measurements('b2000000-0000-4000-8000-000000000001'::uuid) where measurement_type_key='wrist_circumference'),0::bigint,'report-scoped observations do not mutate the Product match-measurement map after multiple submissions');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
create temporary table after_corroboration on commit drop as
select * from public.get_product_evidence_candidates('b2000000-0000-4000-8000-000000000001'::uuid,null,50);
reset role;
select is((select evidence_level::text from after_corroboration where fit_report_id='b4000000-0000-4000-8000-000000000021'::uuid),'brand_garment_type','corroborated Product classification still does not turn report-scoped physical answers into Similar Garments Product facts');
select is((select attribute_overlap from after_corroboration where fit_report_id='b4000000-0000-4000-8000-000000000021'::uuid),0,'Product-level Similar Garments overlap remains zero without a canonical Product attribute');

-- A conflicting report-scoped physical answer is a legitimate fit-variant observation and does
-- not by itself mark the Product identity as conflicting or overwrite a canonical Product slot.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
select public.record_member_product_evidence(
 p_product_id := 'b2000000-0000-4000-8000-000000000001'::uuid,
 p_fit_report_id := 'b4000000-0000-4000-8000-000000000104'::uuid,
 p_garment_type := 't_shirt',
 p_market_segment := 'unisex',
 p_attributes := '[{"attribute_key":"sleeve_length","option_key":"short"}]'::jsonb,
 p_materials := '[]'::jsonb,
 p_source_reference := 'conflicting-member'
);
reset role;
select is((select catalog_review_needed from public.products where id='b2000000-0000-4000-8000-000000000001'::uuid),false,'report-scoped physical-answer variation does not by itself flag Product identity for review');
select is((select count(*)::integer from public.product_attribute_values where product_id='b2000000-0000-4000-8000-000000000001'::uuid and attribute_key='sleeve_length'),0,'conflicting report-scoped answers remain raw evidence instead of overwriting a Product attribute');

-- Product resolution prefers exact identifiers before any new catalog creation.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
select is(public.resolve_catalog_product(null,'Wrong Typed Brand',null,'012345678905',null),'b2000000-0000-4000-8000-000000000003'::uuid,'known UPC resolves the existing canonical Product');
select is(public.resolve_catalog_product(null,'Wrong Typed Brand',null,null,'https://example.test/verified-tee'),'b2000000-0000-4000-8000-000000000003'::uuid,'known normalized product URL resolves the existing canonical Product');
select is(public.resolve_catalog_product(null,'Garment Evidence Brand','TEE-300',null,null),'b2000000-0000-4000-8000-000000000003'::uuid,'Brand + manufacturer Style ID resolves the existing canonical Product');
reset role;

-- Physical Fit Result is mandatory; satisfaction ratings are intentionally not part of Fit Reports.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
select throws_like(
 $$insert into public.fit_reports(user_id,closet_item_id,product_id,size_label) values('b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M')$$,
 '%Physical Fit Result is required%',
 'new Fit Reports require a physical Fit Result'
);
reset role;

-- Direction makes bad-fit evidence stronger or weaker without changing body Match %.
select ok(
 private.directional_fit_support_from_pressure('too_small'::public.fit_rating,.60) < private.directional_fit_support_from_pressure('too_small'::public.fit_rating,-.60),
 'Too Small is stronger negative evidence when the viewer is larger than the wearer'
);
select ok(
 private.directional_fit_support_from_pressure('too_big'::public.fit_rating,-.60) < private.directional_fit_support_from_pressure('too_big'::public.fit_rating,.60),
 'Too Big is stronger negative evidence when the viewer is smaller than the wearer'
);

-- Add more Shared exact-product reports plus a Private report. Every distinct Shared Fit
-- Report situation counts; the earlier Shared Too Small report remains valid evidence.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('b3000000-0000-4000-8000-000000000001'::uuid,'b0000000-0000-4000-8000-000000000001'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','shared');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000011'::uuid,'b0000000-0000-4000-8000-000000000001'::uuid,'b3000000-0000-4000-8000-000000000001'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','just_right',true,now());
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000022'::uuid,'b0000000-0000-4000-8000-000000000002'::uuid,'b3000000-0000-4000-8000-000000000002'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','snug',true,now());
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values('b3000000-0000-4000-8000-000000000004'::uuid,'b0000000-0000-4000-8000-000000000004'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','private');
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again,created_at)
values('b4000000-0000-4000-8000-000000000041'::uuid,'b0000000-0000-4000-8000-000000000004'::uuid,'b3000000-0000-4000-8000-000000000004'::uuid,'b2000000-0000-4000-8000-000000000002'::uuid,'M','too_big',false,now());
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
create temporary table fit_summary on commit drop as select * from public.get_product_fit_summary('b2000000-0000-4000-8000-000000000002'::uuid);
reset role;
select is((select total_fit_count from fit_summary),3,'physical fit distribution counts every distinct Shared Fit Report situation');
select is((select just_right_count from fit_summary),1,'distinct-situation distribution counts Just right');
select is((select snug_count from fit_summary),1,'distinct-situation distribution counts Snug');

select * from finish();
rollback;