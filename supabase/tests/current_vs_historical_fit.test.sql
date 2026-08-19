begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(10);

-- Two disposable members start with the same current body state.
insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('44444444-4444-4444-8444-444444444444'::uuid,'authenticated','authenticated','history-viewer@likesized.test',now(),now()),
  ('55555555-5555-4555-8555-555555555555'::uuid,'authenticated','authenticated','history-wearer@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'history_viewer','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'history_wearer','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

-- Create one Shared garment report for the wearer while version 1 is current.
insert into public.brands(id,name,slug,normalized_name)
values('66666666-6666-4666-8666-666666666666'::uuid,'History Test Brand','history-test-brand','history test brand');

insert into public.products(id,brand_id,name,slug,category,normalized_name)
values(
  '77777777-7777-4777-8777-777777777777'::uuid,
  '66666666-6666-4666-8666-666666666666'::uuid,
  'History Test Garment','history-test-garment','other'::public.garment_category,'history test garment'
);

insert into public.closet_items(id,user_id,product_id,size_label,visibility)
values(
  '88888888-8888-4888-8888-888888888888'::uuid,
  '55555555-5555-4555-8555-555555555555'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  'M','shared'::public.closet_visibility
);

insert into public.fit_reports(
  id,user_id,closet_item_id,product_id,size_label,fit,would_buy_again,fit_profile_version_id
)
select
  '99999999-9999-4999-8999-999999999999'::uuid,
  '55555555-5555-4555-8555-555555555555'::uuid,
  '88888888-8888-4888-8888-888888888888'::uuid,
  '77777777-7777-4777-8777-777777777777'::uuid,
  'M','just_right'::public.fit_rating,true,fp.current_version_id
from public.fit_profiles fp
where fp.user_id='55555555-5555-4555-8555-555555555555'::uuid;

-- Before the wearer changes, current-person and historical-report matches are both exact.
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claim.role = 'authenticated';

select is(
  (select match_score from public.get_fit_matches('overall'::public.fit_match_category,20) where user_id='55555555-5555-4555-8555-555555555555'::uuid),
  100,
  'current-person match starts at 100 for identical current bodies'
);

select is(
  (select historical_match_score from public.get_fit_report_snapshot_matches(array['99999999-9999-4999-8999-999999999999'::uuid])),
  100,
  'historical garment match starts at 100 against the report snapshot'
);

select is(
  (select fit_profile_version_id from public.fit_reports where id='99999999-9999-4999-8999-999999999999'::uuid),
  (select id from public.fit_profile_versions where user_id='55555555-5555-4555-8555-555555555555'::uuid and version_number=1),
  'the report is locked to wearer version 1'
);
reset role;

-- The wearer then changes current body measurements significantly.
set local role authenticated;
set local request.jwt.claim.sub = '55555555-5555-4555-8555-555555555555';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'history_wearer','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":76,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":44,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

select isnt(
  (select current_version_id from public.fit_profiles where user_id='55555555-5555-4555-8555-555555555555'::uuid),
  (select fit_profile_version_id from public.fit_reports where id='99999999-9999-4999-8999-999999999999'::uuid),
  'current body change creates a new version without moving the old report'
);

select is(
  (select count(*) from public.fit_profile_versions where user_id='55555555-5555-4555-8555-555555555555'::uuid),
  2::bigint,
  'wearer now has two immutable body versions'
);

-- Viewer sees the wearer current match change, but the old garment evidence remains tied to version 1.
set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';
set local request.jwt.claim.role = 'authenticated';

select ok(
  (select match_score from public.get_fit_matches('overall'::public.fit_match_category,20) where user_id='55555555-5555-4555-8555-555555555555'::uuid) < 100,
  'current-person match recalculates from the wearer current body and drops after the change'
);

select is(
  (select historical_match_score from public.get_fit_report_snapshot_matches(array['99999999-9999-4999-8999-999999999999'::uuid])),
  100,
  'old garment historical match remains based on the original snapshot after wearer body changes'
);

select is(
  (select historical_match_score from public.get_product_evidence_candidates('77777777-7777-4777-8777-777777777777'::uuid,null,20)
   where fit_report_id='99999999-9999-4999-8999-999999999999'::uuid),
  100,
  'product evidence also continues to score the old report against its historical snapshot'
);

select is(
  (select value_canonical from public.fit_profile_version_measurements m
   join public.fit_profile_versions v on v.id=m.fit_profile_version_id
   where v.user_id='55555555-5555-4555-8555-555555555555'::uuid
     and v.version_number=1
     and m.measurement_type_key='natural_waist'),
  81.280000::numeric,
  'version 1 retains the original 32-inch waist in canonical centimeters'
);

select throws_like(
  $$update public.fit_reports
    set fit_profile_version_id=(select current_version_id from public.fit_profiles where user_id='55555555-5555-4555-8555-555555555555'::uuid)
    where id='99999999-9999-4999-8999-999999999999'::uuid$$,
  '%Historical Fit Report garment/body association is immutable%',
  'an old report cannot be reassigned to the wearer newer current body version'
);

reset role;
select * from finish();
rollback;
