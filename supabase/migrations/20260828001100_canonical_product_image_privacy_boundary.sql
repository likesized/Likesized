-- Roadmap 13A keeps internal selection/audit metadata behind admin or safe RPC boundaries.

drop policy if exists "Members read canonical Product image selections" on public.canonical_product_images;
create policy "Admins read canonical Product image selections"
on public.canonical_product_images for select to authenticated
using (private.is_admin());

-- The full admin reason stays in canonical_product_image_actions. The member-readable
-- Fit Photo row only keeps a generic eligibility state so internal moderation notes do not leak.
create or replace function public.admin_set_fit_photo_canonical_eligibility(
  p_photo_id uuid,
  p_eligible boolean,
  p_reason text
) returns void
language plpgsql security definer set search_path=''
as $$
declare
  v_admin uuid:=auth.uid();
  v_product_id uuid;
begin
  if v_admin is null or not private.is_admin(v_admin) then raise exception 'Admin required' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null or char_length(btrim(p_reason))>500 then raise exception 'Reason required'; end if;
  v_product_id:=private.fit_photo_product_id(p_photo_id);
  if v_product_id is null then raise exception 'Unknown Fit Photo'; end if;
  update public.fit_reference_photos
  set canonical_eligible=p_eligible,
      canonical_ineligible_reason=case when p_eligible then null else 'admin_review' end
  where id=p_photo_id;
  insert into public.canonical_product_image_actions(admin_user_id,product_id,action,source_kind,source_id,reason)
  values(v_admin,v_product_id,case when p_eligible then 'mark_eligible' else 'mark_ineligible' end,'fit_reference_photo',p_photo_id,btrim(p_reason));
end;
$$;
revoke all on function public.admin_set_fit_photo_canonical_eligibility(uuid,boolean,text) from public,anon;
grant execute on function public.admin_set_fit_photo_canonical_eligibility(uuid,boolean,text) to authenticated;
