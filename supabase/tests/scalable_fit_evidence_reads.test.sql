begin;

select plan(12);

select has_function(
  'public',
  'get_fit_matches_batch',
  array['fit_match_category[]','integer','fit_community'],
  'batched Fit Match resolver exists'
);

select function_privs_are(
  'public',
  'get_fit_matches_batch',
  array['fit_match_category[]','integer','fit_community'],
  'authenticated',
  array['EXECUTE'],
  'authenticated can execute batched Fit Match resolver'
);

select function_privs_are(
  'public',
  'get_fit_matches_batch',
  array['fit_match_category[]','integer','fit_community'],
  'anon',
  array[]::text[],
  'anon cannot execute batched Fit Match resolver'
);

select has_function(
  'public',
  'get_product_evidence_summaries',
  array['uuid[]','integer'],
  'Explore evidence summary batch resolver exists'
);

select function_privs_are(
  'public',
  'get_product_evidence_summaries',
  array['uuid[]','integer'],
  'authenticated',
  array['EXECUTE'],
  'authenticated can execute Explore evidence summary batch resolver'
);

select function_privs_are(
  'public',
  'get_product_evidence_summaries',
  array['uuid[]','integer'],
  'anon',
  array[]::text[],
  'anon cannot execute Explore evidence summary batch resolver'
);

select has_function(
  'private',
  'calculate_snapshot_matches_for_product',
  array['uuid[]','uuid'],
  'set-wise historical Product snapshot scorer exists'
);

select function_privs_are(
  'private',
  'calculate_snapshot_matches_for_product',
  array['uuid[]','uuid'],
  'authenticated',
  array[]::text[],
  'historical Product snapshot scorer stays private'
);

select has_function(
  'private',
  'calculate_directional_pressures_for_product',
  array['uuid[]','uuid'],
  'set-wise directional pressure scorer exists'
);

select function_privs_are(
  'private',
  'calculate_directional_pressures_for_product',
  array['uuid[]','uuid'],
  'authenticated',
  array[]::text[],
  'directional pressure scorer stays private'
);

select has_function(
  'private',
  'resolve_product_evidence_core',
  array['uuid','uuid','integer'],
  'canonical Product evidence core exists'
);

select function_privs_are(
  'private',
  'resolve_product_evidence_core',
  array['uuid','uuid','integer'],
  'authenticated',
  array[]::text[],
  'canonical Product evidence core stays private'
);

select * from finish();
rollback;
