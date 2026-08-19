create or replace function private.enforce_fit_report_dimension_garment_type()
returns trigger
language plpgsql
set search_path=''
as $$
declare
  v_garment_type_key text;
begin
  select p.garment_type_key
    into v_garment_type_key
  from public.fit_reports fr
  join public.products p on p.id=fr.product_id
  where fr.id=new.fit_report_id;

  if v_garment_type_key is null then
    raise exception 'Fit Report garment type is unavailable';
  end if;

  if not exists (
    select 1
    from public.garment_type_fit_dimensions gfd
    where gfd.garment_type_key=v_garment_type_key
      and gfd.dimension_key=new.dimension_key
  ) then
    raise exception 'Fit dimension % is not valid for garment type %', new.dimension_key, v_garment_type_key;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_fit_report_dimension_garment_type() from public,anon,authenticated;

drop trigger if exists fit_report_dimension_garment_type_guard on public.fit_report_dimensions;
create trigger fit_report_dimension_garment_type_guard
before insert or update on public.fit_report_dimensions
for each row execute function private.enforce_fit_report_dimension_garment_type();

comment on function private.enforce_fit_report_dimension_garment_type() is
  'Trigger-only guard ensuring a controlled Fit Report dimension belongs to the garment type of that immutable Fit Report.';
