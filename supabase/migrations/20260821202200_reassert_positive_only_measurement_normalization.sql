-- LikeSized accepts valid positive body measurements without anatomical plausibility gates.
-- Measurement precision, units, positivity, and known measurement-type validation remain enforced.

create or replace function private.normalize_body_measurement()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  mt public.measurement_types%rowtype;
  v_step numeric;
  v_value numeric;
  v_canonical numeric;
begin
  select * into mt
  from public.measurement_types
  where key = new.measurement_type_key;

  if not found then
    raise exception 'Unknown measurement type';
  end if;

  if mt.dimension = 'length' and new.entered_unit not in ('in'::public.measurement_unit, 'cm'::public.measurement_unit) then
    raise exception 'Length measurement requires inches or centimeters';
  end if;

  if mt.dimension = 'weight' and new.entered_unit not in ('lb'::public.measurement_unit, 'kg'::public.measurement_unit) then
    raise exception 'Weight measurement requires pounds or kilograms';
  end if;

  v_value := new.entered_value;
  if v_value is null or v_value <= 0 then
    raise exception 'Measurement must be a positive number';
  end if;

  if new.source = 'manual'::public.measurement_source then
    if new.entered_unit in ('in'::public.measurement_unit, 'lb'::public.measurement_unit) then
      v_step := mt.manual_step_imperial;
    else
      v_step := mt.manual_step_metric;
    end if;
    v_value := round(v_value / v_step) * v_step;
  end if;

  v_canonical := case new.entered_unit
    when 'in'::public.measurement_unit then v_value * 2.54
    when 'cm'::public.measurement_unit then v_value
    when 'lb'::public.measurement_unit then v_value * 0.45359237
    when 'kg'::public.measurement_unit then v_value
  end;

  if v_value <= 0 or v_canonical is null or v_canonical <= 0 then
    raise exception 'Measurement must be a positive number';
  end if;

  new.entered_value := round(v_value, 6);
  new.value_canonical := round(v_canonical, 6);
  new.updated_at := now();
  return new;
end;
$$;
