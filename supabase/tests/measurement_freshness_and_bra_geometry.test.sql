begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;
select plan(21);

select is((select reconfirm_after_days from public.measurement_types where key='weight'),90,'weight reconfirm cadence is 90 days');
select is((select reconfirm_after_days from public.measurement_types where key='natural_waist'),180,'changeable circumference reconfirm cadence is 180 days');
select is((select reconfirm_after_days from public.measurement_types where key='height'),365,'structural measurement reconfirm cadence is 365 days');
select is(private.measurement_freshness_factor('weight',now()-interval '30 days',now()),1::numeric,'fresh measurement has no confidence discount');
select ok(private.measurement_freshness_factor('weight',now()-interval '120 days',now())<1,'past-due measurement can gently lower confidence');
select ok(private.measurement_freshness_factor('weight',now()-interval '400 days',now())>=.94,'very old weight retains the configured confidence floor');
select ok(private.measurement_freshness_factor('height',now()-interval '1000 days',now())>=.98,'structural measurements use a very mild confidence floor');
select ok((select weight from private.garment_match_measurements('bras_intimate') where measurement_type_key='bust_point_to_bust_point')>0,'bra matching already uses bust-point spacing as optional advanced evidence');
select ok((select weight from private.garment_match_measurements('bras_intimate') where measurement_type_key='shoulder_to_bust_point')>0,'bra matching already uses vertical bust position as optional advanced evidence');
select is((select minimum_coverage from public.match_profiles where key='bra'),.65000::numeric,'bra qualification remains centered on the existing core bust profile');
select ok((select coverage_weight from private.garment_match_measurements('bras_intimate') where measurement_type_key='bust_point_to_bust_point')<.10,'advanced bra geometry keeps a small optional coverage role');

insert into auth.users (id,aud,role,email,created_at,updated_at)
values ('66666666-6666-4666-8666-666666666666'::uuid,'authenticated','authenticated','freshness@likesized.test',now(),now());
set local role authenticated;
set local request.jwt.claim.sub = '66666666-6666-4666-8666-666666666666';
set local request.jwt.claim.role = 'authenticated';

select lives_ok($$select public.save_fit_profile(
  'freshness_test','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"device","method":"device"},{"measurement_type_key":"weight","entered_value":180,"entered_unit":"lb","source":"imported","method":"imported"}]'::jsonb,
  '[]'::jsonb,'[]'::jsonb)$$,'V1 Fit Profile save accepts body values while ignoring unsupported client provenance claims');
select is((select source::text from public.body_measurements where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='height'),'manual','V1 source is forced to manual');
select is((select method::text from public.body_measurements where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='height'),'tape','V1 length method is forced to tape');
select is((select method::text from public.body_measurements where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='weight'),'scale','V1 weight method is forced to scale');
select ok((select confirmed_at is not null from public.body_measurements where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='height'),'new measurement receives confirmation timestamp');

update public.body_measurements set confirmed_at=now()-interval '500 days' where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='height';
select lives_ok($$select public.save_fit_profile('freshness_test','imperial'::public.unit_system,'[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in"},{"measurement_type_key":"weight","entered_value":180,"entered_unit":"lb"}]'::jsonb,'[]'::jsonb,'[]'::jsonb)$$,'unchanged save succeeds without implicit reconfirmation');
select ok((select confirmed_at<now()-interval '400 days' from public.body_measurements where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='height'),'unchanged save preserves old confirmation timestamp');
select is((select count(*) from public.fit_profile_versions where user_id='66666666-6666-4666-8666-666666666666'),1::bigint,'unchanged save does not create another immutable body version');

select lives_ok($$select public.save_fit_profile('freshness_test','imperial'::public.unit_system,'[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","confirm_unchanged":true},{"measurement_type_key":"weight","entered_value":180,"entered_unit":"lb"}]'::jsonb,'[]'::jsonb,'[]'::jsonb)$$,'explicit Confirm unchanged succeeds');
select ok((select confirmed_at>now()-interval '5 minutes' from public.body_measurements where user_id='66666666-6666-4666-8666-666666666666' and measurement_type_key='height'),'Confirm unchanged refreshes confirmation timestamp');
select is((select count(*) from public.fit_profile_versions where user_id='66666666-6666-4666-8666-666666666666'),1::bigint,'confirmation-only refresh does not invent a new body-state version');

select * from finish();
rollback;
