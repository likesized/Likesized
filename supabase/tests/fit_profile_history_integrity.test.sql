begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(14);

-- Two disposable members: wearer A changes body state; viewer B stays at A's original state.
insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('44444444-4444-4444-8444-444444444444'::uuid,'authenticated','authenticated','history-a@likesized.test',now(),now()),
  ('55555555-5555-4555-8555-555555555555'::uuid,'authenticated','authenticated','history-b@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'history_a','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'history_b','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

-- Canonical test garment. Catalog setup is not the subject of this test.
insert into public.brands(id,name,slug,normalized_name)
values('66666666-6666-4666-8666-666666666666'::uuid,'History Test Brand','history-test-brand','historytestbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values(
  '77777777-7777-4777-8777-777777777777'::uuid,
  '66666666-6666-4666-8666-666666666666'::uuid,
  'History Test Tee','history-test-tee','tops','historytesttee','t_shirt','unisex'
);

-- A logs a Shared garment/report while still in body state v1.
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claim.role = 'authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values(
  '88888888-8888-4888-8888-888888888888'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  'M','shared'
);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values(
  '99999999-9999-4999-8999-999999999999'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  '88888888-8888-4888-8888-888888888888'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  'M','just_right',true
);

select is(
  (select version_number from public.fit_profile_versions v join public.fit_reports r on r.fit_profile_version_id=v.id where r.id='99999999-9999-4999-8999-999999999999'::uuid),
  1,
  'first Fit Report locks to wearer body state version 1'
);
select is(
  (select value_canonical from public.fit_profile_version_measurements m join public.fit_reports r on r.fit_profile_version_id=m.fit_profile_version_id where r.id='99999999-9999-4999-8999-999999999999'::uuid and m.measurement_type_key='natural_waist'),
  81.280000::numeric,
  'Fit Report version 1 stores the original waist snapshot'
);
reset role;

-- From B's perspective, A initially matches the same qualified current body state.
-- Exact shared values do not imply 100 when relevant coverage is still incomplete.
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
set local request.jwt.claim.role = 'authenticated';
create temporary table phase15_scores(initial_score integer, changed_score integer) on commit drop;
insert into phase15_scores(initial_score)
select match_score from public.get_fit_matches('overall',100)
where user_id='44444444-4444-4444-8444-444444444444'::uuid;
select is((select initial_score from phase15_scores),85,'identical qualified partial current bodies are confidence-discounted to the calibrated Overall score');
reset role;

-- A changes current body state substantially; this must create v2 without touching report v1.
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'history_a','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":44,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"shoulder_width","entered_value":18,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);

select is(
  (select version_number from public.fit_profile_versions v join public.fit_profiles fp on fp.current_version_id=v.id where fp.user_id='44444444-4444-4444-8444-444444444444'::uuid),
  2,
  'changed current body creates Fit Profile version 2'
);
select is(
  (select value_canonical from public.fit_profile_version_measurements m join public.fit_profiles fp on fp.current_version_id=m.fit_profile_version_id where fp.user_id='44444444-4444-4444-8444-444444444444'::uuid and m.measurement_type_key='natural_waist'),
  111.760000::numeric,
  'current version 2 stores the changed waist snapshot'
);
select is(
  (select version_number from public.fit_profile_versions v join public.fit_reports r on r.fit_profile_version_id=v.id where r.id='99999999-9999-4999-8999-999999999999'::uuid),
  1,
  'old Fit Report remains attached to version 1 after current body changes'
);
select is(
  (select value_canonical from public.fit_profile_version_measurements m join public.fit_reports r on r.fit_profile_version_id=m.fit_profile_version_id where r.id='99999999-9999-4999-8999-999999999999'::uuid and m.measurement_type_key='natural_waist'),
  81.280000::numeric,
  'old Fit Report original waist snapshot remains unchanged'
);
select throws_like(
  $$update public.fit_reports
    set fit_profile_version_id=(select current_version_id from public.fit_profiles where user_id='44444444-4444-4444-8444-444444444444'::uuid)
    where id='99999999-9999-4999-8999-999999999999'::uuid$$,
  '%immutable%',
  'owner cannot rewrite an old Fit Report onto the new body version'
);

-- A can log a later observation for the same Closet item; it must lock to v2.
insert into public.fit_reports(id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again)
values(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid,
  '88888888-8888-4888-8888-888888888888'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  'M','snug',false
);
select is(
  (select version_number from public.fit_profile_versions v join public.fit_reports r on r.fit_profile_version_id=v.id where r.id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid),
  2,
  'new observation after the body change locks to version 2'
);
select is(
  (select count(*) from public.fit_reports where closet_item_id='88888888-8888-4888-8888-888888888888'::uuid),
  2::bigint,
  'one Closet item can retain both historical observations'
);
reset role;

-- B's current match to A must now use A v2, while historical report match still uses A v1.
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
set local request.jwt.claim.role = 'authenticated';
update phase15_scores
set changed_score=(select match_score from public.get_fit_matches('overall',100) where user_id='44444444-4444-4444-8444-444444444444'::uuid);
select ok(
  (select changed_score < initial_score from phase15_scores),
  'current-person Fit Match changes when wearer current body changes'
);
select is(
  (select historical_match_score from public.get_fit_report_snapshot_matches(array['99999999-9999-4999-8999-999999999999'::uuid]) limit 1),
  92,
  'old garment historical match retains the calibrated exact partial score against version 1'
);
select ok(
  (select historical_match_score from public.get_fit_report_snapshot_matches(array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid]) limit 1) < 92,
  'new garment observation historical match is lower after the version 2 body change'
);
select is(
  (select count(distinct fit_profile_version_id) from public.fit_reports where closet_item_id='88888888-8888-4888-8888-888888888888'::uuid),
  2::bigint,
  'historical observations preserve two distinct immutable body states'
);

reset role;
select * from finish();
rollback;
