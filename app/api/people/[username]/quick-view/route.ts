import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";

type MatchRow = { user_id: string; match_score: number };
type ReportRow = { closet_item_id: string };
type NotificationSubscription = { followed_id: string };

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
  const viewerId = claims?.claims?.sub ?? null;
  const owner = viewerId === profile.id;
  let totalGarments: number | null = null;
  let totalOutfits: number | null = null;
  let overallMatch: number | null = null;
  let topsMatch: number | null = null;
  let bottomsMatch: number | null = null;
  let following = false;
  let notificationsOn = false;

  if (viewerId) {
    const [reportsResult, outfitsResult, overall, tops, bottoms, followResult, notificationResult] = await Promise.all([
      supabase.from("fit_reports").select("closet_item_id").eq("user_id", profile.id).limit(1000),
      supabase.from("outfit_posts").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "published"),
      owner ? Promise.resolve(null) : scoreFor(supabase, profile.id, "overall"),
      owner ? Promise.resolve(null) : scoreFor(supabase, profile.id, "tops"),
      owner ? Promise.resolve(null) : scoreFor(supabase, profile.id, "bottoms"),
      owner ? Promise.resolve({ data: null, error: null }) : supabase.from("follows").select("followed_id").eq("follower_id", viewerId).eq("followed_id", profile.id).maybeSingle(),
      owner ? Promise.resolve({ data: [], error: null }) : supabase.rpc("get_following_notification_subscriptions"),
    ]);
    if (!reportsResult.error) totalGarments = new Set(((reportsResult.data ?? []) as ReportRow[]).map((row) => row.closet_item_id)).size;
    if (!outfitsResult.error) totalOutfits = outfitsResult.count ?? 0;
    overallMatch = overall;
    topsMatch = tops;
    bottomsMatch = bottoms;
    following = Boolean(followResult.data);
    if (!notificationResult.error) notificationsOn = ((notificationResult.data ?? []) as NotificationSubscription[]).some((row) => row.followed_id === profile.id);
  }

  return Response.json({
    userId: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: currentProfilePhotoUrl(supabase, profile.avatar_url),
    signedIn: Boolean(viewerId),
    owner,
    following,
    notificationsOn,
    overallMatch,
    topsMatch,
    bottomsMatch,
    totalGarments,
    totalOutfits,
  });
}
