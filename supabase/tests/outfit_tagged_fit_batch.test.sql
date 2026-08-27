-- LikeSized tagged-Outfit Relevant Fit Report batch projection safeguards.
begin;
select plan(4);

select has_function(
  'public',
  'get_outfit_tagged_fit_counts',
  array['uuid','integer'],
  'bounded Outfit tagged-fit count batch function exists'
);

select ok(
  has_function_privilege('authenticated','public.get_outfit_tagged_fit_counts(uuid,integer)','EXECUTE'),
  'authenticated members may execute the personalized batch count boundary'
);

select ok(
  not has_function_privilege('anon','public.get_outfit_tagged_fit_counts(uuid,integer)','EXECUTE'),
  'anonymous visitors cannot execute personalized batch counts'
);

select lives_ok(
  $$ select * from public.get_outfit_tagged_fit_counts('00000000-0000-0000-0000-000000000000'::uuid,85) $$,
  'empty Outfit batch request remains a safe bounded query'
);

select * from finish();
rollback;
