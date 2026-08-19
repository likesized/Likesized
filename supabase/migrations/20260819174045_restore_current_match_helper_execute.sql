-- Restore the narrow matcher permission defined by the authoritative V1 architecture.
-- The private helper is SECURITY DEFINER, derives the viewer from auth.uid(), and returns only
-- member identity plus safe derived match score/coverage. Raw measurements remain RLS-private.
-- Public get_fit_matches/get_garment_fit_matches remain SECURITY INVOKER wrappers.

grant usage on schema private to authenticated;
grant execute on function private.calculate_fit_matches_for_profile(text,integer) to authenticated;

comment on function private.calculate_fit_matches_for_profile(text,integer) is
  'Privileged auth.uid()-bound current-person matcher. Authenticated execution is intentionally allowed because output contains only member identity and safe derived match score/coverage; raw body measurements are never returned.';
