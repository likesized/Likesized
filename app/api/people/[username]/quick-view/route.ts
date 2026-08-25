import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";

type MatchRow = { user_id: string; match_score: number };
type ReportRow = { closet_item_id: string };

async function scoreFor(supabase: Awaited<ReturnType<typeof createClient>>, targetUserId: string, category: "overall" | "tops" | "bottoms") {
  const { data, error } = await supabase.rpc("get_fit_matches", { p_match_category: category, p_result_limit: 100 });
  if (error) return null;
  const value = ((data ?? []) as MatchRow[]).find((row) => row.user_id === targetUserId)?.match_score;
  return typeof value === "number" ? value : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) return Response.json({ error: "Profile not found." }, { status: 404 });

  const { data: claims } = await supabase.auth.getClaims();
  const viewerId = claims?.claims?.sub;
  let totalGarments: number | null = null;
  let totalOutfits: number | null = null;
  let overallMatch: number | null = null;
  let topsMatch: number | null = null;
  let bottomsMatch: number | null = null;

  if (viewerId) {
    const [reportsResult, outfitsResult, overall, tops, bottoms] = await Promise.all([
      supabase.from("fit_reports").select("closet_item_id").eq("user_id", profile.id).limit(1000),
      supabase.from("outfit_posts").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "published"),
      viewerId === profile.id ? Promise.resolve(null) : scoreFor(supabase, profile.id, "overall"),
      viewerId === profile.id ? Promise.resolve(null) : scoreFor(supabase, profile.id, "tops"),
      viewerId === profile.id ? Promise.resolve(null) : scoreFor(supabase, profile.id, "bottoms"),
    ]);
    if (!reportsResult.error) totalGarments = new Set(((reportsResult.data ?? []) as ReportRow[]).map((row) => row.closet_item_id)).size;
    if (!outfitsResult.error) totalOutfits = outfitsResult.count ?? 0;
    overallMatch = overall;
    topsMatch = tops;
    bottomsMatch = bottoms;
  }

  return Response.json({
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: currentProfilePhotoUrl(supabase, profile.avatar_url),
    overallMatch,
    topsMatch,
    bottomsMatch,
    totalGarments,
    totalOutfits,
  });
}
