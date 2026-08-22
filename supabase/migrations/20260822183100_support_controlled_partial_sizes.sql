-- Keep the canonical size parser aligned with controlled intake choices, including partial Not sure selections.
create or replace function public.parse_garment_size(p_label text,p_kind public.garment_size_kind default null,p_system text default null)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  raw text := btrim(coalesce(p_label,''));
  compact text;
  kind public.garment_size_kind := p_kind;
  a text[];
  b text[];
  waist numeric;
  inseam numeric;
  collar numeric;
  sleeve1 numeric;
  sleeve2 numeric;
  jacket numeric;
  band integer;
  cup text;
  alpha text;
  n numeric;
  length_code text;
  system_code text;
begin
  if raw = '' then raise exception 'Size label is required'; end if;
  compact := upper(regexp_replace(replace(replace(raw,'×','X'),'–','-'), '[[:space:]]+', '', 'g'));

  if kind is null then
    if compact in ('?','NOTSURE','NOT_SURE') then kind := 'not_sure';
    elsif compact ~ '^[0-9]{4}$' then kind := 'waist_inseam';
    elsif compact ~ '^[0-9]+(\.[0-9]+)?/[0-9]+(-[0-9]+)?$' then kind := 'dress_shirt';
    elsif compact ~ '^[0-9]{2,3}[RSL]$' then kind := 'jacket';
    elsif compact ~ '^[0-9]{2,3}[A-Z]{1,3}$' then kind := 'bra';
    elsif compact ~ '^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[0-9]+X(L)?)$' then kind := 'alpha';
    elsif compact ~ '^[0-9]+(\.[0-9]+)?$' then kind := 'numeric';
    else kind := 'freeform'; end if;
  end if;

  if kind = 'not_sure' then
    return jsonb_build_object('kind','not_sure','normalized_key','not_sure','display_label','Not sure');

  elsif kind = 'waist_inseam' then
    a := regexp_match(compact, '^([0-9]+(?:\.[0-9]+)?|\?)[X/]([0-9]+(?:\.[0-9]+)?|\?)$');
    if a is null then raise exception 'Invalid waist/inseam size'; end if;
    waist := case when a[1]='?' then null else a[1]::numeric end;
    inseam := case when a[2]='?' then null else a[2]::numeric end;
    return jsonb_build_object(
      'kind','waist_inseam',
      'normalized_key','waist_inseam:'||coalesce(waist::text,'?')||':'||coalesce(inseam::text,'?'),
      'display_label',coalesce(waist::text,'?')||'×'||coalesce(inseam::text,'?'),
      'waist_size',waist,
      'inseam_size',inseam
    );

  elsif kind = 'dress_shirt' then
    a := regexp_match(compact, '^([0-9]+(?:\.[0-9]+)?|\?)/([0-9]+(?:-[0-9]+)?|\?)$');
    if a is null then raise exception 'Invalid dress shirt size'; end if;
    collar := case when a[1]='?' then null else a[1]::numeric end;
    if a[2]='?' then
      sleeve1 := null;
      sleeve2 := null;
    else
      b := regexp_match(a[2], '^([0-9]+)(?:-([0-9]+))?$');
      if b is null then raise exception 'Invalid dress shirt sleeve size'; end if;
      sleeve1 := b[1]::numeric;
      sleeve2 := coalesce(b[2]::numeric,sleeve1);
    end if;
    return jsonb_build_object(
      'kind','dress_shirt',
      'normalized_key','dress_shirt:'||coalesce(collar::text,'?')||':'||coalesce(sleeve1::text,'?')||':'||coalesce(sleeve2::text,'?'),
      'display_label',coalesce(collar::text,'?')||' / '||case when sleeve1 is null then '?' when sleeve2<>sleeve1 then sleeve1::text||'-'||sleeve2::text else sleeve1::text end,
      'collar_size',collar,
      'sleeve_min',sleeve1,
      'sleeve_max',sleeve2
    );

  elsif kind = 'jacket' then
    a := regexp_match(compact, '^([0-9]{2,3}|\?)([RSL?])$');
    if a is null then raise exception 'Invalid jacket size'; end if;
    jacket := case when a[1]='?' then null else a[1]::numeric end;
    length_code := case a[2] when 'S' then 'short' when 'L' then 'long' when 'R' then 'regular' else null end;
    return jsonb_build_object(
      'kind','jacket',
      'normalized_key','jacket:'||coalesce(jacket::text,'?')||':'||coalesce(length_code,'?'),
      'display_label',coalesce(jacket::text,'?')||a[2],
      'jacket_chest_size',jacket,
      'length_designation',length_code
    );

  elsif kind = 'bra' then
    a := regexp_match(compact, '^([0-9]{2,3}|\?)([A-Z]{1,3}|\?)$');
    if a is null then raise exception 'Invalid bra size'; end if;
    band := case when a[1]='?' then null else a[1]::integer end;
    cup := case when a[2]='?' then null else a[2] end;
    system_code := case
      when btrim(coalesce(p_system,''))='' or upper(btrim(p_system)) in ('?','NOTSURE','NOT_SURE') then '?'
      else upper(btrim(p_system))
    end;
    return jsonb_build_object(
      'kind','bra',
      'normalized_key','bra:'||system_code||':'||coalesce(band::text,'?')||':'||coalesce(cup,'?'),
      'display_label',coalesce(band::text,'?')||coalesce(cup,'?'),
      'bra_band',band,
      'bra_cup',cup,
      'sizing_system',case when system_code='?' then null else system_code end
    );

  elsif kind = 'shoe' then
    system_code := case
      when btrim(coalesce(p_system,''))='' or upper(btrim(p_system)) in ('?','NOTSURE','NOT_SURE') then '?'
      else upper(btrim(p_system))
    end;
    if compact='?' then n := null;
    elsif compact ~ '^[0-9]+(\.[0-9]+)?$' then n := compact::numeric;
    else raise exception 'Invalid shoe size'; end if;
    return jsonb_build_object(
      'kind','shoe',
      'normalized_key','shoe:'||system_code||':'||coalesce(n::text,'?'),
      'display_label',coalesce(n::text,'?'),
      'shoe_size',n,
      'sizing_system',case when system_code='?' then null else system_code end
    );

  elsif kind = 'alpha' then
    if compact='?' then alpha := null;
    elsif compact ~ '^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[0-9]+X(L)?)$' then alpha := compact;
    else raise exception 'Invalid alpha size'; end if;
    return jsonb_build_object(
      'kind','alpha',
      'normalized_key','alpha:'||coalesce(alpha,'?'),
      'display_label',coalesce(alpha,'?'),
      'alpha_size',alpha
    );

  elsif kind = 'numeric' then
    if compact='?' then n := null;
    elsif compact ~ '^[0-9]+(\.[0-9]+)?$' then n := compact::numeric;
    else raise exception 'Invalid numeric size'; end if;
    return jsonb_build_object(
      'kind','numeric',
      'normalized_key','numeric:'||coalesce(n::text,'?'),
      'display_label',coalesce(n::text,'?'),
      'numeric_size',n
    );

  elsif kind = 'length_designation' then
    if compact='?' or compact in ('NOTSURE','NOT_SURE') then length_code := null;
    else
      length_code := lower(compact);
      if length_code not in ('short','regular','long','petite','tall') then raise exception 'Invalid length designation'; end if;
    end if;
    return jsonb_build_object(
      'kind','length_designation',
      'normalized_key','length:'||coalesce(length_code,'?'),
      'display_label',case when length_code is null then '?' else initcap(length_code) end,
      'length_designation',length_code
    );

  else
    return jsonb_build_object(
      'kind','freeform',
      'normalized_key','freeform:'||coalesce(public.normalize_search_text(raw), lower(raw)),
      'display_label',raw,
      'freeform_normalized',coalesce(public.normalize_search_text(raw), lower(raw))
    );
  end if;
end;
$$;
