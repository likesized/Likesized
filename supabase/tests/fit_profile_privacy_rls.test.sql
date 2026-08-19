begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(16);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('22222222-2222-4222-8222-222222222222'::uuid,'authenticated','authenticated','privacy-a@likesized.test',now(),now()),
  ('33333333-3333-4333-8333-333333333333'::uuid,'authenticated','authenticated','privacy-b@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'privacy_a','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":31,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[{"reference_type":"shoe","original_size_label":"US 8","sizing_system":"US","shoe_size":8}]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';
set local request.jwt.claim.role = 'authenticated';
select public.save_fit_profile(
  'privacy_b','imperial'::public.unit_system,
  '[
    {"measurement_type_key":"height","entered_value":72,"entered_unit":"in","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":36,"entered_unit":"in","source":"manual","method":"tape"}
  ]'::jsonb,
  '[{"reference_type":"bra","original_size_label":"38C","sizing_system":"US","band_size":38,"cup_designation":"C"}]'::jsonb
);
reset role;

-- Member A can read A's private state, but raw state belonging to B is filtered by RLS.
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claim.role = 'authenticated';

select is(
  (select count(*) from public.body_measurements where user_id='22222222-2222-4222-8222-222222222222'::uuid),
  2::bigint,
  'owner can read current raw body measurements'
);
select is(
  (select count(*) from public.body_measurements where user_id='33333333-3333-4333-8333-333333333333'::uuid),
  0::bigint,
  'another member current raw body measurements are hidden'
);
select is(
  (select count(*) from public.user_size_references where user_id='22222222-2222-4222-8222-222222222222'::uuid),
  1::bigint,
  'owner can read current private size references'
);
select is(
  (select count(*) from public.user_size_references where user_id='33333333-3333-4333-8333-333333333333'::uuid),
  0::bigint,
  'another member current private size references are hidden'
);
select is(
  (select count(*) from public.fit_profiles where user_id='22222222-2222-4222-8222-222222222222'::uuid),
  1::bigint,
  'owner can read own Fit Profile shell'
);
select is(
  (select count(*) from public.fit_profiles where user_id='33333333-3333-4333-8333-333333333333'::uuid),
  0::bigint,
  'another member Fit Profile shell is hidden'
);
select is(
  (select count(*) from public.fit_profile_versions where user_id='22222222-2222-4222-8222-222222222222'::uuid),
  1::bigint,
  'owner can read own immutable Fit Profile versions'
);
select is(
  (select count(*) from public.fit_profile_versions where user_id='33333333-3333-4333-8333-333333333333'::uuid),
  0::bigint,
  'another member immutable Fit Profile versions are hidden'
);
select is(
  (select count(*) from public.fit_profile_version_measurements),
  2::bigint,
  'historical raw measurement rows expose only the owner rows'
);
select is(
  (select count(*) from public.fit_profile_version_size_references),
  1::bigint,
  'historical private size-reference rows expose only the owner rows'
);
select is(
  (select count(*) from public.profiles where id='33333333-3333-4333-8333-333333333333'::uuid and username='privacy_b'),
  1::bigint,
  'signed-in members can discover another completed member identity'
);
select throws_like(
  $$insert into public.body_measurements(user_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method)
    values('33333333-3333-4333-8333-333333333333'::uuid,'weight',150,'lb',68,'manual','scale')$$,
  '%row-level security%',
  'a member cannot write another member raw body measurement'
);
select lives_ok(
  $$delete from public.user_size_references
    where user_id='33333333-3333-4333-8333-333333333333'::uuid$$,
  'cross-user delete runs only against rows visible through RLS'
);

reset role;

select is(
  (select count(*) from public.user_size_references where user_id='33333333-3333-4333-8333-333333333333'::uuid),
  1::bigint,
  'other member private size reference survives attempted cross-user delete'
);

select ok(
  not has_table_privilege('anon','public.profiles','SELECT'),
  'anonymous role has no SELECT privilege on member profiles'
);

set local role anon;
set local request.jwt.claim.role = 'anon';
select throws_like(
  $$select count(*) from public.profiles$$,
  '%permission denied%',
  'anonymous visitors cannot query member profile identity'
);

reset role;
select * from finish();
rollback;
