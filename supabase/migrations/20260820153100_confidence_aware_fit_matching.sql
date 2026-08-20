-- LikeSized canonical migration: confidence-aware fit matching engine
-- This is the single deterministic V1 matcher. It is deliberately configurable so
-- observed LikeSized fit outcomes can calibrate weights/tolerances later without
-- creating a parallel algorithm.

alter table public.match_profiles
  add column if not exists minimum_shared_measurements smallint not null default 2
    check (minimum_shared_measurements > 0),
  add column if not exists minimum_coverage numeric(6,5) not null default 0.30
    check (minimum_coverage > 0 and minimum_coverage <= 1);

alter table public.match_profile_measurements
  add column if not exists coverage_weight numeric(8,6);
update public.match_profile_measurements set coverage_weight=weight where coverage_weight is null;
alter table public.match_profile_measurements alter column coverage_weight set not null;
alter table public.match_profile_measurements drop constraint if exists match_profile_measurements_coverage_weight_check;
alter table public.match_profile_measurements add constraint match_profile_measurements_coverage_weight_check check (coverage_weight >= 0);

update public.match_profiles set minimum_shared_measurements=3,minimum_coverage=.35 where key='overall';
update public.match_profiles set minimum_shared_measurements=2,minimum_coverage=.35 where key in ('tops_default','bottoms_default','work_shirt');
update public.match_profiles set minimum_shared_measurements=3,minimum_coverage=.40 where key in ('dresses_default','one_piece');
update public.match_profiles set minimum_shared_measurements=2,minimum_coverage=.65 where key='bra';
update public.match_profiles set minimum_shared_measurements=1,minimum_coverage=.70 where key='shoes';

-- Similarity importance and evidence coverage are separate. Core measurements carry
-- most coverage; optional advanced measurements can improve precision without making
-- a useful core-only Fit Profile look empty.
delete from public.match_profile_measurements where profile_key in
('overall','tops_default','bottoms_default','dresses_default','work_shirt','bra','one_piece','shoes');
insert into public.match_profile_measurements(profile_key,measurement_type_key,weight,tolerance_override_canonical,coverage_weight) values
('overall','height',.08,null,.07),('overall','weight',.04,null,.03),('overall','chest_circumference',.13,null,.11),('overall','full_bust',.13,null,.11),('overall','natural_waist',.14,null,.15),('overall','full_hip_seat',.14,null,.15),('overall','inseam',.09,null,.10),('overall','shoulder_width',.10,null,.11),('overall','torso_body_length',.08,null,.11),('overall','arm_sleeve_length',.07,null,.06),
('tops_default','chest_circumference',.22,null,.23),('tops_default','full_bust',.22,null,.23),('tops_default','shoulder_width',.20,null,.21),('tops_default','torso_body_length',.14,null,.14),('tops_default','arm_sleeve_length',.12,null,.08),('tops_default','natural_waist',.10,null,.11),
('bottoms_default','natural_waist',.10,null,.17),('bottoms_default','lower_pants_waist',.22,null,.12),('bottoms_default','high_hip',.12,null,.06),('bottoms_default','full_hip_seat',.22,null,.26),('bottoms_default','thigh_circumference',.12,null,.08),('bottoms_default','inseam',.12,null,.17),('bottoms_default','front_rise',.05,null,.07),('bottoms_default','back_rise',.05,null,.07),
('dresses_default','full_bust',.22,null,.22),('dresses_default','chest_circumference',.10,null,.10),('dresses_default','natural_waist',.20,null,.20),('dresses_default','full_hip_seat',.20,null,.20),('dresses_default','shoulder_width',.10,null,.11),('dresses_default','torso_body_length',.10,null,.10),('dresses_default','height',.08,null,.07),
('work_shirt','neck_collar_circumference',.20,null,.12),('work_shirt','chest_circumference',.22,null,.23),('work_shirt','shoulder_width',.20,null,.21),('work_shirt','arm_sleeve_length',.18,null,.13),('work_shirt','torso_body_length',.12,null,.15),('work_shirt','natural_waist',.08,null,.16),
('bra','full_bust',.40,null,.35),('bra','underbust',.40,null,.35),('bra','high_bust',.20,null,.30),
('one_piece','torso_girth',.25,null,.15),('one_piece','full_bust',.18,null,.18),('one_piece','chest_circumference',.10,null,.10),('one_piece','natural_waist',.17,null,.18),('one_piece','full_hip_seat',.18,null,.20),('one_piece','height',.12,null,.19),
('shoes','foot_length',.70,null,.78),('shoes','foot_width',.30,null,.22);

-- Garment-type refinements layer on the base match profile. Multipliers can remove a
-- base dimension; extra weights add advanced dimensions only where they actually help.
create table public.garment_type_match_adjustments(
  garment_type_key text not null references public.garment_types(key) on delete cascade,
  measurement_type_key text not null references public.measurement_types(key),
  weight_multiplier numeric(8,4) not null default 1 check(weight_multiplier>=0),
  coverage_multiplier numeric(8,4) not null default 1 check(coverage_multiplier>=0),
  tolerance_multiplier numeric(8,4) not null default 1 check(tolerance_multiplier>0),
  extra_weight numeric(8,6) not null default 0 check(extra_weight>=0),
  extra_coverage_weight numeric(8,6) not null default 0 check(extra_coverage_weight>=0),
  primary key(garment_type_key,measurement_type_key)
);

alter table public.garment_types
  add column if not exists minimum_shared_measurements_override smallint check(minimum_shared_measurements_override is null or minimum_shared_measurements_override>0),
  add column if not exists minimum_coverage_override numeric(6,5) check(minimum_coverage_override is null or (minimum_coverage_override>0 and minimum_coverage_override<=1));

-- T-shirts/polos: sleeve length is weak by default; upper-arm fit adds useful detail.
insert into public.garment_type_match_adjustments
select g,'arm_sleeve_length',.35,.35,1.10,0,0 from unnest(array['t_shirt','polo']) g;
insert into public.garment_type_match_adjustments
select g,'bicep_upper_arm',1,1,1,0.05,0.04 from unnest(array['t_shirt','polo']) g;

-- Sleeveless tops: sleeve length is irrelevant; shoulder/armhole-region dimensions matter.
insert into public.garment_type_match_adjustments
select g,'arm_sleeve_length',0,0,1,0,0 from unnest(array['tank','camisole']) g;
insert into public.garment_type_match_adjustments
select g,'shoulder_width',1.10,1.08,.96,0,0 from unnest(array['tank','camisole']) g;
insert into public.garment_type_match_adjustments
select g,'individual_shoulder_length',1,1,1,0.05,0.04 from unnest(array['tank','camisole']) g;
insert into public.garment_type_match_adjustments
select g,'across_front_chest_width',1,1,1,0.05,0.03 from unnest(array['tank','camisole']) g;
insert into public.garment_type_match_adjustments
select g,'across_back_width',1,1,1,0.04,0.03 from unnest(array['tank','camisole']) g;

-- Button/work shirts add collar/shoulder/arm detail beyond the base work-shirt profile.
insert into public.garment_type_match_adjustments
select g,'individual_shoulder_length',1,1,1,0.04,0.03 from unnest(array['dress_shirt','work_shirt','casual_button_down']) g;
insert into public.garment_type_match_adjustments
select g,'bicep_upper_arm',1,1,1,0.05,0.04 from unnest(array['dress_shirt','work_shirt','casual_button_down']) g;
insert into public.garment_type_match_adjustments
select g,'elbow_circumference',1,1,1,0.03,0.02 from unnest(array['dress_shirt','work_shirt','casual_button_down']) g;
insert into public.garment_type_match_adjustments
select g,'across_back_width',1,1,1,0.03,0.02 from unnest(array['dress_shirt','work_shirt','casual_button_down']) g;

-- Blouses use bust shaping and front/back upper-body geometry.
insert into public.garment_type_match_adjustments values
('blouse','individual_shoulder_length',1,1,1,.04,.03),('blouse','bust_point_to_bust_point',1,1,1,.04,.03),('blouse','shoulder_to_bust_point',1,1,1,.04,.03),('blouse','across_front_chest_width',1,1,1,.04,.03),('blouse','across_back_width',1,1,1,.04,.03);

-- Knit layers benefit from arm circumference without making it core-required.
insert into public.garment_type_match_adjustments
select g,'bicep_upper_arm',1,1,1.05,.06,.04 from unnest(array['sweater','sweatshirt','hoodie']) g;
insert into public.garment_type_match_adjustments
select g,'elbow_circumference',1,1,1.05,.03,.02 from unnest(array['sweater','sweatshirt','hoodie']) g;
insert into public.garment_type_match_adjustments
select g,'wrist_circumference',1,1,1.05,.03,.02 from unnest(array['sweater','sweatshirt','hoodie']) g;

-- Long bottoms add leg-shape and crotch geometry as refinement signals.
insert into public.garment_type_match_adjustments
select g,'knee_circumference',1,1,1,.035,.02 from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','joggers']) g;
insert into public.garment_type_match_adjustments
select g,'calf_circumference',1,1,1,.025,.015 from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','joggers']) g;
insert into public.garment_type_match_adjustments
select g,'outseam',1,1,1,.025,.02 from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','joggers']) g;
insert into public.garment_type_match_adjustments
select g,'crotch_depth',1,1,1,.035,.025 from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','joggers']) g;
insert into public.garment_type_match_adjustments
select g,'total_crotch_length',1,1,1,.04,.03 from unnest(array['jeans','chinos','dress_pants','trousers','work_pants','joggers']) g;

-- Shorts explicitly do not use inseam as a body-length proxy.
insert into public.garment_type_match_adjustments values
('shorts','inseam',0,0,1,0,0),('shorts','thigh_circumference',1.15,1.10,.96,0,0),('shorts','front_rise',1.15,1.10,.96,0,0),('shorts','back_rise',1.15,1.10,.96,0,0),('shorts','crotch_depth',1,1,1,.05,.035),('shorts','total_crotch_length',1,1,1,.06,.04),('shorts','outseam',1,1,1,.04,.03);

-- Leggings are close-fit lower-body garments; knee/calf/crotch details matter more.
insert into public.garment_type_match_adjustments values
('leggings','full_hip_seat',1.20,1.15,.92,0,0),('leggings','thigh_circumference',1.25,1.18,.90,0,0),('leggings','front_rise',1.10,1.08,.96,0,0),('leggings','back_rise',1.10,1.08,.96,0,0),('leggings','knee_circumference',1,1,1,.05,.03),('leggings','calf_circumference',1,1,1,.04,.025),('leggings','crotch_depth',1,1,1,.04,.025),('leggings','total_crotch_length',1,1,1,.05,.03);

-- Skirts remove inseam/rise dependence and emphasize waist-to-hip and skirt length.
insert into public.garment_type_match_adjustments values
('skirts','inseam',0,0,1,0,0),('skirts','front_rise',0,0,1,0,0),('skirts','back_rise',0,0,1,0,0),('skirts','thigh_circumference',.40,.40,1.15,0,0),('skirts','lower_pants_waist',.60,.60,1.10,0,0),('skirts','natural_waist',1.40,1.30,.92,0,0),('skirts','high_hip',1.20,1.15,.95,0,0),('skirts','full_hip_seat',1.30,1.20,.92,0,0),('skirts','waist_to_hip_length',1,1,1,.10,.07),('skirts','outseam',1,1,1,.08,.06);

-- Dresses add vertical and bust-shaping refinements without making them mandatory.
insert into public.garment_type_match_adjustments values
('dresses','waist_to_hip_length',1,1,1,.04,.03),('dresses','front_waist_length',1,1,1,.03,.02),('dresses','back_waist_length',1,1,1,.03,.02),('dresses','shoulder_to_bust_point',1,1,1,.03,.02),('dresses','individual_shoulder_length',1,1,1,.02,.015);

-- One-piece garments need crotch/torso/leg geometry according to their construction.
insert into public.garment_type_match_adjustments values
('jumpsuits','inseam',1,1,1,.10,.08),('jumpsuits','thigh_circumference',1,1,1,.04,.03),('jumpsuits','front_rise',1,1,1,.04,.03),('jumpsuits','back_rise',1,1,1,.04,.03),('jumpsuits','crotch_depth',1,1,1,.04,.03),('jumpsuits','total_crotch_length',1,1,1,.05,.035),('jumpsuits','shoulder_width',1,1,1,.05,.04),
('rompers','thigh_circumference',1,1,1,.05,.04),('rompers','front_rise',1,1,1,.05,.035),('rompers','back_rise',1,1,1,.05,.035),('rompers','crotch_depth',1,1,1,.04,.03),('rompers','total_crotch_length',1,1,1,.05,.035),('rompers','shoulder_width',1,1,1,.05,.04),
('bodysuits','torso_girth',1.25,1.20,.90,0,0),('bodysuits','height',.50,.55,1.15,0,0),('bodysuits','shoulder_width',1,1,1,.06,.04),('bodysuits','shoulder_to_waist',1,1,1,.05,.035),('bodysuits','crotch_depth',1,1,1,.05,.035),('bodysuits','total_crotch_length',1,1,1,.07,.05);

-- Structured jackets require more shoulder/arm precision than generic tops.
insert into public.garment_type_match_adjustments
select g,'shoulder_width',1.20,1.15,.90,0,0 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'arm_sleeve_length',1.20,1.15,.90,0,0 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'chest_circumference',1.10,1.08,.92,0,0 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'individual_shoulder_length',1,1,1,.05,.035 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'bicep_upper_arm',1,1,1,.07,.05 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'elbow_circumference',1,1,1,.04,.03 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'across_back_width',1,1,1,.05,.035 from unnest(array['suit_jackets','blazers']) g;
insert into public.garment_type_match_adjustments
select g,'across_front_chest_width',1,1,1,.03,.02 from unnest(array['suit_jackets','blazers']) g;
update public.garment_types set minimum_shared_measurements_override=3,minimum_coverage_override=.40 where key in ('suit_jackets','blazers');

-- Outerwear keeps the same relevant zones but widens circumference tolerance for layering.
insert into public.garment_type_match_adjustments
select g,'chest_circumference',1.05,1.05,1.12,0,0 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'full_bust',1.05,1.05,1.12,0,0 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'natural_waist',.85,.90,1.15,0,0 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'shoulder_width',1.15,1.12,1.00,0,0 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'arm_sleeve_length',1.15,1.10,1.00,0,0 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'individual_shoulder_length',1,1,1,.04,.03 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'bicep_upper_arm',1,1,1.08,.06,.04 from unnest(array['jackets','coats']) g;
insert into public.garment_type_match_adjustments
select g,'elbow_circumference',1,1,1.08,.03,.02 from unnest(array['jackets','coats']) g;
update public.garment_types set minimum_shared_measurements_override=3,minimum_coverage_override=.40 where key in ('jackets','coats');

-- Activewear removes body weight as a direct fit signal and adds movement-zone circumference detail.
insert into public.garment_type_match_adjustments values
('activewear','weight',0,0,1,0,0),('activewear','height',.60,.70,1.10,0,0),('activewear','thigh_circumference',1,1,1.08,.08,.05),('activewear','bicep_upper_arm',1,1,1.08,.05,.03),('activewear','calf_circumference',1,1,1.08,.03,.02);
update public.garment_types set minimum_shared_measurements_override=3,minimum_coverage_override=.40 where key='activewear';

-- Swimwear adds underbust/high-hip/shoulder information to the one-piece baseline.
insert into public.garment_type_match_adjustments values
('swimwear','torso_girth',1.15,1.12,.92,0,0),('swimwear','underbust',1,1,1,.07,.05),('swimwear','high_hip',1,1,1,.05,.035),('swimwear','shoulder_width',1,1,1,.05,.035);

-- Bra refinement dimensions improve shape similarity after bust + underbust qualify the match.
insert into public.garment_type_match_adjustments values
('bras_intimate','bust_point_to_bust_point',1,1,1,.08,.06),('bras_intimate','shoulder_to_bust_point',1,1,1,.06,.04);

-- Product attributes adjust the already garment-specific model. These are conservative
-- priors for ease/stretch/style, not a substitute for future learned calibration.
create table public.garment_attribute_match_adjustments(
  attribute_key text not null,
  option_key text not null,
  measurement_type_key text not null references public.measurement_types(key),
  weight_multiplier numeric(8,4) not null default 1 check(weight_multiplier>=0),
  coverage_multiplier numeric(8,4) not null default 1 check(coverage_multiplier>=0),
  tolerance_multiplier numeric(8,4) not null default 1 check(tolerance_multiplier>0),
  primary key(attribute_key,option_key,measurement_type_key),
  foreign key(attribute_key,option_key) references public.garment_attribute_options(attribute_key,option_key) on delete cascade
);

-- Sleeve construction.
insert into public.garment_attribute_match_adjustments values
('sleeve_length','sleeveless','arm_sleeve_length',0,0,1),('sleeve_length','sleeveless','wrist_circumference',0,0,1),('sleeve_length','sleeveless','bicep_upper_arm',.55,.55,1.10),('sleeve_length','sleeveless','shoulder_width',1.08,1.05,.98),
('sleeve_length','short','arm_sleeve_length',.35,.35,1.10),('sleeve_length','short','wrist_circumference',0,0,1),('sleeve_length','short','bicep_upper_arm',.85,.85,1.05),
('sleeve_length','three_quarter','arm_sleeve_length',.75,.75,1.05),('sleeve_length','three_quarter','wrist_circumference',.45,.45,1.10),
('sleeve_length','long','arm_sleeve_length',1.20,1.15,.95),('sleeve_length','long','bicep_upper_arm',1.05,1.05,.98),('sleeve_length','long','elbow_circumference',1.10,1.08,.96),('sleeve_length','long','wrist_circumference',1.10,1.08,.95);

-- Rise changes which waist level is predictive.
insert into public.garment_attribute_match_adjustments values
('rise','low','natural_waist',.55,.55,1.10),('rise','low','lower_pants_waist',1.30,1.25,.92),('rise','low','front_rise',1.20,1.15,.95),('rise','low','back_rise',1.20,1.15,.95),
('rise','high','natural_waist',1.30,1.25,.92),('rise','high','lower_pants_waist',.80,.80,1.08),('rise','high','high_hip',1.10,1.08,.98),('rise','high','front_rise',1.20,1.15,.95),('rise','high','back_rise',1.20,1.15,.95);

-- Stretch and knit/woven construction alter allowable ease on circumference dimensions.
insert into public.garment_attribute_match_adjustments
select 'stretch_level',o,m,1,1,t from
(values('none'::text,.92::numeric),('low',1.03),('medium',1.12),('high',1.25)) v(o,t)
cross join unnest(array['chest_circumference','full_bust','underbust','natural_waist','lower_pants_waist','high_hip','full_hip_seat','thigh_circumference','knee_circumference','calf_circumference','bicep_upper_arm','wrist_circumference']) m;
insert into public.garment_attribute_match_adjustments
select 'construction',o,m,1,1,t from
(values('woven'::text,.95::numeric),('knit',1.08)) v(o,t)
cross join unnest(array['chest_circumference','full_bust','underbust','natural_waist','lower_pants_waist','high_hip','full_hip_seat','thigh_circumference','knee_circumference','calf_circumference','bicep_upper_arm','wrist_circumference']) m;

-- Fit/cut and leg shape change both relevance and tolerance.
insert into public.garment_attribute_match_adjustments
select 'fit_cut',o,m,w,1,t from
(values('skinny'::text,1.08::numeric,.88::numeric),('slim',1.05,.94),('relaxed',.96,1.10),('oversized',.90,1.20)) v(o,w,t)
cross join unnest(array['chest_circumference','full_bust','natural_waist','lower_pants_waist','full_hip_seat','thigh_circumference','bicep_upper_arm']) m;
insert into public.garment_attribute_match_adjustments values
('fit_cut','athletic','full_hip_seat',1.08,1.06,.96),('fit_cut','athletic','thigh_circumference',1.18,1.12,.92),('fit_cut','athletic','calf_circumference',1.05,1.04,.96);
insert into public.garment_attribute_match_adjustments values
('leg_shape','skinny','thigh_circumference',1.15,1.15,.90),('leg_shape','skinny','knee_circumference',1.12,1.12,.90),('leg_shape','skinny','calf_circumference',1.18,1.18,.90),
('leg_shape','slim','thigh_circumference',1.08,1.08,.95),('leg_shape','slim','knee_circumference',1.05,1.05,.95),('leg_shape','slim','calf_circumference',1.08,1.08,.95),
('leg_shape','relaxed','thigh_circumference',.95,.95,1.08),('leg_shape','relaxed','knee_circumference',.92,.92,1.08),('leg_shape','relaxed','calf_circumference',.90,.90,1.08),
('leg_shape','wide','thigh_circumference',.85,.85,1.15),('leg_shape','wide','knee_circumference',.60,.60,1.15),('leg_shape','wide','calf_circumference',.35,.35,1.15),
('leg_shape','bootcut','knee_circumference',.90,.90,1.08),('leg_shape','bootcut','calf_circumference',.60,.60,1.08),
('leg_shape','flare','knee_circumference',.80,.80,1.12),('leg_shape','flare','calf_circumference',.40,.40,1.12);

-- Length designations increase the importance of vertical proportions.
insert into public.garment_attribute_match_adjustments
select 'length_profile',o,m,w,1.10,.95 from
(values('petite'::text,1.15::numeric),('tall',1.15),('long',1.12)) v(o,w)
cross join unnest(array['height','torso_body_length','arm_sleeve_length','inseam','outseam']) m;
insert into public.garment_attribute_match_adjustments
select 'length_profile','cropped',m,1.20,1.15,.92 from unnest(array['torso_body_length','inseam','outseam']) m;

alter table public.garment_type_match_adjustments enable row level security;
alter table public.garment_attribute_match_adjustments enable row level security;
create policy "garment type match adjustments readable" on public.garment_type_match_adjustments for select to authenticated using(true);
create policy "garment attribute match adjustments readable" on public.garment_attribute_match_adjustments for select to authenticated using(true);
revoke all on public.garment_type_match_adjustments,public.garment_attribute_match_adjustments from anon,authenticated;
grant select on public.garment_type_match_adjustments,public.garment_attribute_match_adjustments to authenticated;

-- Smooth similarity: exact = 1.0; half the configured tolerance = 0.5;
-- one full tolerance away = 0.0625. This removes the old hard zero cliff while
-- preserving the old formula's midpoint interpretation.
create or replace function private.fit_measurement_similarity(a numeric,b numeric,tolerance numeric)
returns numeric language sql immutable strict set search_path='' as $$
  select least(1::numeric,greatest(0::numeric,exp(-ln(16::numeric)*power(abs(a-b)/nullif(tolerance,0),2))));
$$;
revoke all on function private.fit_measurement_similarity(numeric,numeric,numeric) from public,anon,authenticated;

create or replace function private.fit_measurement_reliability(p_source public.measurement_source,p_method public.measurement_method)
returns numeric language sql immutable strict set search_path='' as $$
  select least(
    case p_source when 'manual' then 1.00 when 'device' then 1.00 when 'imported' then .95 end,
    case p_method when 'tape' then 1.00 when 'scale' then 1.00 when 'device' then 1.00 when 'imported' then .95 when 'stated' then .82 when 'unknown' then .88 end
  );
$$;
revoke all on function private.fit_measurement_reliability(public.measurement_source,public.measurement_method) from public,anon,authenticated;

-- Evidence confidence = (coverage * reliability)^0.65, with only a small dimension-count
-- saturation adjustment. The user-facing Match % is raw similarity multiplied by
-- 0.60 + 0.40*confidence. Confidence can only discount; it can never inflate similarity.
create or replace function private.confidence_adjusted_match(
  p_weighted_similarity numeric,p_similarity_weight numeric,p_shared_coverage numeric,
  p_reliable_coverage numeric,p_total_coverage numeric,p_shared_count integer,p_measurement_count integer)
returns integer language sql immutable set search_path='' as $$
with x as (
  select least(1::numeric,greatest(0::numeric,p_weighted_similarity/nullif(p_similarity_weight,0))) raw_similarity,
         least(1::numeric,greatest(0::numeric,p_shared_coverage/nullif(p_total_coverage,0))) coverage,
         least(1::numeric,greatest(0::numeric,p_reliable_coverage/nullif(p_shared_coverage,0))) reliability,
         least(1::numeric,p_shared_count::numeric/greatest(1,least(3,p_measurement_count))::numeric) count_saturation
), c as (
  select raw_similarity,power(coverage*reliability,.65::numeric)*(.85::numeric+.15::numeric*count_saturation) evidence_confidence from x
)
select round(100*least(1::numeric,greatest(0::numeric,raw_similarity*(.60::numeric+.40::numeric*evidence_confidence))))::integer from c;
$$;
revoke all on function private.confidence_adjusted_match(numeric,numeric,numeric,numeric,numeric,integer,integer) from public,anon,authenticated;

-- Effective rows for a garment type: base profile + garment-specific refinement.
create or replace function private.garment_match_measurements(p_garment_type_key text)
returns table(measurement_type_key text,weight numeric,coverage_weight numeric,tolerance numeric,minimum_shared_measurements integer,minimum_coverage numeric)
language sql security definer set search_path='' as $$
with target as (
  select gt.*,mp.minimum_shared_measurements profile_min_count,mp.minimum_coverage profile_min_coverage
  from public.garment_types gt join public.match_profiles mp on mp.key=gt.match_profile_key
  where gt.key=p_garment_type_key and gt.active
), base as (
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) tolerance
  from target t join public.match_profile_measurements mpm on mpm.profile_key=t.match_profile_key
  join public.measurement_types mt on mt.key=mpm.measurement_type_key
), keys as (
  select measurement_type_key from base union select measurement_type_key from public.garment_type_match_adjustments where garment_type_key=p_garment_type_key
), resolved as (
  select k.measurement_type_key,
    coalesce(b.weight,0)*coalesce(a.weight_multiplier,1)+coalesce(a.extra_weight,0) weight,
    coalesce(b.coverage_weight,0)*coalesce(a.coverage_multiplier,1)+coalesce(a.extra_coverage_weight,0) coverage_weight,
    coalesce(b.tolerance,mt.default_tolerance_canonical)*coalesce(a.tolerance_multiplier,1) tolerance,
    coalesce(t.minimum_shared_measurements_override,t.profile_min_count)::integer minimum_shared_measurements,
    coalesce(t.minimum_coverage_override,t.profile_min_coverage) minimum_coverage
  from keys k cross join target t join public.measurement_types mt on mt.key=k.measurement_type_key
  left join base b on b.measurement_type_key=k.measurement_type_key
  left join public.garment_type_match_adjustments a on a.garment_type_key=p_garment_type_key and a.measurement_type_key=k.measurement_type_key
)
select * from resolved where weight>0 or coverage_weight>0;
$$;
revoke all on function private.garment_match_measurements(text) from public,anon,authenticated;

-- Target-product rows = effective garment rows multiplied by controlled product attributes.
create or replace function private.product_match_measurements(p_product_id uuid)
returns table(measurement_type_key text,weight numeric,coverage_weight numeric,tolerance numeric,minimum_shared_measurements integer,minimum_coverage numeric)
language sql security definer set search_path='' as $$
with target as (select p.id,p.garment_type_key,p.category from public.products p where p.id=p_product_id),
base as (
  select gm.* from target t cross join lateral private.garment_match_measurements(t.garment_type_key) gm where t.garment_type_key is not null
  union all
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical),mp.minimum_shared_measurements::integer,mp.minimum_coverage
  from target t join public.match_profiles mp on mp.key=case t.category when 'tops' then 'tops_default' when 'bottoms' then 'bottoms_default' when 'dresses' then 'dresses_default' when 'shoes' then 'shoes' else 'overall' end
  join public.match_profile_measurements mpm on mpm.profile_key=mp.key join public.measurement_types mt on mt.key=mpm.measurement_type_key
  where t.garment_type_key is null
), adj as (
  select a.measurement_type_key,
    case when bool_or(a.weight_multiplier=0) then 0::numeric else exp(sum(ln(nullif(a.weight_multiplier,0)))) end weight_multiplier,
    case when bool_or(a.coverage_multiplier=0) then 0::numeric else exp(sum(ln(nullif(a.coverage_multiplier,0)))) end coverage_multiplier,
    exp(sum(ln(a.tolerance_multiplier))) tolerance_multiplier
  from public.product_attribute_values pav join public.garment_attribute_match_adjustments a on a.attribute_key=pav.attribute_key and a.option_key=pav.option_key
  where pav.product_id=p_product_id group by a.measurement_type_key
)
select b.measurement_type_key,b.weight*coalesce(a.weight_multiplier,1),b.coverage_weight*coalesce(a.coverage_multiplier,1),b.tolerance*coalesce(a.tolerance_multiplier,1),b.minimum_shared_measurements,b.minimum_coverage
from base b left join adj a on a.measurement_type_key=b.measurement_type_key
where b.weight*coalesce(a.weight_multiplier,1)>0 or b.coverage_weight*coalesce(a.coverage_multiplier,1)>0;
$$;
revoke all on function private.product_match_measurements(uuid) from public,anon,authenticated;

create or replace function private.calculate_fit_matches_for_profile(p_profile_key text,p_result_limit integer default 30)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid(); v_limit integer:=least(greatest(coalesce(p_result_limit,30),1),100);
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not exists(select 1 from public.match_profiles where key=p_profile_key) then raise exception 'Unknown match profile'; end if;
 if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;
 return query
 with w as (
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) tolerance
  from public.match_profile_measurements mpm join public.measurement_types mt on mt.key=mpm.measurement_type_key where mpm.profile_key=p_profile_key
 ), meta as (
  select sum(w.coverage_weight) total_coverage,count(*)::integer measurement_count,mp.minimum_shared_measurements,mp.minimum_coverage from w cross join public.match_profiles mp where mp.key=p_profile_key group by mp.minimum_shared_measurements,mp.minimum_coverage
 ), candidates as (
  select p.id,p.username,p.display_name,p.avatar_url from public.profiles p join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null where p.id<>v_user_id and p.username is not null
 ), s as (
  select c.id,c.username,c.display_name,c.avatar_url,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from candidates c cross join w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
  group by c.id,c.username,c.display_name,c.avatar_url
 ), q as (
  select s.*,least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))) coverage from s
  where similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
 )
 select q.id,q.username,q.display_name,q.avatar_url,private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count),round(coverage*100)::integer
 from q order by 5 desc,6 desc,q.username limit v_limit;
end; $$;
revoke all on function private.calculate_fit_matches_for_profile(text,integer) from public,anon,authenticated;
grant execute on function private.calculate_fit_matches_for_profile(text,integer) to authenticated;

create or replace function private.calculate_fit_matches_for_garment(p_garment_type_key text,p_result_limit integer default 100)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid(); v_limit integer:=least(greatest(coalesce(p_result_limit,100),1),100);
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if not exists(select 1 from public.garment_types where key=p_garment_type_key and active) then raise exception 'Unknown garment type'; end if;
 if not exists(select 1 from public.fit_profiles fp where fp.user_id=v_user_id and fp.completed_at is not null) then return; end if;
 return query
 with w as (select * from private.garment_match_measurements(p_garment_type_key)), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w
 ), candidates as (
  select p.id,p.username,p.display_name,p.avatar_url from public.profiles p join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null where p.id<>v_user_id and p.username is not null
 ), s as (
  select c.id,c.username,c.display_name,c.avatar_url,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,them.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and them.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(them.source,them.method)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and them.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from candidates c cross join w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=w.measurement_type_key
  group by c.id,c.username,c.display_name,c.avatar_url
 ), q as (
  select s.*,least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))) coverage from s
  where similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage
 )
 select q.id,q.username,q.display_name,q.avatar_url,private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count),round(coverage*100)::integer
 from q order by 5 desc,6 desc,q.username limit v_limit;
end; $$;
revoke all on function private.calculate_fit_matches_for_garment(text,integer) from public,anon,authenticated;
grant execute on function private.calculate_fit_matches_for_garment(text,integer) to authenticated;

create or replace function public.get_garment_fit_matches(p_garment_type_key text,p_result_limit integer default 100)
returns table(user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language sql security invoker set search_path='' as $$ select * from private.calculate_fit_matches_for_garment(p_garment_type_key,p_result_limit); $$;
revoke all on function public.get_garment_fit_matches(text,integer) from public,anon;
grant execute on function public.get_garment_fit_matches(text,integer) to authenticated;

create or replace function private.calculate_snapshot_match(p_fit_profile_version_id uuid,p_profile_key text)
returns table(match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 return query
 with w as (
  select mpm.measurement_type_key,mpm.weight,mpm.coverage_weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) tolerance from public.match_profile_measurements mpm join public.measurement_types mt on mt.key=mpm.measurement_type_key where mpm.profile_key=p_profile_key
 ), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,mp.minimum_shared_measurements,mp.minimum_coverage from w cross join public.match_profiles mp where mp.key=p_profile_key group by mp.minimum_shared_measurements,mp.minimum_coverage
 ), s as (
  select sum(case when me.value_canonical is not null and hist.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.fit_profile_version_measurements hist on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key
 )
 select case when similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage then private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count) else 0 end,
        case when total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer else 0 end from s;
end; $$;
revoke all on function private.calculate_snapshot_match(uuid,text) from public,anon;
grant execute on function private.calculate_snapshot_match(uuid,text) to authenticated;

create or replace function private.calculate_snapshot_match_for_product(p_fit_profile_version_id uuid,p_product_id uuid)
returns table(match_score integer,coverage_percent integer)
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid();
begin
 if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
 return query
 with w as (select * from private.product_match_measurements(p_product_id)), meta as (
  select sum(coverage_weight) total_coverage,count(*)::integer measurement_count,max(minimum_shared_measurements) minimum_shared_measurements,max(minimum_coverage) minimum_coverage from w
 ), s as (
  select sum(case when me.value_canonical is not null and hist.value_canonical is not null then private.fit_measurement_similarity(me.value_canonical,hist.value_canonical,w.tolerance)*w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) weighted_similarity,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) similarity_weight,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight else 0 end) shared_coverage,
   sum(case when me.value_canonical is not null and hist.value_canonical is not null then w.coverage_weight*sqrt(private.fit_measurement_reliability(me.source,me.method)*private.fit_measurement_reliability(hist.source,hist.method)) else 0 end) reliable_coverage,
   count(*) filter(where me.value_canonical is not null and hist.value_canonical is not null)::integer shared_count,
   max(meta.total_coverage) total_coverage,max(meta.measurement_count) measurement_count,max(meta.minimum_shared_measurements) minimum_shared_measurements,max(meta.minimum_coverage) minimum_coverage
  from w cross join meta
  left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=w.measurement_type_key
  left join public.fit_profile_version_measurements hist on hist.fit_profile_version_id=p_fit_profile_version_id and hist.measurement_type_key=w.measurement_type_key
 )
 select case when similarity_weight>0 and shared_count>=minimum_shared_measurements and shared_coverage/nullif(total_coverage,0)>=minimum_coverage then private.confidence_adjusted_match(weighted_similarity,similarity_weight,shared_coverage,reliable_coverage,total_coverage,shared_count,measurement_count) else 0 end,
        case when total_coverage>0 then round(100*least(1::numeric,greatest(0::numeric,shared_coverage/nullif(total_coverage,0))))::integer else 0 end from s;
end; $$;
revoke all on function private.calculate_snapshot_match_for_product(uuid,uuid) from public,anon,authenticated;

-- Preserve the existing evidence hierarchy and unique-wearer cap, but calculate body
-- relevance against the target product's garment type + controlled attributes.
create or replace function public.get_product_evidence_candidates(p_product_id uuid,p_variant_id uuid default null::uuid,p_result_limit integer default 200)
returns table(fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer)
language sql security invoker set search_path='' as $$
with target as (
 select p.*,case when p_variant_id is not null and exists(select 1 from public.product_variants pv where pv.id=p_variant_id and pv.product_id=p.id) then p_variant_id else null::uuid end target_variant_id from public.products p where p.id=p_product_id
), candidates as (
 select fr.id fit_report_id,fr.user_id,fr.closet_item_id,fr.product_id evidence_product_id,fr.variant_id evidence_variant_id,fr.fit_profile_version_id,fr.size_label original_size_label,fr.normalized_size_id,fr.fit,fr.would_buy_again,fr.created_at observed_at,ep.brand_id,ep.product_family_id,ep.garment_type_key,ep.category,
 (select count(*)::integer from public.product_attribute_values ta join public.product_attribute_values ea on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key where ta.product_id=p_product_id and ea.product_id=ep.id) attribute_overlap,
 t.brand_id target_brand_id,t.product_family_id target_family_id,t.garment_type_key target_garment_type,t.category target_category,t.target_variant_id
 from public.fit_reports fr join public.products ep on ep.id=fr.product_id cross join target t
 where fr.product_id=p_product_id or (t.product_family_id is not null and ep.product_family_id=t.product_family_id) or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key) or ep.category=t.category
), scored as (
 select c.*,hm.match_score snapshot_match_score,hm.coverage_percent snapshot_coverage_percent,
 case when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 'exact_variant'::public.evidence_level when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level else 'category_fit'::public.evidence_level end resolved_evidence_level,
 case when c.target_variant_id is not null and c.evidence_variant_id=c.target_variant_id then 1 when c.evidence_product_id=p_product_id then 2 when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3 when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4 when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5 else 6 end resolved_evidence_rank
 from candidates c cross join lateral private.calculate_snapshot_match_for_product(c.fit_profile_version_id,p_product_id) hm
), one_per_person as (
 select s.*,row_number() over(partition by s.user_id order by s.resolved_evidence_rank,s.snapshot_match_score desc,s.snapshot_coverage_percent desc,s.attribute_overlap desc,s.observed_at desc,s.fit_report_id) person_rank from scored s
)
select r.fit_report_id,r.user_id,r.closet_item_id,r.evidence_product_id,r.evidence_variant_id,r.fit_profile_version_id,r.original_size_label,r.normalized_size_id,r.fit,r.would_buy_again,r.snapshot_match_score,r.snapshot_coverage_percent,r.resolved_evidence_level,r.resolved_evidence_rank,r.attribute_overlap
from one_per_person r where r.person_rank=1 and r.snapshot_match_score>0
order by r.resolved_evidence_rank,r.snapshot_match_score desc,r.snapshot_coverage_percent desc,r.attribute_overlap desc,r.fit_report_id
limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

create or replace function public.get_fit_report_snapshot_matches(p_fit_report_ids uuid[])
returns table(fit_report_id uuid,historical_match_score integer,historical_coverage_percent integer)
language sql security invoker set search_path='' as $$
 select fr.id,hm.match_score,hm.coverage_percent from public.fit_reports fr
 cross join lateral private.calculate_snapshot_match_for_product(fr.fit_profile_version_id,fr.product_id) hm
 where fr.id=any(coalesce(p_fit_report_ids,'{}'::uuid[])) limit 100;
$$;
revoke all on function public.get_fit_report_snapshot_matches(uuid[]) from public,anon;
grant execute on function public.get_fit_report_snapshot_matches(uuid[]) to authenticated;

-- Both known call sites above now use the smooth canonical matcher.
drop function if exists private.clamped_similarity(numeric,numeric,numeric);

comment on column public.match_profile_measurements.weight is 'Similarity importance for the anthropometric dimension.';
comment on column public.match_profile_measurements.coverage_weight is 'Evidence/completeness importance; separate from similarity importance.';
comment on table public.garment_type_match_adjustments is 'Garment-specific refinements layered on canonical match profiles; advanced dimensions are used only when relevant.';
comment on table public.garment_attribute_match_adjustments is 'Controlled product style/ease/stretch multipliers layered on garment-specific matching.';
comment on function private.fit_measurement_similarity(numeric,numeric,numeric) is 'Smooth anthropometric similarity: exact=1, half tolerance=.5, full tolerance=.0625.';
comment on function private.confidence_adjusted_match(numeric,numeric,numeric,numeric,numeric,integer,integer) is 'User-facing Match percent: raw similarity discounted by relevant coverage, measurement reliability and evidence depth; never boosted above raw similarity.';
comment on function public.get_garment_fit_matches(text,integer) is 'Current-person garment-specific discovery using the garment type effective dimension set; raw measurements remain private.';
comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is 'Unique-wearer historical fit evidence scored against immutable body snapshots using the target product garment/attribute model.';
