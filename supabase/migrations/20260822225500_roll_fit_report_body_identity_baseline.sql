-- A garment-relevant body measurement that remains within the accepted <2%
-- same-report threshold becomes the new comparison baseline for the next save.
-- Immutable Fit Profile versions remain unchanged; this table is only the
-- rolling counted-report identity baseline.

create or replace function private.roll_fit_report_body_identity_baseline()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
begin
  if new.product_id is null or new.match_fit_profile_version_id is null then
    return new;
  end if;

  insert into private.fit_report_body_identity_measurements as baseline(
    fit_report_id,
    measurement_type_key,
    value_canonical,
    source_profile_version_id
  )
  select
    new.id,
    pm.measurement_type_key,
    current_measurement.value_canonical,
    new.match_fit_profile_version_id
  from private.product_match_measurements(new.product_id) pm
  join public.fit_profile_version_measurements current_measurement
    on current_measurement.fit_profile_version_id=new.match_fit_profile_version_id
   and current_measurement.measurement_type_key=pm.measurement_type_key
   and current_measurement.value_canonical is not null
   and current_measurement.value_canonical>0
  on conflict on constraint fit_report_body_identity_measurements_pkey
  do update set
    value_canonical=excluded.value_canonical,
    source_profile_version_id=excluded.source_profile_version_id;

  return new;
end;
$function$;

revoke all on function private.roll_fit_report_body_identity_baseline() from public,anon,authenticated;

drop trigger if exists fit_reports_roll_body_identity_baseline on public.fit_reports;
create trigger fit_reports_roll_body_identity_baseline
after update of match_fit_profile_version_id on public.fit_reports
for each row
when (new.match_fit_profile_version_id is distinct from old.match_fit_profile_version_id)
execute function private.roll_fit_report_body_identity_baseline();

-- Bring already-accepted same-report enrichments/under-threshold changes onto
-- the rolling rule immediately. Missing relevant values are not removed.
insert into private.fit_report_body_identity_measurements as baseline(
  fit_report_id,
  measurement_type_key,
  value_canonical,
  source_profile_version_id
)
select
  fr.id,
  pm.measurement_type_key,
  current_measurement.value_canonical,
  coalesce(fr.match_fit_profile_version_id,fr.fit_profile_version_id)
from public.fit_reports fr
cross join lateral private.product_match_measurements(fr.product_id) pm
join public.fit_profile_version_measurements current_measurement
  on current_measurement.fit_profile_version_id=coalesce(fr.match_fit_profile_version_id,fr.fit_profile_version_id)
 and current_measurement.measurement_type_key=pm.measurement_type_key
 and current_measurement.value_canonical is not null
 and current_measurement.value_canonical>0
where fr.product_id is not null
on conflict on constraint fit_report_body_identity_measurements_pkey
do update set
  value_canonical=excluded.value_canonical,
  source_profile_version_id=excluded.source_profile_version_id;
