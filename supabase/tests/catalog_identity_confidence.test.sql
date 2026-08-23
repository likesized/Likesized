begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(22);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('ca000000-0000-4000-8000-000000000001','authenticated','authenticated','confidence-1@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000002','authenticated','authenticated','confidence-2@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000003','authenticated','authenticated','confidence-3@likesized.test',now(),now());

-- Give every test member a valid immutable body snapshot.
do $$
declare
  v_user uuid;
  v_index integer:=0;
begin
  foreach v_user in array array[
    'ca000000-0000-4000-8000-000000000001'::uuid,
    'ca000000-0000-4000-8000-000000000002'::uuid,
    'ca000000-0000-4000-8000-000000000003'::uuid
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
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'merged',
  'A clean first-member candidate resolves automatically instead of waiting for routine admin review'
);
select is(
  (select p.catalog_status::text from public.catalog_candidates c join public.products p on p.id=c.resolved_product_id where c.id=(select candidate_id from confidence_candidates where label='consensus')),
  'provisional',
  'The first unique member auto-posts the Product at the lowest Provisional trust tier'
);
select is(
  (select p.identity_confirmation_count from public.catalog_candidates c join public.products p on p.id=c.resolved_product_id where c.id=(select candidate_id from confidence_candidates where label='consensus')),
  1,
  'The new Product records one distinct member identity confirmation'
);
select is(
  (select count(*) from public.fit_reports fr join public.catalog_candidates c on c.resolved_product_id=fr.product_id where c.id=(select candidate_id from confidence_candidates where label='consensus')),
  1::bigint,
  'The original Fit Report is immediately reconnected to the auto-posted Product'
);
select is(
  (select actor_kind||':'||action from public.catalog_resolution_actions where candidate_id=(select candidate_id from confidence_candidates where label='consensus') order by created_at desc limit 1),
  'system:auto_create_product',
  'First-member auto-post remains an audited system action rather than direct member Product authority'
);
select is(
  (select catalog_review_needed from public.products where id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus'))),
  false,
  'A unique clean first item does not manufacture an admin review task'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000003';
select public.report_product_item(
  (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'incorrect_information',
  'The product information looks wrong.'
);
reset role;
select is(
  (select priority from public.catalog_review_flags where product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) and flag_type='member_report' and status='open'),
  'high',
  'A member report on an uncorroborated Provisional Product is High priority'
);
update public.catalog_review_flags set status='resolved',resolved_at=now() where product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) and flag_type='member_report';

-- A second distinct member using the now-searchable Product promotes Provisional to Corroborated.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select * from public.save_known_fit_report(
  'ca200000-0000-4000-8000-000000000002'::uuid,
  (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  (select pv.id from public.product_variants pv where pv.product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) order by pv.id limit 1),
  (select current_version_id from public.fit_profiles where user_id='ca000000-0000-4000-8000-000000000002'),
  'M',
  'ca100000-0000-4000-8000-000000000001'::uuid,
  'just_right'::public.fit_rating,
  'normal'::public.garment_condition,
  'new',
  null,
  't_shirt',
  '{}'::jsonb,
  repeat('b',64)
);
reset role;
select is(
  (select catalog_status::text from public.products where id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus'))),
  'corroborated',
  'A second distinct member promotes the Provisional Product to Corroborated'
);
select is(
  (select identity_confirmation_count from public.products where id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus'))),
  2,
  'Product trust counts distinct attached member Fit Reports'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000003';
select public.report_product_item(
  (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'image_mismatch',
  'The image appears to show a different item.'
);
reset role;
select is(
  (select priority from public.catalog_review_flags where product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) and flag_type='member_report' and status='open'),
  'medium',
  'A single report on Corroborated content is Medium priority'
);
update public.products set catalog_status='verified' where id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus'));
select is(
  (select priority from public.catalog_review_flags where product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) and flag_type='member_report' and status='open'),
  'low',
  'A single ordinary report on Verified content is Low priority until independent signals accumulate'
);

-- Barcode relationship confidence remains separate from Product identity confidence.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select is(
  public.record_product_barcode_evidence(
    (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
    (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000001' and fr.product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) limit 1),
    '111111111111'
  ),
  'provisional',
  'First member still creates only a provisional Product-to-barcode relationship'
);
select is(
  (select count(*) from public.product_identifiers where product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) and normalized_value='111111111111'),
  0::bigint,
  'One-member barcode evidence is not yet a canonical identifier'
);
select is(
  (select product_id from public.lookup_barcode_catalog_match('111111111111')),
  (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  'Unique provisional barcode evidence can recognize the Product for the next member'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  public.record_product_barcode_evidence(
    (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
    (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000002' and fr.product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) limit 1),
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
  (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
  (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000001' and fr.product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) limit 1),
  '222222222222'
);
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  public.record_product_barcode_evidence(
    (select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')),
    (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000002' and fr.product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus')) limit 1),
    '222222222222'
  ),
  'corroborated',
  'A second legitimate barcode can independently corroborate to the same Product'
);
reset role;
select ok(
  (select count(*)=2 and bool_and(source_status='corroborated'::public.product_data_status)
   from public.product_identifiers
   where product_id=(select resolved_product_id from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='consensus'))
     and normalized_value in ('111111111111','222222222222')),
  'Multiple legitimate corroborated barcodes coexist beneath one Product'
);

-- A blocking conflict before first auto-post keeps the candidate unresolved for review.
insert into confidence_candidates values(
  'blocked',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Blocked Tee')
);
insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
values('ambiguous_identity',(select candidate_id from confidence_candidates where label='blocked'),jsonb_build_object('reason','Conflicting identity evidence'),'ca000000-0000-4000-8000-000000000003');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;
select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='blocked')),
  'needs_review',
  'A blocking conflict prevents automatic first-post resolution'
);
select is(
  (select count(*) from public.products where normalized_name='blockedtee'),
  0::bigint,
  'A flagged unresolved candidate is not auto-posted as questionable Product truth'
);
select is(
  (select priority from public.catalog_review_flags where candidate_id=(select candidate_id from confidence_candidates where label='blocked') and status='open' limit 1),
  'high',
  'An uncorroborated flagged candidate is High priority'
);

-- Conservative same-brand/type prefix similarity is an internal duplicate signal. It
-- does not stop the new unique Product from posting; it flags the provisional record.
insert into confidence_candidates values(
  'neighbor',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Consensus Tee Long')
);
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;
select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_candidates where label='neighbor')),
  'merged',
  'A near-name item still posts instead of waiting for routine manual approval'
);
select is(
  (select count(*) from public.catalog_review_flags f join public.catalog_candidates c on c.resolved_product_id=f.product_id where c.id=(select candidate_id from confidence_candidates where label='neighbor') and f.flag_type='possible_duplicate' and f.status='open'),
  1::bigint,
  'Internal similar-name detection raises a possible-duplicate review flag after posting'
);
select is(
  (select priority from public.catalog_review_flags f join public.catalog_candidates c on c.resolved_product_id=f.product_id where c.id=(select candidate_id from confidence_candidates where label='neighbor') and f.flag_type='possible_duplicate' and f.status='open'),
  'high',
  'A possible duplicate on a new Provisional Product is High priority'
);

select * from finish();
rollback;
