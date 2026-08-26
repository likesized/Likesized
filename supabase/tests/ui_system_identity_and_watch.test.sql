-- LikeSized canonical UI-system safeguards: username cooldown and exact-variation FITuition watches.
begin;
select plan(9);
select has_table('private','username_change_state','username cooldown state exists');
select has_function('public','get_username_change_status',array['text'],'username availability/cooldown boundary exists');
select has_column('public','product_evidence_notifications','objective_variant_key','evidence watches store exact variation');
select has_column('public','product_evidence_notifications','minimum_match_score','evidence watches store strong-match threshold');
select col_default_is('public','product_evidence_notifications','minimum_match_score','85','quick-view watch threshold defaults to 85');
select has_function('private','calculate_user_snapshot_match_for_product',array['uuid','uuid','uuid'],'watch trigger can score a watcher against a report snapshot');
select has_trigger('public','profiles','enforce_username_change_cooldown_before_write','username cooldown is enforced at database boundary');
select has_trigger('public','fit_reports','notify_product_evidence_watchers_after_fit_report','fit report notification trigger remains canonical');
select col_is_pk('public','product_evidence_notifications',array['user_id','product_id','objective_variant_key'],'evidence watch identity includes exact variation');
select * from finish();
rollback;
