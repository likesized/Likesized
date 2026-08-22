-- Submission-first intake allows a member-owned Closet item and Fit Report to
-- remain unresolved with product_id/variant_id NULL until catalog resolution.
-- Preserve the existing owner + Closet-row consistency boundary while making
-- Product equality NULL-safe for that canonical pending state.

drop policy if exists "owner inserts fit report" on public.fit_reports;
create policy "owner inserts fit report"
on public.fit_reports
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.closet_items ci
    where ci.id = fit_reports.closet_item_id
      and ci.user_id = (select auth.uid())
      and ci.product_id is not distinct from fit_reports.product_id
      and ci.variant_id is not distinct from fit_reports.variant_id
      and ci.normalized_size_id is not distinct from fit_reports.normalized_size_id
      and ci.size_label = fit_reports.size_label
  )
);

drop policy if exists "owner updates fit report" on public.fit_reports;
create policy "owner updates fit report"
on public.fit_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.closet_items ci
    where ci.id = fit_reports.closet_item_id
      and ci.user_id = (select auth.uid())
      and ci.product_id is not distinct from fit_reports.product_id
      and ci.variant_id is not distinct from fit_reports.variant_id
      and ci.normalized_size_id is not distinct from fit_reports.normalized_size_id
      and ci.size_label = fit_reports.size_label
  )
);

comment on policy "owner inserts fit report" on public.fit_reports is
  'Owner-only Fit Report insert. Closet identity fields must match, including the canonical unresolved NULL Product/variant state.';
comment on policy "owner updates fit report" on public.fit_reports is
  'Owner-only Fit Report update. Closet identity fields must match, including the canonical unresolved NULL Product/variant state.';
