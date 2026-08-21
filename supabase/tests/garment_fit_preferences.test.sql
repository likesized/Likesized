begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(14);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
 ('c0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','preference-a@likesized.test',now(),now()),
 ('c0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','preference-b@likesized.test',now(),now());

select has_table('public','user_garment_fit_preferences','garment fit preferences use one canonical private table');
select has_column('public','user_garment_fit_preferences','preference','garment fit preference stores controlled preference values');

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='c0000000-0000-4000-8000-000000000001';

select lives_ok(
  $$select public.save_fit_profile(
    'preference_a',
    'imperial'::public.unit_system,
    '[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
    '[]'::jsonb,
    '[{"garment_type_key":"t_shirt","preference":"fitted"},{"garment_type_key":"hoodie","preference":"relaxed"}]'::jsonb
  )$$,
  'Fit Profile save atomically accepts garment-specific fit preferences'
);

select is(
  (select count(*) from public.user_garment_fit_preferences where user_id='c0000000-0000-4000-8000-000000000001'::uuid),
  2::bigint,
  'non-standard garment preferences persist'
);
select is(
  (select preference::text from public.user_garment_fit_preferences where user_id='c0000000-0000-4000-8000-000000000001'::uuid and garment_type_key='t_shirt'),
  'fitted',
  'T-shirt preference can be Fitted'
);
select is(
  (select preference::text from public.user_garment_fit_preferences where user_id='c0000000-0000-4000-8000-000000000001'::uuid and garment_type_key='hoodie'),
  'relaxed',
  'Hoodie preference can be Relaxed'
);
select is(
  (select count(*) from public.fit_profile_versions where user_id='c0000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'first save creates one immutable body-state version'
);

select lives_ok(
  $$select public.save_fit_profile(
    'preference_a',
    'imperial'::public.unit_system,
    '[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
    '[]'::jsonb,
    '[{"garment_type_key":"t_shirt","preference":"standard"},{"garment_type_key":"hoodie","preference":"relaxed"}]'::jsonb
  )$$,
  'changing only current fit preference succeeds without rewriting body history'
);
select is(
  (select count(*) from public.user_garment_fit_preferences where user_id='c0000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'Standard is stored sparsely as the absence of a preference row'
);
select is(
  (select count(*) from public.fit_profile_versions where user_id='c0000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'preference-only edits do not create a new immutable body-state version'
);
select ok(
  not exists(select 1 from public.user_garment_fit_preferences where user_id='c0000000-0000-4000-8000-000000000001'::uuid and garment_type_key='t_shirt'),
  'missing preference row means neutral Standard'
);

select throws_like(
  $$select public.save_fit_profile(
    'preference_a','imperial'::public.unit_system,
    '[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
    '[]'::jsonb,
    '[{"garment_type_key":"t_shirt","preference":"too_small"}]'::jsonb
  )$$,
  '%Invalid fit preference payload%',
  'failed-fit outcomes cannot be stored as personal fit preferences'
);
select throws_like(
  $$select public.save_fit_profile(
    'preference_a','imperial'::public.unit_system,
    '[{"measurement_type_key":"chest_circumference","entered_value":40,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
    '[]'::jsonb,
    '[{"garment_type_key":"not_a_real_garment","preference":"fitted"}]'::jsonb
  )$$,
  '%Invalid fit preference payload%',
  'preferences require a real active garment type'
);

reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='c0000000-0000-4000-8000-000000000002';
select is(
  (select count(*) from public.user_garment_fit_preferences where user_id='c0000000-0000-4000-8000-000000000001'::uuid),
  0::bigint,
  'another authenticated member cannot read private fit preferences'
);
reset role;

select * from finish();
rollback;
