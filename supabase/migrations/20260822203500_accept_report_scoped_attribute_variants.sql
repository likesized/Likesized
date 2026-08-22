-- Controlled garment answers collected on a Fit Report may legitimately differ under the same
-- Product umbrella because objective answer changes define separate fit variants. Keep those
-- report-scoped observations as raw evidence and do not force them into the legacy single-value
-- Product attribute slot or mark the Product as conflicting. Trusted non-report catalog facts and
-- legacy evidence keep the existing behavior.

create or replace function private.apply_product_attribute_evidence()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_existing public.product_attribute_values%rowtype;
  v_has_existing boolean:=false;
  v_agree integer;
  v_conflict integer;
begin
  if new.source_status='rejected'::public.product_data_status then return new; end if;

  -- Fit Report answers are intentionally multi-valued under a Product. Their exact observation
  -- lives on the Fit Report / evidence row and is used for variant-aware filtering and matching.
  if new.source_type='member'::public.product_data_source and new.fit_report_id is not null then
    return new;
  end if;

  select * into v_existing from public.product_attribute_values
  where product_id=new.product_id and attribute_key=new.attribute_key;
  v_has_existing:=found;

  if new.source_type in ('manufacturer'::public.product_data_source,'retailer'::public.product_data_source,'barcode_catalog'::public.product_data_source,'admin'::public.product_data_source,'system'::public.product_data_source)
     and new.source_status='verified'::public.product_data_status then
    insert into public.product_attribute_values(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.attribute_key,new.option_key,new.source_type,'verified',greatest(new.confidence,.95),new.source_reference,now())
    on conflict(product_id,attribute_key) do update set option_key=excluded.option_key,source_type=excluded.source_type,source_status=excluded.source_status,confidence=excluded.confidence,source_reference=excluded.source_reference,updated_at=now();
    return new;
  end if;

  if v_has_existing and v_existing.source_status='verified'::public.product_data_status then
    if v_existing.option_key<>new.option_key then update public.products set catalog_review_needed=true where id=new.product_id; end if;
    return new;
  end if;

  select count(distinct submitted_by) into v_agree
  from public.product_attribute_evidence
  where product_id=new.product_id and attribute_key=new.attribute_key and option_key=new.option_key
    and source_type='member'::public.product_data_source and source_status<>'rejected'::public.product_data_status;
  select count(distinct submitted_by) into v_conflict
  from public.product_attribute_evidence
  where product_id=new.product_id and attribute_key=new.attribute_key and option_key<>new.option_key
    and source_type='member'::public.product_data_source and source_status<>'rejected'::public.product_data_status;

  if v_conflict>0 then update public.products set catalog_review_needed=true where id=new.product_id; end if;

  if v_agree>=2 and v_agree>v_conflict then
    insert into public.product_attribute_values(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.attribute_key,new.option_key,'member','corroborated',greatest(.80,new.confidence),new.source_reference,now())
    on conflict(product_id,attribute_key) do update set option_key=excluded.option_key,source_type=excluded.source_type,source_status=excluded.source_status,confidence=excluded.confidence,source_reference=excluded.source_reference,updated_at=now()
    where public.product_attribute_values.source_status<>'verified'::public.product_data_status;
  elsif not v_has_existing then
    insert into public.product_attribute_values(product_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,updated_at)
    values(new.product_id,new.attribute_key,new.option_key,'member','provisional',least(new.confidence,.60),new.source_reference,now());
  elsif v_existing.option_key=new.option_key then
    update public.product_attribute_values set confidence=greatest(confidence,least(new.confidence,.60)),updated_at=now()
    where product_id=new.product_id and attribute_key=new.attribute_key and source_status='provisional'::public.product_data_status;
  end if;
  return new;
end;
$$;

revoke all on function private.apply_product_attribute_evidence() from public,anon,authenticated;
