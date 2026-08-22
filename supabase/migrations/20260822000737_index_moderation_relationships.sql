-- Keep report, audit, and catalog-lock foreign-key maintenance predictable as the queues grow.
create index content_reports_reported_user_idx
  on public.content_reports(reported_user_id);
create index content_reports_resolved_by_idx
  on public.content_reports(resolved_by)
  where resolved_by is not null;
create index moderation_actions_report_idx
  on public.moderation_actions(report_id)
  where report_id is not null;
create index moderation_actions_admin_user_idx
  on public.moderation_actions(admin_user_id);
create index catalog_moderation_actions_admin_user_idx
  on public.catalog_moderation_actions(admin_user_id);
create index catalog_moderation_actions_product_idx
  on public.catalog_moderation_actions(product_id);
create index product_description_evidence_product_idx
  on public.product_description_evidence(product_id);
create index product_description_evidence_submitted_by_idx
  on public.product_description_evidence(submitted_by)
  where submitted_by is not null;
