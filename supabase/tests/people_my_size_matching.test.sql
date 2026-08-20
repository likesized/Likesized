begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;
select plan(18);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('b0000000-0000-4000-8000-000000000001','authenticated','authenticated','match-viewer@likesized.test',now(),now()),
('b0000000-0000-4000-8000-000000000002','authenticated','authenticated','match-exact@likesized.test',now(),now()),
('b0000000-0000-4000-8000-000000000003','authenticated','authenticated','match-near@likesized.test',now(),now()),
('b0000000-0000-4000-8000-000000000004','authenticated','authenticated','match-sparse@likesized.test',now(),now()),
('b0000000-0000-4000-8000-000000000005','authenticated','authenticated','match-skirt@likesized.test',now(),now()),
('b0000000-0000-4000-8000-000000000006','authenticated','authenticated','match-stated@likesized.test',now(),now());

update public.profiles set username=case id
 when 'b0000000-0000-4000-8000-000000000001'::uuid then 'match_viewer'
 when 'b0000000-0000-4000-8000-000000000002'::uuid then 'match_exact'
 when 'b0000000-0000-4000-8000-000000000003'::uuid then 'match_near'
 when 'b0000000-0000-4000-8000-000000000004'::uuid then 'match_sparse'
 when 'b0000000-0000-4000-8000-000000000005'::uuid then 'match_skirt'
 when 'b0000000-0000-4000-8000-000000000006'::uuid then 'match_stated' end
where id between 'b0000000-0000-4000-8000-000000000001'::uuid and 'b0000000-0000-4000-8000-000000000006'::uuid;

insert into public.fit_profiles(user_id,preferred_unit_system,completed_at)
select id,'metric',now() from auth.users where id between 'b0000000-0000-4000-8000-000000000001'::uuid and 'b0000000-0000-4000-8000-000000000006'::uuid;

create temporary table match_baseline(
 measurement_type_key text primary key,
 entered_value numeric,
 entered_unit public.measurement_unit,
 method public.measurement_method
);
insert into match_baseline values
('height',178,'cm','tape'),('weight',82,'kg','scale'),
('chest_circumference',102,'cm','tape'),('full_bust',102,'cm','tape'),('high_bust',96,'cm','tape'),('underbust',88,'cm','tape'),
('natural_waist',86,'cm','tape'),('lower_pants_waist',89,'cm','tape'),('high_hip',97,'cm','tape'),('full_hip_seat',102,'cm','tape'),('waist_to_hip_length',20,'cm','tape'),
('inseam',81,'cm','tape'),('outseam',106,'cm','tape'),
('shoulder_width',46,'cm','tape'),('individual_shoulder_length',14,'cm','tape'),('torso_body_length',61,'cm','tape'),('torso_girth',155,'cm','tape'),
('bust_point_to_bust_point',20,'cm','tape'),('shoulder_to_bust_point',28,'cm','tape'),('front_waist_length',43,'cm','tape'),('back_waist_length',42,'cm','tape'),('shoulder_to_waist',44,'cm','tape'),
('across_back_width',40,'cm','tape'),('across_front_chest_width',38,'cm','tape'),
('arm_sleeve_length',64,'cm','tape'),('bicep_upper_arm',34,'cm','tape'),('elbow_circumference',29,'cm','tape'),('wrist_circumference',18,'cm','tape'),('neck_collar_circumference',40,'cm','tape'),
('thigh_circumference',61,'cm','tape'),('knee_circumference',40,'cm','tape'),('calf_circumference',38,'cm','tape'),
('front_rise',28,'cm','tape'),('back_rise',36,'cm','tape'),('crotch_depth',25,'cm','tape'),('total_crotch_length',70,'cm','tape'),
('foot_length',27,'cm','tape'),('foot_width',10,'cm','tape');

-- Viewer and exact twin share a complete, high-quality body state.
insert into public.body_measurements(user_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method)
select u.id,b.measurement_type_key,b.entered_value,b.entered_unit,b.entered_value,'manual',b.method
from (values('b0000000-0000-4000-8000-000000000001'::uuid),('b0000000-0000-4000-8000-000000000002'::uuid)) u(id)
cross join match_baseline b;

-- Near twin differs by one canonical unit on every measurement.
insert into public.body_measurements(user_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method)
select 'b0000000-0000-4000-8000-000000000003'::uuid,b.measurement_type_key,b.entered_value+1,b.entered_unit,b.entered_value+1,'manual',b.method
from match_baseline b;

-- Sparse twin used to be able to appear as 100% because the one shared chest value was exact.
insert into public.body_measurements(user_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method)
values('b0000000-0000-4000-8000-000000000004','chest_circumference',102,'cm',102,'manual','tape');

-- Skirt twin is exact on skirt-relevant dimensions but deliberately wrong on inseam/rise.
insert into public.body_measurements(user_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method)
select 'b0000000-0000-4000-8000-000000000005'::uuid,b.measurement_type_key,
 case b.measurement_type_key when 'inseam' then 120 when 'front_rise' then 55 when 'back_rise' then 75 else b.entered_value end,
 b.entered_unit,
 case b.measurement_type_key when 'inseam' then 120 when 'front_rise' then 55 when 'back_rise' then 75 else b.entered_value end,
 'manual',b.method from match_baseline b;

-- Same numbers but lower-confidence stated provenance must not receive a perfect score.
insert into public.body_measurements(user_id,measurement_type_key,entered_value,entered_unit,value_canonical,source,method)
select 'b0000000-0000-4000-8000-000000000006'::uuid,b.measurement_type_key,b.entered_value,b.entered_unit,b.entered_value,'manual','stated'
from match_baseline b;

set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';

create temporary table m_overall as select row_number() over() rank_position,* from public.get_fit_matches('overall',100);
create temporary table m_tops as select row_number() over() rank_position,* from public.get_fit_matches('tops',100);
create temporary table m_bottoms as select row_number() over() rank_position,* from public.get_fit_matches('bottoms',100);
create temporary table m_tee as select row_number() over() rank_position,* from public.get_garment_fit_matches('t_shirt',100);
create temporary table m_jeans as select row_number() over() rank_position,* from public.get_garment_fit_matches('jeans',100);
create temporary table m_skirt as select row_number() over() rank_position,* from public.get_garment_fit_matches('skirts',100);

select is((select match_score from m_overall where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete exact twin can score 100 overall');
select is((select match_score from m_tops where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete exact twin can score 100 on tops');
select is((select match_score from m_bottoms where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete exact twin can score 100 on bottoms');
select is((select match_score from m_tee where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete exact twin can score 100 for a T-shirt including advanced relevant dimensions');
select is((select match_score from m_jeans where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete exact twin can score 100 for jeans including advanced relevant dimensions');
select is((select rank_position from m_overall where user_id='b0000000-0000-4000-8000-000000000002'),1::bigint,'complete exact twin ranks first');
select ok((select match_score from m_overall where user_id='b0000000-0000-4000-8000-000000000003') between 80 and 99,'near complete twin remains a strong but non-perfect match');
select is((select count(*) from m_overall where user_id='b0000000-0000-4000-8000-000000000004'),0::bigint,'one exact shared measurement cannot qualify as an Overall Fit Twin');
select is((select count(*) from m_tee where user_id='b0000000-0000-4000-8000-000000000004'),0::bigint,'one exact shared chest measurement cannot qualify as a T-shirt Fit Twin');
select ok((select match_score from m_overall where user_id='b0000000-0000-4000-8000-000000000006') < 100,'lower-confidence stated measurements cannot produce a perfect Match score');
select ok((select match_score from m_overall where user_id='b0000000-0000-4000-8000-000000000006') >= 70,'reliability discount remains conservative instead of discarding useful stated evidence');
select is((select match_score from m_skirt where user_id='b0000000-0000-4000-8000-000000000005'),100,'skirt matching ignores deliberately wrong inseam/rise values');
select ok((select match_score from m_jeans where user_id='b0000000-0000-4000-8000-000000000005') < 100,'the same wrong inseam/rise values correctly reduce a jeans match');
select is((select coverage_percent from m_tee where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete T-shirt evidence reports 100 percent garment-specific coverage');
select is((select coverage_percent from m_jeans where user_id='b0000000-0000-4000-8000-000000000002'),100,'complete jeans evidence reports 100 percent garment-specific coverage');
select is((select count(*) from public.body_measurements where user_id<>'b0000000-0000-4000-8000-000000000001'),0::bigint,'viewer still cannot read any candidate raw measurements');

-- Current-person scores must react immediately to changed current body data and only in relevant profiles.
reset role;
update public.body_measurements set entered_value=entered_value+25,value_canonical=value_canonical+25
where user_id='b0000000-0000-4000-8000-000000000003'
and measurement_type_key in ('chest_circumference','full_bust','shoulder_width','torso_body_length','arm_sleeve_length');

set local role authenticated;
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
create temporary table m_tops_after as select * from public.get_fit_matches('tops',100);
create temporary table m_bottoms_after as select * from public.get_fit_matches('bottoms',100);
select ok((select match_score from m_tops_after where user_id='b0000000-0000-4000-8000-000000000003') < (select match_score from m_tops where user_id='b0000000-0000-4000-8000-000000000003'),'top-relevant body changes immediately lower the Tops score');
select is((select match_score from m_bottoms_after where user_id='b0000000-0000-4000-8000-000000000003'),(select match_score from m_bottoms where user_id='b0000000-0000-4000-8000-000000000003'),'top-only body changes do not alter the Bottoms score');

reset role;
select * from finish();
rollback;
