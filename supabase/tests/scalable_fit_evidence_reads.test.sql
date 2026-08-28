begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private,pg_temp;
select plan(42);

select has_function(
  'public','get_fit_matches_batch',array['fit_match_category[]','integer','fit_community'],
  'batched Fit Match resolver exists'
);
select function_privs_are(
  'public','get_fit_matches_batch',array['fit_match_category[]','integer','fit_community'],
  'authenticated',array['EXECUTE'],'authenticated can execute batched Fit Match resolver'
);
select function_privs_are(
  'public','get_fit_matches_batch',array['fit_match_category[]','integer','fit_community'],
  'anon',array[]::text[],'anon cannot execute batched Fit Match resolver'
);
select has_function(
  'public','get_product_evidence_summaries',array['uuid[]','integer'],
  'Explore evidence summary batch resolver exists'
);
select function_privs_are(
  'public','get_product_evidence_summaries',array['uuid[]','integer'],
  'authenticated',array['EXECUTE'],'authenticated can execute Explore evidence summary batch resolver'
);
select function_privs_are(
  'public','get_product_evidence_summaries',array['uuid[]','integer'],
  'anon',array[]::text[],'anon cannot execute Explore evidence summary batch resolver'
);
select has_function(
  'private','calculate_snapshot_matches_for_product',array['uuid[]','uuid'],
  'set-wise historical Product snapshot scorer exists'
);
select function_privs_are(
  'private','calculate_snapshot_matches_for_product',array['uuid[]','uuid'],
  'authenticated',array[]::text[],'historical Product snapshot scorer stays private'
);
select has_function(
  'private','calculate_directional_pressures_for_product',array['uuid[]','uuid'],
  'set-wise directional pressure scorer exists'
);
select function_privs_are(
  'private','calculate_directional_pressures_for_product',array['uuid[]','uuid'],
  'authenticated',array[]::text[],'directional pressure scorer stays private'
);
select has_function(
  'private','resolve_product_evidence_core',array['uuid','uuid','integer'],
  'canonical Product evidence core exists'
);
select function_privs_are(
  'private','resolve_product_evidence_core',array['uuid','uuid','integer'],
  'authenticated',array[]::text[],'canonical Product evidence core stays private'
);
select has_function(
  'private','discover_historical_product_snapshot_candidates',array['uuid','integer'],
  'historical Product evidence has a bounded snapshot candidate resolver'
);
select function_privs_are(
  'private','discover_historical_product_snapshot_candidates',array['uuid','integer'],
  'authenticated',array[]::text[],'historical snapshot candidate resolver stays private'
);
select has_table(
  'private','fit_profile_version_candidate_buckets',
  'immutable Fit Profile snapshots have a private candidate-bucket index'
);
select ok(
  not has_table_privilege('authenticated','private.fit_profile_version_candidate_buckets','SELECT'),
  'authenticated members cannot read historical snapshot candidate buckets'
);
select ok(
  not has_table_privilege('anon','private.fit_profile_version_candidate_buckets','SELECT'),
  'anonymous callers cannot read historical snapshot candidate buckets'
);
select ok(
  not has_table_privilege('authenticated','private.current_person_match_cache','SELECT'),
  'current person Match cache remains private'
);
select ok(
  not has_table_privilege('authenticated','private.fit_match_neighborhood_cache','SELECT'),
  'Fit Match neighborhood cache remains private'
);
select ok(
  not has_table_privilege('authenticated','private.fituition_evidence_cache','SELECT'),
  'personalized FITuition cache remains private'
);
select ok(
  has_function_privilege('authenticated','public.get_person_fit_match_cached(uuid)','EXECUTE'),
  'authenticated members can resolve one direct cached person Match'
);
select ok(
  not has_function_privilege('anon','public.get_person_fit_match_cached(uuid)','EXECUTE'),
  'anonymous callers cannot resolve direct person Match'
);
select ok(
  has_function_privilege('authenticated','public.get_cached_product_evidence_candidates(uuid,uuid,integer)','EXECUTE'),
  'authenticated members can resolve cached personalized Product evidence'
);
select ok(
  not has_function_privilege('anon','public.get_cached_product_evidence_candidates(uuid,uuid,integer)','EXECUTE'),
  'anonymous callers cannot resolve cached personalized Product evidence'
);
select ok(
  position('discover_historical_product_snapshot_candidates' in pg_get_functiondef('private.resolve_product_evidence_core(uuid,uuid,integer)'::regprocedure))>0,
  'historical evidence core uses immutable snapshot candidate discovery'
);
select ok(
  position('discover_fit_match_candidates' in pg_get_functiondef('private.resolve_product_evidence_core(uuid,uuid,integer)'::regprocedure))=0,
  'historical evidence core never filters wear evidence by another member current body state'
);
select ok(
  pg_get_functiondef('private.discover_historical_product_snapshot_candidates(uuid,integer)'::regprocedure) like '%least(greatest(coalesce(p_candidate_limit,1400),200),1800)%'
  and pg_get_functiondef('private.discover_historical_product_snapshot_candidates(uuid,integer)'::regprocedure) like '%limit 450%',
  'historical candidate discovery has hard upper bounds and prioritizes exact Product evidence'
);
select ok(
  position('target_fp.match_input_version<>(item->>''target_input_version'')::bigint' in pg_get_functiondef('public.get_fit_matches_cached_batch(fit_match_category[],integer,fit_community)'::regprocedure))>0,
  'displayed Match neighborhoods become stale when a target Match-input revision changes'
);
select has_trigger(
  'public','fit_profiles','fit_profiles_bump_match_input_on_fit_community_change',
  'Fit Community changes invalidate cached discovery membership immediately'
);
select ok(
  position('new.match_input_version:=old.match_input_version+1' in replace(pg_get_functiondef('private.bump_match_input_version_on_fit_community_change()'::regprocedure),' ',''))>0,
  'Fit Community invalidation increments the private Match-input revision'
);
select has_trigger(
  'public','fit_profile_version_measurements','fit_profile_version_measurements_sync_candidate_bucket',
  'immutable snapshot measurement writes maintain the private candidate index'
);
select ok(
  pg_get_functiondef('public.get_cached_product_evidence_candidates(uuid,uuid,integer)'::regprocedure) like '%viewer_input_version=v_input_version%'
  and pg_get_functiondef('public.get_cached_product_evidence_candidates(uuid,uuid,integer)'::regprocedure) like '%algorithm_version=v_algorithm_version%'
  and pg_get_functiondef('public.get_cached_product_evidence_candidates(uuid,uuid,integer)'::regprocedure) like '%evidence_token=v_token%'
  and pg_get_functiondef('public.get_cached_product_evidence_candidates(uuid,uuid,integer)'::regprocedure) like '%computed_at>=now()-interval ''12 hours''%',
  'FITuition cache validity is versioned by viewer inputs, algorithm, evidence state and bounded TTL'
);
select has_trigger(
  'public','fit_reports','fit_reports_bump_fituition_evidence',
  'Fit Report changes invalidate relevant personalized evidence scopes'
);
select has_trigger(
  'public','product_attribute_values','product_attribute_values_bump_fituition_evidence',
  'Product attribute changes invalidate relevant personalized evidence scopes'
);
select has_trigger(
  'public','closet_items','closet_items_bump_fituition_evidence',
  'Closet visibility changes invalidate relevant personalized evidence scopes'
);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('e9000000-0000-4000-8000-000000000001','authenticated','authenticated','scale-viewer@likesized.test',now(),now()),
('e9000000-0000-4000-8000-000000000002','authenticated','authenticated','scale-target@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e9000000-0000-4000-8000-000000000001';
select public.save_fit_profile('scale_viewer','imperial'::public.unit_system,
 '[{"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"chest_circumference","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":30,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"inseam","entered_value":30,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":17,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
 '[]'::jsonb);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e9000000-0000-4000-8000-000000000002';
select public.save_fit_profile('scale_target','imperial'::public.unit_system,
 '[{"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"chest_circumference","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":30,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":38,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"inseam","entered_value":30,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":17,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
 '[]'::jsonb);
reset role;

create temporary table scale_state(key text primary key,value text) on commit drop;
insert into scale_state(key,value)
select 'old_target_version',current_version_id::text from public.fit_profiles where user_id='e9000000-0000-4000-8000-000000000002';
insert into scale_state(key,value)
select 'old_target_input_version',match_input_version::text from public.fit_profiles where user_id='e9000000-0000-4000-8000-000000000002';

insert into public.brands(id,name,slug,normalized_name)
values('e9100000-0000-4000-8000-000000000001','Scale Test Brand','scale-test-brand','scaletestbrand');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment)
values('e9200000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','Scale Test Tee','scale-test-tee','tops','scaletesttee','t_shirt','unisex');
insert into public.closet_items(id,user_id,product_id,size_label,wears_count)
values('e9300000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000002','e9200000-0000-4000-8000-000000000001','M',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
values(
 'e9400000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000002','e9300000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001',
 (select value::uuid from scale_state where key='old_target_version'),'M','just_right'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e9000000-0000-4000-8000-000000000001';
select is(
  (select bool_and(cache_hit) from public.get_person_fit_match_cached('e9000000-0000-4000-8000-000000000002')),
  false,
  'first direct person Match calculation is a cache miss'
);
select is(
  (select bool_and(cache_hit) from public.get_person_fit_match_cached('e9000000-0000-4000-8000-000000000002')),
  true,
  'unchanged direct person Match reuses the version-valid cache'
);
reset role;

update public.fit_profiles
set fit_community='women'::public.fit_community
where user_id='e9000000-0000-4000-8000-000000000002';
select is(
  (select match_input_version from public.fit_profiles where user_id='e9000000-0000-4000-8000-000000000002'),
  (select value::bigint+1 from scale_state where key='old_target_input_version'),
  'target Fit Community change increments Match-input revision immediately'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e9000000-0000-4000-8000-000000000001';
select is(
  (select bool_and(cache_hit) from public.get_person_fit_match_cached('e9000000-0000-4000-8000-000000000002')),
  false,
  'direct person Match recalculates after target discovery-relevant version changes'
);
reset role;

select ok(
  exists(
    select 1 from private.fit_profile_version_candidate_buckets
    where fit_profile_version_id=(select value::uuid from scale_state where key='old_target_version')
  ),
  'historical candidate buckets remain attached to the immutable old Fit Profile snapshot'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e9000000-0000-4000-8000-000000000002';
select public.save_fit_profile('scale_target','imperial'::public.unit_system,
 '[{"measurement_type_key":"height","entered_value":76,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"chest_circumference","entered_value":50,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":44,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"full_hip_seat","entered_value":50,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"inseam","entered_value":36,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"shoulder_width","entered_value":23,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
 '[]'::jsonb);
reset role;

set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='e9000000-0000-4000-8000-000000000001';
select ok(
  exists(
    select 1 from private.discover_historical_product_snapshot_candidates('e9200000-0000-4000-8000-000000000001',1400)
    where fit_profile_version_id=(select value::uuid from scale_state where key='old_target_version')
  ),
  'historical Product discovery still finds the old similar body snapshot after that wearer current body changes'
);

set local role authenticated;
select ok(
  exists(
    select 1 from public.get_product_evidence_candidates('e9200000-0000-4000-8000-000000000001',null,50)
    where user_id='e9000000-0000-4000-8000-000000000002'
      and fit_report_id='e9400000-0000-4000-8000-000000000001'
      and historical_match_score>=85
  ),
  'cached FITuition preserves historically relevant exact Product evidence after the wearer current body diverges'
);
reset role;

select * from finish();
rollback;
