begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(13);

-- Viewer plus four controlled candidates. Each test transaction rolls back.
insert into auth.users (id,aud,role,email,created_at,updated_at)
values
  ('b0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','match-viewer@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','match-close@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','match-tops@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000004'::uuid,'authenticated','authenticated','match-bottoms@likesized.test',now(),now()),
  ('b0000000-0000-4000-8000-000000000005'::uuid,'authenticated','authenticated','match-partial@likesized.test',now(),now());

-- Viewer baseline contains every measurement used by overall/tops_default/bottoms_default.
set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('match_viewer','metric',
'[
 {"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"weight","entered_value":82,"entered_unit":"kg","source":"manual","method":"scale"},
 {"measurement_type_key":"chest_circumference","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_bust","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"natural_waist","entered_value":86,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_hip_seat","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"shoulder_width","entered_value":46,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"inseam","entered_value":81,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"torso_body_length","entered_value":61,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"arm_sleeve_length","entered_value":64,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"lower_pants_waist","entered_value":86,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"high_hip","entered_value":97,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"thigh_circumference","entered_value":61,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"front_rise","entered_value":28,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"back_rise","entered_value":36,"entered_unit":"cm","source":"manual","method":"tape"}
]'::jsonb,'[]'::jsonb);
reset role;

-- Close across the whole body: every measurement is only 1 cm away.
set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('match_close','metric',
'[
 {"measurement_type_key":"height","entered_value":179,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"weight","entered_value":83,"entered_unit":"kg","source":"manual","method":"scale"},
 {"measurement_type_key":"chest_circumference","entered_value":103,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_bust","entered_value":103,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"natural_waist","entered_value":87,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_hip_seat","entered_value":103,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"shoulder_width","entered_value":47,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"inseam","entered_value":82,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"torso_body_length","entered_value":62,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"arm_sleeve_length","entered_value":65,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"lower_pants_waist","entered_value":87,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"high_hip","entered_value":98,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"thigh_circumference","entered_value":62,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"front_rise","entered_value":29,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"back_rise","entered_value":37,"entered_unit":"cm","source":"manual","method":"tape"}
]'::jsonb,'[]'::jsonb);
reset role;

-- Tops twin: exact upper body + height/weight/waist, deliberately far on bottom-only dimensions.
set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('match_tops','metric',
'[
 {"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"weight","entered_value":82,"entered_unit":"kg","source":"manual","method":"scale"},
 {"measurement_type_key":"chest_circumference","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_bust","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"natural_waist","entered_value":86,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_hip_seat","entered_value":130,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"shoulder_width","entered_value":46,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"inseam","entered_value":100,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"torso_body_length","entered_value":61,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"arm_sleeve_length","entered_value":64,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"lower_pants_waist","entered_value":115,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"high_hip","entered_value":125,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"thigh_circumference","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"front_rise","entered_value":40,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"back_rise","entered_value":50,"entered_unit":"cm","source":"manual","method":"tape"}
]'::jsonb,'[]'::jsonb);
reset role;

-- Bottoms twin: exact lower body + height/weight, deliberately far on top-only dimensions.
set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000004';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('match_bottoms','metric',
'[
 {"measurement_type_key":"height","entered_value":178,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"weight","entered_value":82,"entered_unit":"kg","source":"manual","method":"scale"},
 {"measurement_type_key":"chest_circumference","entered_value":140,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_bust","entered_value":140,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"natural_waist","entered_value":86,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"full_hip_seat","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"shoulder_width","entered_value":60,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"inseam","entered_value":81,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"torso_body_length","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"arm_sleeve_length","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"lower_pants_waist","entered_value":86,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"high_hip","entered_value":97,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"thigh_circumference","entered_value":61,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"front_rise","entered_value":28,"entered_unit":"cm","source":"manual","method":"tape"},
 {"measurement_type_key":"back_rise","entered_value":36,"entered_unit":"cm","source":"manual","method":"tape"}
]'::jsonb,'[]'::jsonb);
reset role;

-- Partial profile deliberately shares only chest. Score can be high, but coverage must be low.
set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000005';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('match_partial','metric',
'[{"measurement_type_key":"chest_circumference","entered_value":102,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,
'[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';

create temporary table p2_overall as select row_number() over() as rank_position,* from public.get_fit_matches('overall',100);
create temporary table p2_tops as select row_number() over() as rank_position,* from public.get_fit_matches('tops',100);
create temporary table p2_bottoms as select row_number() over() as rank_position,* from public.get_fit_matches('bottoms',100);
create temporary table p2_tee as select row_number() over() as rank_position,* from public.get_garment_fit_matches('t_shirt',100);
create temporary table p2_jeans as select row_number() over() as rank_position,* from public.get_garment_fit_matches('jeans',100);

select ok(
  (select match_score from p2_overall where user_id='b0000000-0000-4000-8000-000000000002'::uuid) >
  (select match_score from p2_overall where user_id='b0000000-0000-4000-8000-000000000003'::uuid),
  'close whole-body candidate outranks the tops-only twin for Overall match'
);
select ok(
  (select match_score from p2_overall where user_id='b0000000-0000-4000-8000-000000000003'::uuid) >
  (select match_score from p2_overall where user_id='b0000000-0000-4000-8000-000000000004'::uuid),
  'tops twin still outranks the bottoms twin on the weighted Overall profile'
);

select is((select match_score from p2_tops where user_id='b0000000-0000-4000-8000-000000000003'::uuid),100,'tops twin scores 100 on Tops');
select ok(
  (select match_score from p2_tops where user_id='b0000000-0000-4000-8000-000000000003'::uuid) >
  (select match_score from p2_tops where user_id='b0000000-0000-4000-8000-000000000004'::uuid),
  'tops twin outranks bottoms twin on Tops'
);

select is((select match_score from p2_bottoms where user_id='b0000000-0000-4000-8000-000000000004'::uuid),100,'bottoms twin scores 100 on Bottoms');
select ok(
  (select match_score from p2_bottoms where user_id='b0000000-0000-4000-8000-000000000004'::uuid) >
  (select match_score from p2_bottoms where user_id='b0000000-0000-4000-8000-000000000003'::uuid),
  'bottoms twin outranks tops twin on Bottoms'
);

select is((select match_score from p2_tee where user_id='b0000000-0000-4000-8000-000000000005'::uuid),100,'partial exact chest can score 100 on the shared Tops evidence');
select is((select coverage_percent from p2_tee where user_id='b0000000-0000-4000-8000-000000000005'::uuid),22,'partial chest-only Tops profile reports 22 percent coverage');
select is((select coverage_percent from p2_tee where user_id='b0000000-0000-4000-8000-000000000003'::uuid),100,'complete tops twin reports 100 percent Tops coverage');
select ok(
  (select rank_position from p2_tee where user_id='b0000000-0000-4000-8000-000000000003'::uuid) <
  (select rank_position from p2_tee where user_id='b0000000-0000-4000-8000-000000000005'::uuid),
  'when score ties at 100, complete evidence ranks ahead of low-coverage partial evidence'
);

select is((select coverage_percent from p2_jeans where user_id='b0000000-0000-4000-8000-000000000004'::uuid),100,'bottoms twin reports 100 percent jeans-profile coverage');
select is((select count(*) from p2_jeans where user_id='b0000000-0000-4000-8000-000000000005'::uuid),0::bigint,'partial chest-only member is absent from Bottoms because there is no shared relevant measurement');
select is((select count(*) from public.body_measurements where user_id<>'b0000000-0000-4000-8000-000000000001'::uuid),0::bigint,'viewer cannot read any candidate raw body measurements while matching them');

reset role;
select * from finish();
rollback;
