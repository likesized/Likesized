-- Report-scoped member evidence replacement needs to delete the prior observation for the
-- same Fit Report before inserting its latest snapshot. Evidence tables intentionally do not
-- expose direct DELETE access to members, so keep that mutation inside the ownership-checked RPC.

create or replace function public.record_member_product_evidence(
  p_product_id uuid,
  p_fit_report_id uuid,
  p_garment_type text,
  p_market_segment text,
  p_attributes jsonb default '[]'::jsonb,
  p_materials jsonb default '[]'::jsonb,
  p_department text default null,
  p_source_reference text default null
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_row jsonb;
  v_attribute_key text;
  v_option_key text;
  v_material_key text;
  v_percentage numeric;
  v_reference text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists(
    select 1 from public.fit_reports
    where id=p_fit_report_id and user_id=v_user_id and product_id=p_product_id
  ) then raise exception 'Unknown member Fit Report'; end if;
  if not exists(select 1 from public.products where id=p_product_id and catalog_status<>'rejected'::public.product_data_status) then raise exception 'Unknown Product'; end if;
  if not exists(select 1 from public.garment_types where key=p_garment_type and intake_active) then raise exception 'Unknown garment type'; end if;
  if p_department is not null and not exists(select 1 from public.product_departments where key=p_department) then raise exception 'Unknown Department'; end if;
  if jsonb_typeof(coalesce(p_attributes,'[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_materials,'[]'::jsonb)) <> 'array' then raise exception 'Invalid evidence'; end if;
  v_reference:=coalesce(nullif(btrim(coalesce(p_source_reference,'')),''),'fit_report:'||p_fit_report_id::text);

  delete from public.product_metadata_evidence
  where fit_report_id=p_fit_report_id and submitted_by=v_user_id and source_type='member'::public.product_data_source;
  delete from public.product_attribute_evidence
  where fit_report_id=p_fit_report_id and submitted_by=v_user_id and source_type='member'::public.product_data_source;
  delete from public.product_material_evidence
  where fit_report_id=p_fit_report_id and submitted_by=v_user_id and source_type='member'::public.product_data_source;

  insert into public.product_metadata_evidence(product_id,fit_report_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,p_fit_report_id,'garment_type',p_garment_type,'member','provisional',.55,v_reference,v_user_id);
  insert into public.product_metadata_evidence(product_id,fit_report_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
  values(p_product_id,p_fit_report_id,'market_segment',p_market_segment,'member','provisional',.55,v_reference,v_user_id);
  if p_department is not null then
    insert into public.product_metadata_evidence(product_id,fit_report_id,field_key,value_text,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_fit_report_id,'department',p_department,'member','provisional',.55,v_reference,v_user_id);
  end if;

  for v_row in select value from jsonb_array_elements(coalesce(p_attributes,'[]'::jsonb)) loop
    v_attribute_key:=nullif(btrim(v_row->>'attribute_key'),'');
    v_option_key:=nullif(btrim(v_row->>'option_key'),'');
    if v_attribute_key is null or v_option_key is null then raise exception 'Invalid product attribute evidence'; end if;
    if not exists(
      select 1 from public.garment_attribute_options
      where attribute_key=v_attribute_key and option_key=v_option_key
    ) then raise exception 'Unknown product attribute evidence'; end if;
    insert into public.product_attribute_evidence(product_id,fit_report_id,attribute_key,option_key,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_fit_report_id,v_attribute_key,v_option_key,'member','provisional',.55,v_reference,v_user_id);
  end loop;

  for v_row in select value from jsonb_array_elements(coalesce(p_materials,'[]'::jsonb)) loop
    v_material_key:=nullif(btrim(v_row->>'material_key'),'');
    v_percentage:=case when nullif(btrim(v_row->>'percentage'),'') is null then null else (v_row->>'percentage')::numeric end;
    if v_material_key is null or not exists(select 1 from public.materials where key=v_material_key)
       or (v_percentage is not null and (v_percentage<0 or v_percentage>100)) then raise exception 'Invalid product material evidence'; end if;
    insert into public.product_material_evidence(product_id,fit_report_id,material_key,percentage,source_type,source_status,confidence,source_reference,submitted_by)
    values(p_product_id,p_fit_report_id,v_material_key,v_percentage,'member','provisional',.55,v_reference,v_user_id);
  end loop;
end;
$$;

revoke all on function public.record_member_product_evidence(uuid,uuid,text,text,jsonb,jsonb,text,text) from public,anon;
grant execute on function public.record_member_product_evidence(uuid,uuid,text,text,jsonb,jsonb,text,text) to authenticated;
