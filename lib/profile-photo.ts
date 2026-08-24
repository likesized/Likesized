import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Profile photos are live profile identity, never content snapshots.
 * Every surface resolves the member's current profiles.avatar_url at render time.
 */
export function currentProfilePhotoUrl(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl || null;
}
