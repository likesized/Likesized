begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(30);

insert into auth.users(id,aud,role,email,created_at,updated_at) values
('ca000000-0000-4000-8000-000000000001','authenticated','authenticated','confidence-1@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000002','authenticated','authenticated','confidence-2@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000003','authenticated','authenticated','confidence-3@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000004','authenticated','authenticated','confidence-4@likesized.test',now(),now()),
('ca000000-0000-4000-8000-000000000005','authenticated','authenticated','confidence-5@likesized.test',now(),now());

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

create or replace function pg_temp.add_known_wearer(p_user uuid,p_product uuid,p_fingerprint text)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claim.sub',p_user::text,true);
  perform public.save_known_fit_report(
    gen_random_uuid(),
    p_product,
    (select pv.id from public.product_variants pv where pv.product_id=p_product order by pv.id limit 1),
    (select current_version_id from public.fit_profiles where user_id=p_user),
    'M',
    'ca100000-0000-4000-8000-000000000001'::uuid,
    'just_right'::public.fit_rating,
    'normal'::public.garment_condition,
    'new',
    null,
    't_shirt',
    '{}'::jsonb,
    p_fingerprint
  );
end;
$$;

create temporary table confidence_subjects(
  label text primary key,
  candidate_id uuid not null,
  product_id uuid
);
grant select on confidence_subjects to authenticated;

insert into confidence_subjects(label,candidate_id) values(
  'consensus',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Consensus Tee')
);
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;

update confidence_subjects s
set product_id=c.resolved_product_id
from public.catalog_candidates c
where c.id=s.candidate_id and s.label='consensus';

select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_subjects where label='consensus')),
  'merged',
  'A clean first-member candidate resolves automatically instead of waiting for routine admin review'
);
select isnt(
  (select product_id from confidence_subjects where label='consensus'),
  null::uuid,
  'The resolved Product id is saved before the test changes authenticated roles'
);
select is(
  (select identity_trust_tier from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'provisional',
  'One distinct wearer is the lowest Provisional Product identity-trust tier'
);
select is(
  (select identity_confirmation_count from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  1,
  'The first Product records one distinct wearer'
);
select is(
  (select catalog_status::text from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'provisional',
  'Publishing at one wearer does not invent stronger Product-fact authority'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000003';
select public.report_product_item(
  (select product_id from confidence_subjects where label='consensus'),
  'incorrect_information',
  'The product information looks wrong.'
);
reset role;
select is(
  (select priority from public.catalog_review_flags where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report' and status='open'),
  'high',
  'An issue against one Provisional wearer is High priority'
);
update public.catalog_review_flags set status='resolved',resolved_at=now()
where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report';

select pg_temp.add_known_wearer(
  'ca000000-0000-4000-8000-000000000002',
  (select product_id from confidence_subjects where label='consensus'),
  repeat('b',64)
);
select is(
  (select identity_trust_tier from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'corroborated',
  'Two distinct wearers promote identity trust to Corroborated'
);
select is(
  (select identity_confirmation_count from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  2,
  'Corroborated identity records two distinct wearers'
);
select is(
  (select catalog_status::text from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'provisional',
  'Identity corroboration stays separate from unrelated Product-fact catalog status'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000003';
select public.report_product_item(
  (select product_id from confidence_subjects where label='consensus'),
  'image_mismatch',
  'The image appears to show a different item.'
);
reset role;
select is(
  (select priority from public.catalog_review_flags where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report' and status='open'),
  'high',
  'An issue against only two Corroborated wearers is still High priority'
);
update public.catalog_review_flags set status='resolved',resolved_at=now()
where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report';

select pg_temp.add_known_wearer('ca000000-0000-4000-8000-000000000003',(select product_id from confidence_subjects where label='consensus'),repeat('c',64));
select pg_temp.add_known_wearer('ca000000-0000-4000-8000-000000000004',(select product_id from confidence_subjects where label='consensus'),repeat('d',64));
select pg_temp.add_known_wearer('ca000000-0000-4000-8000-000000000005',(select product_id from confidence_subjects where label='consensus'),repeat('e',64));
select is(
  (select identity_trust_tier from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'established',
  'Five distinct agreeing wearers preserve the stronger Established evidence milestone'
);
select is(
  (select identity_confirmation_count from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  5,
  'Established identity records the five-wearer evidence threshold'
);
select is(
  (select catalog_status::text from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'provisional',
  'Five-wearer identity strength does not silently verify Product facts'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select public.report_product_item((select product_id from confidence_subjects where label='consensus'),'incorrect_information','One later report against five agreeing wearers.');
reset role;
select is(
  (select priority from public.catalog_review_flags where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report' and status='open'),
  'low',
  'One isolated report against Established evidence starts Low because an entry error is more likely'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select public.report_product_item((select product_id from confidence_subjects where label='consensus'),'incorrect_information','Second independent report.');
reset role;
select is(
  (select max(priority) from public.catalog_review_flags where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report' and status='open'),
  'medium',
  'A second independent Established conflict escalates to Medium'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000003';
select public.report_product_item((select product_id from confidence_subjects where label='consensus'),'incorrect_information','Third independent report.');
reset role;
select is(
  (select min(priority) from public.catalog_review_flags where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report' and status='open'),
  'high',
  'Three independent Established conflicts escalate the Product to High priority'
);

update public.catalog_review_flags set status='resolved',resolved_at=now()
where product_id=(select product_id from confidence_subjects where label='consensus') and status='open';
update public.products set catalog_status='verified'
where id=(select product_id from confidence_subjects where label='consensus');
select is(
  (select identity_trust_tier from public.products where id=(select product_id from confidence_subjects where label='consensus')),
  'verified',
  'Authoritative Verified Product is the fourth and strongest identity-trust tier'
);

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000005';
select public.report_product_item((select product_id from confidence_subjects where label='consensus'),'other','Single ordinary concern on Verified content.');
reset role;
select is(
  (select priority from public.catalog_review_flags where product_id=(select product_id from confidence_subjects where label='consensus') and flag_type='member_report' and status='open'),
  'low',
  'A single ordinary report on Verified content is Low priority'
);
update public.catalog_review_flags set status='resolved',resolved_at=now()
where product_id=(select product_id from confidence_subjects where label='consensus') and status='open';

-- Barcode relationship confidence remains separate from Product identity confidence.
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000001';
select is(
  public.record_product_barcode_evidence(
    (select product_id from confidence_subjects where label='consensus'),
    (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000001' and fr.product_id=(select product_id from confidence_subjects where label='consensus') limit 1),
    '111111111111'
  ),
  'provisional',
  'First member still creates only a provisional Product-to-barcode relationship'
);
select is(
  (select count(*) from public.product_identifiers where product_id=(select product_id from confidence_subjects where label='consensus') and normalized_value='111111111111'),
  0::bigint,
  'One-member barcode evidence is not yet a canonical identifier'
);
select is(
  (select product_id from public.lookup_barcode_catalog_match('111111111111')),
  (select product_id from confidence_subjects where label='consensus'),
  'Unique provisional barcode evidence can recognize the Product for the next member'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  public.record_product_barcode_evidence(
    (select product_id from confidence_subjects where label='consensus'),
    (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000002' and fr.product_id=(select product_id from confidence_subjects where label='consensus') limit 1),
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
  (select product_id from confidence_subjects where label='consensus'),
  (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000001' and fr.product_id=(select product_id from confidence_subjects where label='consensus') limit 1),
  '222222222222'
);
reset role;

set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ca000000-0000-4000-8000-000000000002';
select is(
  public.record_product_barcode_evidence(
    (select product_id from confidence_subjects where label='consensus'),
    (select fr.id from public.fit_reports fr where fr.user_id='ca000000-0000-4000-8000-000000000002' and fr.product_id=(select product_id from confidence_subjects where label='consensus') limit 1),
    '222222222222'
  ),
  'corroborated',
  'A second legitimate barcode can independently corroborate to the same Product'
);
reset role;
select ok(
  (select count(*)=2 and bool_and(source_status='corroborated'::public.product_data_status)
   from public.product_identifiers
   where product_id=(select product_id from confidence_subjects where label='consensus')
     and normalized_value in ('111111111111','222222222222')),
  'Multiple legitimate corroborated barcodes coexist beneath one Product'
);

-- A blocking conflict before the deferred auto-post keeps the candidate unresolved.
insert into confidence_subjects(label,candidate_id) values(
  'blocked',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Blocked Tee')
);
insert into public.catalog_review_flags(flag_type,candidate_id,details,created_by)
values('ambiguous_identity',(select candidate_id from confidence_subjects where label='blocked'),jsonb_build_object('reason','Conflicting identity evidence'),'ca000000-0000-4000-8000-000000000003');
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;
select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_subjects where label='blocked')),
  'needs_review',
  'A blocking conflict prevents automatic first-post resolution'
);
select is(
  (select count(*) from public.products where normalized_name='blockedtee'),
  0::bigint,
  'A flagged unresolved candidate is not auto-posted as questionable Product truth'
);
select is(
  (select priority from public.catalog_review_flags where candidate_id=(select candidate_id from confidence_subjects where label='blocked') and status='open' limit 1),
  'high',
  'An unresolved uncorroborated candidate flag is High priority'
);

-- Conservative similar-name detection is review evidence, never fuzzy auto-merge.
insert into confidence_subjects(label,candidate_id) values(
  'neighbor',
  pg_temp.add_pending_identity('ca000000-0000-4000-8000-000000000001','Consensus Tee Long')
);
set constraints refresh_candidate_identity_after_submission immediate;
set constraints refresh_candidate_identity_after_submission deferred;
select is(
  (select status from public.catalog_candidates where id=(select candidate_id from confidence_subjects where label='neighbor')),
  'merged',
  'A near-name clean item still posts instead of waiting for routine manual approval'
);
select is(
  (select count(*) from public.catalog_review_flags f join public.catalog_candidates c on c.resolved_product_id=f.product_id where c.id=(select candidate_id from confidence_subjects where label='neighbor') and f.flag_type='possible_duplicate' and f.status='open'),
  1::bigint,
  'Internal similar-name detection raises a possible-duplicate review flag after posting'
);
select is(
  (select priority from public.catalog_review_flags f join public.catalog_candidates c on c.resolved_product_id=f.product_id where c.id=(select candidate_id from confidence_subjects where label='neighbor') and f.flag_type='possible_duplicate' and f.status='open'),
  'high',
  'A possible duplicate on a one-wearer Provisional Product is High priority'
);

select * from finish();
rollback;