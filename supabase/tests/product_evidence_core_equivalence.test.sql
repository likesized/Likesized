begin;

select plan(3);

select has_function(
  'private',
  'resolve_product_evidence_core',
  array['uuid','uuid','integer'],
  'canonical Product evidence core exists'
);

select function_returns(
  'private',
  'resolve_product_evidence_core',
  array['uuid','uuid','integer'],
  'setof record',
  'canonical Product evidence core remains a bounded row resolver'
);

select has_function(
  'public',
  'get_product_evidence_candidates',
  array['uuid','uuid','integer'],
  'public FITuition evidence boundary retains its canonical signature'
);

select * from finish();
rollback;
