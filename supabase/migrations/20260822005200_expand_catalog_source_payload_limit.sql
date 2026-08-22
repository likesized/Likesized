-- Preserve the full selected provider record, including fields not yet surfaced.
-- The limit protects action/database resources; it must not truncate a normal catalog record.

create or replace function public.record_catalog_source_selection(
  p_product_id uuid, p_provider_key text, p_external_product_id text,
  p_source_url text, p_image_url text, p_source_payload jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_provider_key not in ('channel3_catalog','upcitemdb') then raise exception 'Unsupported catalog provider'; end if;
  if p_external_product_id is null or char_length(btrim(p_external_product_id)) not between 1 and 200 then raise exception 'Invalid catalog identifier'; end if;
  if p_source_payload is null or octet_length(p_source_payload::text) > 512000 then raise exception 'Invalid catalog source payload'; end if;
  if p_source_url is not null and p_source_url !~ '^https?://' then raise exception 'Invalid source URL'; end if;
  if p_image_url is not null and p_image_url !~ '^https?://' then raise exception 'Invalid image URL'; end if;
  insert into private.catalog_source_records(product_id,provider_key,external_product_id,source_url,image_url,source_payload,selected_by)
  values(p_product_id,p_provider_key,btrim(p_external_product_id),p_source_url,p_image_url,p_source_payload,v_user_id)
  on conflict(provider_key,external_product_id,product_id) do update set source_url=excluded.source_url,image_url=excluded.image_url,source_payload=excluded.source_payload,selected_by=excluded.selected_by,selected_at=now();
  if p_image_url is not null then update public.products set image_url=coalesce(image_url,p_image_url) where id=p_product_id; end if;
end;
$$;
revoke all on function public.record_catalog_source_selection(uuid,text,text,text,text,jsonb) from public,anon;
grant execute on function public.record_catalog_source_selection(uuid,text,text,text,text,jsonb) to authenticated;
