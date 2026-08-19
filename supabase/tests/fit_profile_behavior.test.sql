begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(20);

-- Disposable local test identity. The canonical auth trigger must create its profile shell.
insert into auth.users (id, aud, role, email, created_at, updated_at)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'authenticated',
  'authenticated',
  'phase1-behavior@likesized.test',
  now(),
  now()
);

select ok(
  exists(select 1 from public.profiles where id='11111111-1111-4111-8111-111111111111'::uuid),
  'auth user creation creates the canonical profile shell'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim.role = 'authenticated';

select lives_ok(
  $$select public.save_fit_profile(
    'phase1_behavior',
    'imperial'::public.unit_system,
    '[
      {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
      {"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"}
    ]'::jsonb,
    '[
      {"reference_type":"bra","original_size_label":"36D","sizing_system":"US","band_size":36,"cup_designation":"D"},
      {"reference_type":"shoe","original_size_label":"US 9","sizing_system":"US","shoe_size":9},
      {"reference_type":"shirt","original_size_label":"XL"}
    ]'::jsonb
  )$$,
  'a partial imperial Fit Profile with structured and generic private size references saves atomically'
);

select is(
  (select count(*) from public.body_measurements where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  2::bigint,
  'partial Fit Profiles persist only supplied measurements'
);

select is(
  (select count(*) from public.fit_profile_versions where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  1::bigint,
  'first save creates one immutable Fit Profile version'
);

select is(
  (select count(*) from public.user_size_references where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  3::bigint,
  'structured and generic private size references save in the same transaction'
);

select is(
  (select normalized_value from public.user_size_references where user_id='11111111-1111-4111-8111-111111111111'::uuid and reference_type='shirt'),
  'xl',
  'generic private size references normalize without exposing the general normalizer helper'
);

select lives_ok(
  $$select public.save_fit_profile(
    'phase1_behavior',
    'imperial'::public.unit_system,
    '[
      {"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},
      {"measurement_type_key":"natural_waist","entered_value":32,"entered_unit":"in","source":"manual","method":"tape"}
    ]'::jsonb,
    '[
      {"reference_type":"bra","original_size_label":"36D","sizing_system":"US","band_size":36,"cup_designation":"D"},
      {"reference_type":"shoe","original_size_label":"US 9","sizing_system":"US","shoe_size":9},
      {"reference_type":"shirt","original_size_label":"XL"}
    ]'::jsonb
  )$$,
  'saving the identical Fit Profile again succeeds'
);

select is(
  (select count(*) from public.fit_profile_versions where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  1::bigint,
  'an unchanged body and size-reference state reuses the immutable version'
);

select lives_ok(
  $$select public.save_fit_profile(
    'phase1_behavior',
    'metric'::public.unit_system,
    '[
      {"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"},
      {"measurement_type_key":"natural_waist","entered_value":81.5,"entered_unit":"cm","source":"manual","method":"tape"}
    ]'::jsonb,
    '[
      {"reference_type":"bra","original_size_label":"36D","sizing_system":"US","band_size":36,"cup_designation":"D"},
      {"reference_type":"shoe","original_size_label":"US 9","sizing_system":"US","shoe_size":9},
      {"reference_type":"shirt","original_size_label":"XL"}
    ]'::jsonb
  )$$,
  'metric edits save with metric entered units rather than reinterpreting imperial values'
);

select is(
  (select count(*) from public.fit_profile_versions where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  2::bigint,
  'a changed normalized body state creates a new immutable version'
);

select is(
  (select preferred_unit_system::text from public.fit_profiles where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  'metric',
  'preferred unit system updates with the edit'
);

select is(
  (select entered_unit::text from public.body_measurements where user_id='11111111-1111-4111-8111-111111111111'::uuid and measurement_type_key='height'),
  'cm',
  'metric height remains explicitly stored as centimeters at the input layer'
);

select is(
  (select value_canonical from public.body_measurements where user_id='11111111-1111-4111-8111-111111111111'::uuid and measurement_type_key='height'),
  178.000000::numeric,
  'metric height normalizes to the correct canonical value'
);

select lives_ok(
  $$select public.save_fit_profile(
    'phase1_behavior',
    'metric'::public.unit_system,
    '[{"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,
    '[]'::jsonb
  )$$,
  'editing to a smaller partial profile succeeds'
);

select is(
  (select count(*) from public.body_measurements where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  1::bigint,
  'removed measurements are removed from the current Fit Profile'
);

select is(
  (select count(*) from public.user_size_references where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  0::bigint,
  'removed private size references are removed from the current Fit Profile'
);

select is(
  (select count(*) from public.fit_profile_versions where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  3::bigint,
  'removing current measurements/references creates a distinct immutable version'
);

select lives_ok(
  $$select public.save_fit_profile(
    'phase1_behavior',
    'metric'::public.unit_system,
    '[{"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,
    '[]'::jsonb
  )$$,
  're-saving the same reduced profile succeeds'
);

select is(
  (select count(*) from public.fit_profile_versions where user_id='11111111-1111-4111-8111-111111111111'::uuid),
  3::bigint,
  'unchanged reduced state does not create duplicate history'
);

select is(
  (select count(*)
   from public.fit_profile_version_measurements m
   join public.fit_profile_versions v on v.id=m.fit_profile_version_id
   where v.user_id='11111111-1111-4111-8111-111111111111'::uuid and v.version_number=1),
  2::bigint,
  'the original immutable version still retains its original two measurements'
);

select is(
  (select count(*)
   from public.fit_profile_version_measurements m
   join public.fit_profiles fp on fp.current_version_id=m.fit_profile_version_id
   where fp.user_id='11111111-1111-4111-8111-111111111111'::uuid),
  1::bigint,
  'the current immutable version reflects only the current reduced measurement set'
);

select * from finish();
rollback;
