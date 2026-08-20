-- Keep the product-aware historical match helper private but callable by authenticated
-- wrappers. The helper itself is SECURITY DEFINER, verifies auth.uid(), and returns only
-- safe Match score + coverage; it never exposes raw historical measurements.

grant usage on schema private to authenticated;
grant execute on function private.calculate_snapshot_match_for_product(uuid,uuid) to authenticated;

comment on function private.calculate_snapshot_match_for_product(uuid,uuid) is
  'Auth-bound private helper used by safe public historical-fit wrappers. Returns only confidence-aware score and coverage for an immutable body snapshot against the target product model.';
