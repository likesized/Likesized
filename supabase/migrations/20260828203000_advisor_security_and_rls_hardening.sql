-- Supabase advisor hardening for public/social boundaries and foreign-key lookup scale.
--
-- This migration preserves the intended public Outfit/member/admin behavior while:
--   1. removing one stale Outfit-item policy that could expose draft garment links to other members;
--   2. consolidating equivalent permissive RLS policies so each warned role/action has one policy;
--   3. adding covering indexes for previously unindexed foreign-key relationships; and
--   4. reasserting the intentionally narrow anonymous SECURITY DEFINER Outfit RPC allowlist.

-- -----------------------------------------------------------------------------
-- RLS: one canonical policy per warned role/action.
-- -----------------------------------------------------------------------------

-- Fit-photo deletion remains available to the owner or an admin, but through one policy.
drop policy if exists "Admins delete fit photo metadata" on public.fit_reference_photos;
drop policy if exists "owner deletes fit photo metadata" on public.fit_reference_photos;
create policy "authorized delete fit photo metadata"
on public.fit_reference_photos for delete to authenticated
using (
  user_id=(select auth.uid())
  or private.is_admin()
);

-- Comment reads keep public-post visibility for ordinary members and all-comment visibility
-- for admins. Deletion remains commenter / Outfit owner / admin.
drop policy if exists "admins read all outfit comments" on public.outfit_comments;
drop policy if exists "members read visible outfit comments" on public.outfit_comments;
create policy "authorized read outfit comments"
on public.outfit_comments for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1
    from public.outfit_posts op
    where op.id=outfit_comments.post_id
      and op.status='published'::public.outfit_post_status
      and op.comments_enabled
      and not private.members_blocked((select auth.uid()),op.user_id)
  )
);

drop policy if exists "Admins delete outfit comments" on public.outfit_comments;
drop policy if exists "commenter or outfit owner deletes comment" on public.outfit_comments;
create policy "authorized delete outfit comments"
on public.outfit_comments for delete to authenticated
using (
  private.is_admin()
  or user_id=(select auth.uid())
  or exists (
    select 1
    from public.outfit_posts op
    where op.id=outfit_comments.post_id
      and op.user_id=(select auth.uid())
  )
);

-- Owners may read their own draft metadata. Everyone else sees only published Outfits;
-- signed-in blocking remains respected. A single policy works for both anon and authenticated.
drop policy if exists "published outfits readable" on public.outfit_posts;
drop policy if exists "owners read own outfit drafts" on public.outfit_posts;
create policy "visible outfits readable"
on public.outfit_posts for select to anon,authenticated
using (
  (select auth.uid())=user_id
  or (
    status='published'::public.outfit_post_status
    and (
      (select auth.uid()) is null
      or not private.members_blocked((select auth.uid()),user_id)
    )
  )
);

drop policy if exists "Admins delete outfit posts" on public.outfit_posts;
drop policy if exists "owner deletes outfit" on public.outfit_posts;
create policy "authorized delete outfit"
on public.outfit_posts for delete to authenticated
using (
  (select auth.uid())=user_id
  or private.is_admin()
);

-- Photo/occasion/style metadata follows the same owner-draft-or-visible-published rule.
drop policy if exists "published outfit photo metadata readable" on public.outfit_photos;
drop policy if exists "owners read own outfit photo metadata" on public.outfit_photos;
create policy "visible outfit photo metadata readable"
on public.outfit_photos for select to anon,authenticated
using (
  exists (
    select 1
    from public.outfit_posts op
    where op.id=outfit_photos.post_id
      and (
        op.user_id=(select auth.uid())
        or (
          op.status='published'::public.outfit_post_status
          and (
            (select auth.uid()) is null
            or not private.members_blocked((select auth.uid()),op.user_id)
          )
        )
      )
  )
);

drop policy if exists "published outfit occasions readable" on public.outfit_occasions;
drop policy if exists "owners read own outfit occasions" on public.outfit_occasions;
create policy "visible outfit occasions readable"
on public.outfit_occasions for select to anon,authenticated
using (
  exists (
    select 1
    from public.outfit_posts op
    where op.id=outfit_occasions.post_id
      and (
        op.user_id=(select auth.uid())
        or (
          op.status='published'::public.outfit_post_status
          and (
            (select auth.uid()) is null
            or not private.members_blocked((select auth.uid()),op.user_id)
          )
        )
      )
  )
);

drop policy if exists "published outfit style tags readable" on public.outfit_style_tags;
drop policy if exists "owners read own outfit style tags" on public.outfit_style_tags;
create policy "visible outfit style tags readable"
on public.outfit_style_tags for select to anon,authenticated
using (
  exists (
    select 1
    from public.outfit_posts op
    where op.id=outfit_style_tags.post_id
      and (
        op.user_id=(select auth.uid())
        or (
          op.status='published'::public.outfit_post_status
          and (
            (select auth.uid()) is null
            or not private.members_blocked((select auth.uid()),op.user_id)
          )
        )
      )
  )
);

-- This legacy policy is no longer valid in current V1: every Closet item is locked to
-- visibility='shared', so it could make a draft Outfit's item-link row visible merely because
-- the linked Closet garment is shared. The current canonical policy already requires either
-- Outfit ownership or a published, unblocked Outfit.
drop policy if exists "members read shared outfit item links" on public.outfit_post_items;

-- -----------------------------------------------------------------------------
-- Foreign-key indexes: support relationship checks/deletes as production cardinality grows.
-- Static configuration tables are cheap today, but covering every currently reported FK keeps
-- referential operations from becoming full scans later and clears the advisor's real FK debt.
-- -----------------------------------------------------------------------------

create index if not exists fit_report_body_identity_source_version_idx
  on private.fit_report_body_identity_measurements(source_profile_version_id);
create index if not exists fit_report_body_identity_measurement_type_idx
  on private.fit_report_body_identity_measurements(measurement_type_key);
create index if not exists fit_twin_activity_notifications_activity_idx
  on private.fit_twin_activity_notifications(activity_id);
create index if not exists following_activity_events_fit_report_idx
  on private.following_activity_events(fit_report_id);
create index if not exists garment_proportion_rules_numerator_measurement_idx
  on private.garment_proportion_rules(numerator_measurement_type_key);
create index if not exists garment_proportion_rules_denominator_measurement_idx
  on private.garment_proportion_rules(denominator_measurement_type_key);
create index if not exists outfit_shop_clicks_product_idx
  on private.outfit_shop_clicks(product_id);
create index if not exists outfit_shop_clicks_user_idx
  on private.outfit_shop_clicks(user_id);
create index if not exists product_barcode_evidence_fit_report_idx
  on private.product_barcode_evidence(fit_report_id);
create index if not exists product_barcode_evidence_candidate_idx
  on private.product_barcode_evidence(source_candidate_id);
create index if not exists product_barcode_evidence_user_idx
  on private.product_barcode_evidence(user_id);

create index if not exists canonical_product_image_actions_admin_idx
  on public.canonical_product_image_actions(admin_user_id);
create index if not exists canonical_product_images_fit_photo_idx
  on public.canonical_product_images(fit_reference_photo_id);
create index if not exists canonical_product_images_locked_by_idx
  on public.canonical_product_images(locked_by);
create index if not exists canonical_product_images_product_photo_idx
  on public.canonical_product_images(product_photo_evidence_id);
create index if not exists catalog_candidates_department_idx
  on public.catalog_candidates(department_key);
create index if not exists catalog_candidates_garment_type_idx
  on public.catalog_candidates(garment_type_key);
create index if not exists catalog_candidates_resolved_product_idx
  on public.catalog_candidates(resolved_product_id);
create index if not exists catalog_resolution_actions_admin_idx
  on public.catalog_resolution_actions(admin_user_id);
create index if not exists catalog_resolution_actions_product_idx
  on public.catalog_resolution_actions(product_id);
create index if not exists catalog_review_flags_created_by_idx
  on public.catalog_review_flags(created_by);
create index if not exists catalog_review_flags_resolved_by_idx
  on public.catalog_review_flags(resolved_by);
create index if not exists catalog_review_flags_submission_idx
  on public.catalog_review_flags(submission_id);
create index if not exists fit_reference_photos_duplicate_of_idx
  on public.fit_reference_photos(duplicate_of);
create index if not exists fit_reports_garment_type_fk_idx
  on public.fit_reports(garment_type_key);
create index if not exists fit_reports_match_profile_version_idx
  on public.fit_reports(match_fit_profile_version_id);
create index if not exists garment_attribute_match_measurement_idx
  on public.garment_attribute_match_adjustments(measurement_type_key);
create index if not exists garment_submissions_color_family_idx
  on public.garment_submissions(color_family_key);
create index if not exists garment_submissions_department_idx
  on public.garment_submissions(department_key);
create index if not exists garment_submissions_garment_type_idx
  on public.garment_submissions(garment_type_key);
create index if not exists garment_submissions_normalized_size_idx
  on public.garment_submissions(normalized_size_id);
create index if not exists garment_submissions_resolved_product_idx
  on public.garment_submissions(resolved_product_id);
create index if not exists garment_type_match_measurement_idx
  on public.garment_type_match_adjustments(measurement_type_key);
create index if not exists member_blocks_blocked_idx
  on public.member_blocks(blocked_id);
create index if not exists outfit_comments_user_idx
  on public.outfit_comments(user_id);
create index if not exists outfit_photo_tags_closet_item_idx
  on public.outfit_photo_tags(closet_item_id);
create index if not exists product_aliases_created_by_idx
  on public.product_aliases(created_by);
create index if not exists product_attribute_evidence_option_fk_idx
  on public.product_attribute_evidence(attribute_key,option_key);
create index if not exists product_attribute_evidence_submitted_by_idx
  on public.product_attribute_evidence(submitted_by);
create index if not exists product_evidence_notifications_matched_report_idx
  on public.product_evidence_notifications(matched_fit_report_id);
create index if not exists product_identity_evidence_submitted_by_idx
  on public.product_identity_evidence(submitted_by);
create index if not exists product_label_photo_evidence_fit_report_idx
  on public.product_label_photo_evidence(fit_report_id);
create index if not exists product_label_photo_evidence_submitted_by_idx
  on public.product_label_photo_evidence(submitted_by);
create index if not exists product_material_evidence_material_idx
  on public.product_material_evidence(material_key);
create index if not exists product_material_evidence_submitted_by_idx
  on public.product_material_evidence(submitted_by);
create index if not exists product_metadata_evidence_submitted_by_idx
  on public.product_metadata_evidence(submitted_by);
create index if not exists product_photo_evidence_submitted_by_idx
  on public.product_photo_evidence(submitted_by);
create index if not exists products_department_idx
  on public.products(department_key);
create index if not exists user_garment_fit_preferences_garment_type_idx
  on public.user_garment_fit_preferences(garment_type_key);

-- -----------------------------------------------------------------------------
-- Public privileged RPC boundary: these anonymous SECURITY DEFINER functions are deliberate
-- narrow projections/counters for published Outfit pages. They do not grant raw table access.
-- Reassert the exposed-role grants so future privilege drift is visible in migration history.
-- -----------------------------------------------------------------------------

revoke all on function public.get_outfit_comments_page(uuid,timestamptz,uuid,integer) from public;
grant execute on function public.get_outfit_comments_page(uuid,timestamptz,uuid,integer) to anon,authenticated;
revoke all on function public.get_outfit_comments_sorted_page(uuid,text,bigint,timestamptz,uuid,integer) from public;
grant execute on function public.get_outfit_comments_sorted_page(uuid,text,bigint,timestamptz,uuid,integer) to anon,authenticated;
revoke all on function public.get_public_outfit_comments(uuid,integer) from public;
grant execute on function public.get_public_outfit_comments(uuid,integer) to anon,authenticated;
revoke all on function public.get_public_outfit_creator(uuid) from public;
grant execute on function public.get_public_outfit_creator(uuid) to anon,authenticated;
revoke all on function public.get_public_outfit_hotspots(uuid) from public;
grant execute on function public.get_public_outfit_hotspots(uuid) to anon,authenticated;
revoke all on function public.get_public_outfit_product_teasers(uuid) from public;
grant execute on function public.get_public_outfit_product_teasers(uuid) to anon,authenticated;
revoke all on function public.get_public_outfit_tagged_items(uuid) from public;
grant execute on function public.get_public_outfit_tagged_items(uuid) to anon,authenticated;
revoke all on function public.record_outfit_share(uuid) from public;
grant execute on function public.record_outfit_share(uuid) to anon,authenticated;
revoke all on function public.record_outfit_view(uuid) from public;
grant execute on function public.record_outfit_view(uuid) to anon,authenticated;

comment on function public.get_public_outfit_creator(uuid) is
  'Intentional anonymous SECURITY DEFINER boundary: minimum published-Outfit creator identity only; raw profiles remain non-anonymous.';
comment on function public.get_public_outfit_comments(uuid,integer) is
  'Intentional anonymous SECURITY DEFINER boundary: bounded published-Outfit comment/display identity projection only; raw comments/profiles remain non-anonymous.';
comment on function public.get_public_outfit_tagged_items(uuid) is
  'Intentional anonymous SECURITY DEFINER boundary: minimum published-Outfit garment identity projection only; raw Closet/Fit relationships remain non-anonymous.';
comment on function public.get_public_outfit_hotspots(uuid) is
  'Intentional anonymous SECURITY DEFINER boundary: minimum published-Outfit hotspot coordinates only; raw Closet/Fit relationships remain non-anonymous.';
comment on function public.record_outfit_view(uuid) is
  'Intentional anonymous SECURITY DEFINER counter boundary for an existing published Outfit. It exposes no interaction identity.';
comment on function public.record_outfit_share(uuid) is
  'Intentional anonymous SECURITY DEFINER counter boundary for an existing published Outfit. It exposes no interaction identity.';
