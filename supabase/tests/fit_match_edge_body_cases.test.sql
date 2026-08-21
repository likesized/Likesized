begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

select is(private.fit_measurement_similarity(80,80,12.7),1::numeric,'exact low-range measurement remains 100% similar');
select is(private.fit_measurement_similarity(250,250,12.7),1::numeric,'exact high-range measurement remains 100% similar');
select is(private.fit_measurement_similarity(80,200,12.7),private.fit_measurement_similarity(200,80,12.7),'similarity remains symmetric at extreme differences');
select ok(private.fit_measurement_similarity(80,200,12.7)>=0,'extreme difference never produces a negative similarity');
select ok(private.fit_measurement_similarity(80,200,12.7)<=1,'extreme difference never exceeds one');
select is(private.fit_proportion_similarity(.5,.5,.1),1::numeric,'exact uncommon proportion remains fully similar');
select is(private.fit_proportion_similarity(.5,2,.1),private.fit_proportion_similarity(2,.5,.1),'proportion similarity remains symmetric for uncommon proportions');
select ok(private.apply_proportion_refinement(50,1,.08)<=54,'derived proportions cannot add more than four Match points');
select ok(private.apply_proportion_refinement(50,0,.08)>=46,'derived proportions cannot subtract more than four Match points');
select ok(private.confidence_adjusted_match(1,1,.35,.35,1,2,6)<=100,'thin evidence remains bounded instead of falsely exceeding 100');
select ok(private.measurement_freshness_factor('natural_waist',now()-interval '10 years',now())>=.95,'staleness never zeroes a valid edge-body measurement');

select * from finish();
rollback;
