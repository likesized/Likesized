begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(14);

insert into auth.users (id,aud,role,email,created_at,updated_at)
values
  ('f5100000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','follow-a@likesized.test',now(),now()),
  ('f5100000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','follow-b@likesized.test',now(),now()),
  ('f5100000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','follow-c@likesized.test',now(),now());

-- Give A and B controlled current Fit Profiles so the saved relationship can be tested
-- independently from the live current-person score.
set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile(
  'follow_a','metric',
  '[
    {"measurement_type_key":"height","entered_value":175,"entered_unit":"cm","source":"manual","method":"tape"},
    {"measurement_type_key":"weight","entered_value":70,"entered_unit":"kg","source":"manual","method":"scale"},
    {"measurement_type_key":"chest_circumference","entered_value":96,"entered_unit":"cm","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile(
  'follow_b','metric',
  '[
    {"measurement_type_key":"height","entered_value":175,"entered_unit":"cm","source":"manual","method":"tape"},
    {"measurement_type_key":"weight","entered_value":70,"entered_unit":"kg","source":"manual","method":"scale"},
    {"measurement_type_key":"chest_circumference","entered_value":96,"entered_unit":"cm","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile(
  'follow_c','metric',
  '[{"measurement_type_key":"height","entered_value":165,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

-- A saves B as a Fit Twin.
set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
insert into public.follows(follower_id,followed_id)
values('f5100000-0000-4000-8000-000000000001'::uuid,'f5100000-0000-4000-8000-000000000002'::uuid);

select is(
  (select count(*) from public.follows where follower_id='f5100000-0000-4000-8000-000000000001'::uuid and followed_id='f5100000-0000-4000-8000-000000000002'::uuid),
  1::bigint,
  'a member can save another member as a Fit Twin'
);

select throws_like(
  $$insert into public.follows(follower_id,followed_id)
    values('f5100000-0000-4000-8000-000000000001'::uuid,'f5100000-0000-4000-8000-000000000001'::uuid)$$,
  '%follows_check%',
  'self-follow is rejected by the database constraint'
);

select throws_like(
  $$insert into public.follows(follower_id,followed_id)
    values('f5100000-0000-4000-8000-000000000001'::uuid,'f5100000-0000-4000-8000-000000000002'::uuid)$$,
  '%duplicate key%',
  'duplicate Fit Twin relationships are rejected'
);

create temporary table follow_score_before(score integer) on commit drop;
insert into follow_score_before(score)
select match_score
from public.get_fit_matches('overall',100)
where user_id='f5100000-0000-4000-8000-000000000002'::uuid;

select ok(
  (select score is not null from follow_score_before limit 1),
  'followed member has a live current Fit Match score'
);
reset role;

-- C is not part of the relationship, but the V1 follow graph is intentionally visible
-- to signed-in LikeSized members.
set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select is(
  (select count(*) from public.follows where follower_id='f5100000-0000-4000-8000-000000000001'::uuid and followed_id='f5100000-0000-4000-8000-000000000002'::uuid),
  1::bigint,
  'an unrelated signed-in member can read the public member follow graph'
);

select throws_like(
  $$insert into public.follows(follower_id,followed_id)
    values('f5100000-0000-4000-8000-000000000001'::uuid,'f5100000-0000-4000-8000-000000000003'::uuid)$$,
  '%row-level security%',
  'a member cannot create a follow on another member behalf'
);

select lives_ok(
  $$delete from public.follows
    where follower_id='f5100000-0000-4000-8000-000000000001'::uuid
      and followed_id='f5100000-0000-4000-8000-000000000002'::uuid$$,
  'cross-member delete sees no owner-authorized row rather than deleting it'
);
reset role;

select is(
  (select count(*) from public.follows where follower_id='f5100000-0000-4000-8000-000000000001'::uuid and followed_id='f5100000-0000-4000-8000-000000000002'::uuid),
  1::bigint,
  'another member cannot remove someone else Fit Twin relationship'
);

-- B changes current body state. This must change current-person match context while
-- leaving A's saved Fit Twin relationship intact.
set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile(
  'follow_b','metric',
  '[
    {"measurement_type_key":"height","entered_value":195,"entered_unit":"cm","source":"manual","method":"tape"},
    {"measurement_type_key":"weight","entered_value":110,"entered_unit":"kg","source":"manual","method":"scale"},
    {"measurement_type_key":"chest_circumference","entered_value":130,"entered_unit":"cm","source":"manual","method":"tape"},
    {"measurement_type_key":"natural_waist","entered_value":115,"entered_unit":"cm","source":"manual","method":"tape"}
  ]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='f5100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';

select is(
  (select count(*) from public.follows where follower_id='f5100000-0000-4000-8000-000000000001'::uuid and followed_id='f5100000-0000-4000-8000-000000000002'::uuid),
  1::bigint,
  'saved Fit Twin relationship persists after either current Fit Profile changes'
);

select ok(
  coalesce((select match_score from public.get_fit_matches('overall',100) where user_id='f5100000-0000-4000-8000-000000000002'::uuid),-1)
  < coalesce((select score from follow_score_before limit 1),-1),
  'current Fit Match score recalculates independently of the saved follow relationship'
);

select lives_ok(
  $$delete from public.follows
    where follower_id='f5100000-0000-4000-8000-000000000001'::uuid
      and followed_id='f5100000-0000-4000-8000-000000000002'::uuid$$,
  'the relationship owner can remove a Fit Twin'
);

select is(
  (select count(*) from public.follows where follower_id='f5100000-0000-4000-8000-000000000001'::uuid and followed_id='f5100000-0000-4000-8000-000000000002'::uuid),
  0::bigint,
  'unfollow removes only the owner selected relationship'
);
reset role;

select ok(
  not has_table_privilege('anon','public.follows','SELECT'),
  'anonymous visitors cannot query the member follow graph'
);

select ok(
  has_table_privilege('authenticated','public.follows','SELECT'),
  'signed-in LikeSized members can query the public member follow graph'
);

select * from finish();
rollback;
