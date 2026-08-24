-- Repair the authenticated known-Product correction boundary discovered during the
-- post-deploy browser wiring audit. record_member_product_identity_issue is deliberately
-- SECURITY INVOKER and must not require EXECUTE on the general normalize_identifier helper.
-- Keep that helper restricted; normalize only the barcode input locally inside this RPC.

create or replace function public.record_member_product_identity_issue(
  p_product_id uuid,
  p_field_key text,
  p_value text
)
returns void
language plpgsql
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_normalized_identifier text;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_field_key not in ('brand_name','item_name','manufacturer_style','barcode') then raise exception 'Unknown identity field'; end if;
  if char_length(btrim(coalesce(p_value,''))) not between 1 and 180 then raise exception 'Invalid identity value'; end if;

  if p_field_key='barcode' then
    v_normalized_identifier:=nullif(
      regexp_replace(upper(btrim(p_value)), '[[:space:]_.-]+', '', 'g'),
      ''
    );
    if v_normalized_identifier is null or v_normalized_identifier !~ '^[0-9]{6,32}$' then
      raise exception 'Invalid barcode value';
    end if;
  end if;

  insert into public.product_identity_evidence(product_id,field_key,value_text,source_status,submitted_by)
  values(p_product_id,p_field_key,btrim(p_value),'provisional',v_user_id)
  on conflict(product_id,field_key,submitted_by) where submitted_by is not null
  do update set value_text=excluded.value_text,source_status='provisional',created_at=now();
end;
$$;

revoke all on function public.record_member_product_identity_issue(uuid,text,text) from public,anon;
grant execute on function public.record_member_product_identity_issue(uuid,text,text) to authenticated;

comment on function public.record_member_product_identity_issue(uuid,text,text) is
  'Authenticated member correction-evidence boundary for a known Product. It records provisional Brand/Item/Style/Barcode disagreement without mutating canonical Product identity; barcode validation is local so the restricted normalize_identifier helper remains non-public.';
