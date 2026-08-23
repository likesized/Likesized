begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(21);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('ca000000-0000-4000-8000-000000000001','authenticated','authenticated','confidence-1@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000002','authenticated','authenticated','confidence-2@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000003','authenticated','authenticated','confidence-3@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000004','authenticated','authenticated','confidence-4@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000005','authenticated','authenticated','confidence-5@likesized.test',now(),now());

-- Give every test member a valid immutable body snapshot.
do $$
declare
  v_user uuid;
  v_index integer:=0;
begin
  foreach v_user in array array[
    'ca000000-0000-4000-8000-000000000001'::uuid,
    'ca000000-0000-4000-8000-000000000002'::uuid,
    'ca000000-0000-4000-8000-000000000003'::uuid,
    'ca000000-0000-4000-8000-000000000004'::uuid,
    'ca000000-0000-4000-8000-000000000005'::uuid
  ] loop
    v_index:=v_index+1;
    perform set_config('request.jwt.claim.role','authenticated',true);
    perform set_config('request.jwt.claim.sub',v_user::text,true);
    perform public.save_fit_profile(
      'confidence_'||v_index,
      'imperial'::public.unit_system,
      format('[{"measurement_type_key":"height","entered_value":%s,"entered_unit":"in","source":"manual","method":"tape"}]',65+v_index)::jsonb,
      '[]'::jsonb
    );
  end loop;
end;
$$;

insert into public.normalized_sizes(id,kind,normalized_key,display_label,sizing_system,alpha_size)
values('ca100000-0000-4000-8000-000000000001','alpha','test:confidence:alpha:m','M','test','M');

create or replace function pg_temp.add_pending_identity(
  p_user uuid,
  p_model text,
  p_barcode text default null
) returns uuid
language plpgsql
as $$
declare
  v_closet uuid:=gen_random_uuid();
  v_report uuid:=gen_random_uuid();
  v_version uuid;
  v_candidate uuid;
begin
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claim.sub',p_user::text,true);
  select current_version_id into v_version from public.fit_profiles where user_id=p_user;

  insert into public.closet_items(id,user_id,product_id,variant_id,size_label,normalized_size_id,visibility,wears_count)
  values(v_closet,p_user,null,null,'M','ca100000-0000-4000-8000-000000000001','shared',0);

  insert into public.fit_reports(id,user_id,closet_item_id,product_id,variant_id,fit_profile_version_id,size_label,normalized_size_id,fit,garment_condition,reported_condition)
  values(v_report,p_user,v_closet,null,null,v_version,'M','ca100000-0000-4000-8000-000000000001','just_right','normal','new');

  select public.record_pending_garment_submission(
    p_closet_item_id := v_closet,
    p_fit_report_id := v_report,
    p_brand_text := 'Community Confidence Brand',
    p_model_text := p_model,
    p_garment_type_key := 't_shirt',
    p_color_family_key := 'blue',
    p_normalized_size_id := 'ca100000-0000-4000-8000-000000000001',
    p_size_label := 'M',
    p_identifier_type := case when p_barcode is null then null else 'upc' end,
    p_identifier_value := p_barcode
  ) into v_candidate;
  return v_candidate;
end;
$$;

create temporary table confidence_candidates(label text primary key,candidate_id uuid not null);

insert into confidence_candidates values(
  'consensus',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Consensus Tee')
);
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;

select is(
  (select identity_confidence::text from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'provisional',
  'One distinct manual member is provisional'
);
select is(
  (select identity_confirmation_count from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  1,
  'One member contributes one Product-identity confirmation regardless of barcode'
);

select is(
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000002','Consensus Tee'),
  (select candidate_id from confidence_candidates where label='consensus'),
  'Second matching manual entry aggregates into the same Product candidate'
);
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;

select is(
  (select identity_confidence::text from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'corroborated',
  'Two distinct manual members corroborate Product identity without a barcode'
);
select is(
  (select identity_confirmation_count from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  2,
  'Corroboration counts distinct members, not submission volume'
);
select is(
  (select count(*) from public.products p join public.brands b on b.id=p.brand_id where b.normalized_name='communityconfidencebrand' and p.normalized_name='consensustee'),
  0::bigint,
  'Two-member corroboration does not yet create a canonical Product'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  (select default_size_kind from public.lookup_corroborated_candidate_defaults('Community Confidence Brand','Consensus Tee','t_shirt')),
  'alpha',
  'Corroborated unresolved identity exposes only its unique learned broad size-system default'
);
reset role;

select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000003','Consensus Tee');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000004','Consensus Tee');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000005','Consensus Tee');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;

select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'merged',
  'Fifth distinct confirmation automatically resolves the candidate'
);
select is(
  (select p.catalog_status::text from public.products p join public.brands b on b.id=p.brand_id where b.normalized_name='communityconfidencebrand' and p.normalized_name='consensustee'),
  'corroborated',
  'Automatic Product creation is corroborated, never automatically verified'
);
select is(
  (select actor_kind||':'||action from public.catalog_resolution_actions where candidate_id=(select candidate_id from confidence_candidates where label='consensus') order by created_at desc limit 1),
  'system:auto_create_product',
  'Automatic promotion is explicitly recorded as a system catalog action'
);
select is(
  (select count(*) from public.fit_reports fr join public.products p on p.id=fr.product_id where p.normalized_name='consensustee'),
  5::bigint,
  'Automatic promotion reconnects all five historical Fit Reports to one canonical Product'
);

-- A new barcode attached to an already-known Product starts provisional. The second
-- distinct member corroborates that Product->barcode relationship. Another legitimate
-- barcode may then do the same without becoming an identity conflict.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select is(
  public.record_product_barcode_evidence(
    (select p.id from public.products p where p.normalized_name='consensustee'),
    (select fr.id from public.fit_reports fr join public.products p on p.id=fr.product_id where fr.user_id='ca000000-0000-4000-8000-000000000001' and p.normalized_name='consensustee' limit 1),
    '111111111111'
  ),
  'provisional',
  'First member creates a provisional Product-to-barcode relationship'
);
select is(
  (select count(*) from public.product_identifiers pi join public.products p on p.id=pi.product_id where p.normalized_name='consensustee' and pi.normalized_value='111111111111'),
  0::bigint,
  'A one-member barcode relationship is not yet a canonical Product identifier'
);
select is(
  (select product_id from public.lookup_barcode_catalog_match('111111111111')),
  (select p.id from public.products p where p.normalized_name='consensustee'),
  'A unique provisional barcode relationship can still recognize the known Product for the next member'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  public.record_product_barcode_evidence(
    (select p.id from public.products p where p.normalized_name='consensustee'),
    (select fr.id from public.fit_reports fr join public.products p on p.id=fr.product_id where fr.user_id='ca000000-0000-4000-8000-000000000002' and p.normalized_name='consensustee' limit 1),
    '111111111111'
  ),
  'corroborated',
  'Second distinct member corroborates the Product-to-barcode relationship'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select public.record_product_barcode_evidence(
  (select p.id from public.products p where p.normalized_name='consensustee'),
  (select fr.id from public.fit_reports fr join public.products p on p.id=fr.product_id where fr.user_id='ca000000-0000-4000-8000-000000000001' and p.normalized_name='consensustee' limit 1),
  '222222222222'
);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  public.record_product_barcode_evidence(
    (select p.id from public.products p where p.normalized_name='consensustee'),
    (select fr.id from public.fit_reports fr join public.products p on p.id=fr.product_id where fr.user_id='ca000000-0000-4000-8000-000000000002' and p.normalized_name='consensustee' limit 1),
    '222222222222'
  ),
  'corroborated',
  'A second legitimate retailer barcode can independently corroborate to the same Product'
);
reset role;
select ok(
  (select count(*)=2 and bool_and(pi.source_status='corroborated'::public.product_data_status)
   from public.product_identifiers pi join public.products p on p.id=pi.product_id
   where p.normalized_name='consensustee' and pi.normalized_value in ('111111111111','222222222222')),
  'Both corroborated barcodes coexist beneath one Product'
);
select is(
  (select catalog_review_needed from public.products where normalized_name='consensustee'),
  false,
  'Different legitimate barcodes for one Product do not create an identity conflict'
);

-- Two independent identity conflicts stop a five-member candidate from auto-promoting.
insert into confidence_candidates values(
  'blocked',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Blocked Tee')
);
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000002','Blocked Tee');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000003','Blocked Tee');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000004','Blocked Tee');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;
insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by) values
('ambiguous_identity',(select candidate_id from confidence_candidates where label='blocked'),'{}','ca000000-0000-4000-8000-000000000001'),
('possible_duplicate',(select candidate_id from confidence_candidates where label='blocked'),'{}','ca000000-0000-4000-8000-000000000002');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000005','Blocked Tee');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;

select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='blocked')),
  'needs_review',
  'Two independent identity conflicts freeze automatic promotion at Needs Review'
);
select is(
  (select count(*) from public.products where normalized_name='blockedtee'),
  0::bigint,
  'A five-member candidate with two identity conflicts is not auto-promoted'
);

-- One conflict is retained for review but does not let one outlier permanently block a
-- five-member consensus.
insert into confidence_candidates values(
  'one_conflict',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','One Conflict Tee')
);
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000002','One Conflict Tee');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000003','One Conflict Tee');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000004','One Conflict Tee');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;
insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
values('ambiguous_identity',(select candidate_id from confidence_candidates where label='one_conflict'),'{}','ca000000-0000-4000-8000-000000000001');
select pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000005','One Conflict Tee');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;

select ok(
  (select c.status='merged' and p.catalog_status='corroborated'::public.product_data_status and p.catalog_review_needed
   from public.catalog_candidates c join public.products p on p.id=c.resolved_product_id
   where c.id=(select candidate_id from confidence_candidates where label='one_conflict')),
  'Five confirmations and one conflict may auto-promote while keeping the Product marked for review'
);

select * from finish();
rollback;