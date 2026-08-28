-- Roadmap 13A transition rule for pre-scoring Fit Photos.
-- Synthetic legacy-neutral bootstrap scores must not block the first eligible measured winner.
-- Once a measured Fit Photo is current, the configured replacement margin applies normally.

create or replace function private.upsert_automatic_canonical_product_image(
  p_product_id uuid,
  p_variation_key text,
  p_fit_photo_id uuid,
  p_fit_score smallint,
  p_product_photo_id uuid,
  p_official_url text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_current public.canonical_product_images%rowtype;
  v_margin smallint:=5;
  v_source_kind text;
  v_fit_id uuid;
  v_product_photo_id uuid;
  v_url text;
  v_score smallint;
begin
  select fit_photo_replacement_margin into v_margin
  from public.canonical_product_image_config where singleton=true;
  v_margin:=coalesce(v_margin,5);

  select * into v_current
  from public.canonical_product_images c
  where c.product_id=p_product_id
    and c.variation_key is not distinct from p_variation_key
  for update;

  if v_current.id is not null and v_current.canonical_locked then return; end if;

  if p_fit_photo_id is not null then
    if v_current.id is not null
       and v_current.source_kind='fit_reference_photo'
       and v_current.fit_reference_photo_id is not null
       and v_current.fit_reference_photo_id<>p_fit_photo_id
       and v_current.photo_quality_score is not null
       and p_fit_score < v_current.photo_quality_score + v_margin
       and exists(
         select 1 from public.fit_reference_photos fp
         where fp.id=v_current.fit_reference_photo_id
           and fp.quality_source<>'legacy_neutral'
           and fp.canonical_eligible and fp.duplicate_of is null and fp.quality_scored_at is not null
           and fp.resolution_score>=50
           and not exists(
             select 1 from public.content_reports cr
             where cr.target_type='fit_reference_photo'::public.moderation_target_type
               and cr.target_id=fp.id
               and cr.status='open'::public.moderation_report_status
           )
       ) then
      return;
    end if;
    v_source_kind:='fit_reference_photo'; v_fit_id:=p_fit_photo_id; v_score:=p_fit_score;
  elsif p_variation_key is null and p_product_photo_id is not null then
    v_source_kind:='product_photo_evidence'; v_product_photo_id:=p_product_photo_id;
  elsif p_variation_key is null and nullif(btrim(coalesce(p_official_url,'')),'') is not null then
    v_source_kind:='official_product_image'; v_url:=p_official_url;
  else
    if v_current.id is not null then delete from public.canonical_product_images where id=v_current.id; end if;
    return;
  end if;

  if v_current.id is null then
    insert into public.canonical_product_images(
      product_id,variation_key,source_kind,fit_reference_photo_id,product_photo_evidence_id,source_image_url,photo_quality_score,canonical_locked,selected_at,updated_at
    ) values(
      p_product_id,p_variation_key,v_source_kind,v_fit_id,v_product_photo_id,v_url,v_score,false,now(),now()
    );
  else
    update public.canonical_product_images
    set source_kind=v_source_kind,
        fit_reference_photo_id=v_fit_id,
        product_photo_evidence_id=v_product_photo_id,
        source_image_url=v_url,
        photo_quality_score=v_score,
        canonical_locked=false,
        locked_by=null,
        lock_reason=null,
        selected_at=case
          when source_kind is distinct from v_source_kind
            or fit_reference_photo_id is distinct from v_fit_id
            or product_photo_evidence_id is distinct from v_product_photo_id
            or source_image_url is distinct from v_url
          then now() else selected_at end,
        updated_at=now()
    where id=v_current.id;
  end if;
end;
$$;
revoke all on function private.upsert_automatic_canonical_product_image(uuid,text,uuid,smallint,uuid,text) from public,anon,authenticated;

comment on function private.upsert_automatic_canonical_product_image(uuid,text,uuid,smallint,uuid,text)
is 'Roadmap 13A persisted automatic selector. The configured anti-churn margin applies between measured Fit Photos; legacy-neutral bootstrap incumbents yield to the first eligible measured winner.';
