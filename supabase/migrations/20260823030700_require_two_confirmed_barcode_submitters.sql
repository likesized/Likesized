create or replace function private.refresh_barcode_identity_confidence(
  p_candidate_id uuid,
  p_product_id uuid,
  p_barcode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barcode text := public.normalize_identifier(coalesce(p_barcode, ''));
  v_confirmed_submitter_count integer := 0;
  v_confirmed_wearer_count integer := 0;
begin
  if v_barcode = '' then return; end if;

  if p_candidate_id is not null then
    select count(distinct gs.user_id)
    into v_confirmed_submitter_count
    from public.garment_submissions gs
    where gs.candidate_id = p_candidate_id
      and gs.identifier_type in ('upc', 'barcode')
      and public.normalize_identifier(coalesce(gs.identifier_value, '')) = v_barcode
      and exists (
        select 1
        from private.barcode_identity_confirmations bic
        where bic.candidate_id = p_candidate_id
          and bic.user_id = gs.user_id
          and bic.normalized_barcode = v_barcode
      );

    if v_confirmed_submitter_count >= 2 then
      update public.catalog_candidates
      set identity_confidence = 'corroborated'::public.product_data_status,
          updated_at = now()
      where id = p_candidate_id
        and resolved_product_id is null
        and identity_confidence = 'provisional'::public.product_data_status;
    end if;
  end if;

  if p_product_id is not null then
    select count(distinct bic.user_id)
    into v_confirmed_wearer_count
    from private.barcode_identity_confirmations bic
    where bic.product_id = p_product_id
      and bic.normalized_barcode = v_barcode
      and exists (
        select 1
        from public.fit_reports fr
        where fr.user_id = bic.user_id
          and fr.product_id = p_product_id
      );

    if v_confirmed_wearer_count >= 2 then
      update public.products
      set catalog_status = 'corroborated'::public.product_data_status
      where id = p_product_id
        and catalog_status = 'provisional'::public.product_data_status;
    end if;
  end if;
end;
$$;

revoke all on function private.refresh_barcode_identity_confidence(uuid, uuid, text) from public, anon, authenticated;

comment on function private.refresh_barcode_identity_confidence(uuid, uuid, text) is
  'Raises barcode identity confidence only after two distinct members both explicitly confirm the same barcode identity and also contribute matching submission/Fit Report evidence.';
