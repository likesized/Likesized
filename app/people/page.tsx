import Link from "next/link";
import { redirect } from "next/navigation";
import { followFitTwin, unfollowFitTwin } from "@/app/people/actions";
import { MatchCard } from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type MatchCategory = "overall" | "tops" | "bottoms";

type FitMatch = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  match_score: number;
  coverage_percent: number;
};

const CATEGORY_LABELS: Record<MatchCategory, string> = {
  overall: "Overall",
  tops: "Tops",
  bottoms: "Bottoms",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function matchCategory(value: string | undefined): MatchCategory {
  return value === "tops" || value === "bottoms" ? value : "overall";
}

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = matchCategory(first(params.category));
  const profileSaved = first(params.profile) === "saved";
  const followError = first(params.follow) === "error";
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/people");

  const [{ data: profile, error: profileError }, { data: fitProfile, error: fitProfileError }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileError || fitProfileError) throw new Error("Could not load your Fit Profile status.");
  if (!profile?.username || !fitProfile) redirect("/onboarding");

  const [{ data: matchData, error: matchError }, { data: followData, error: followLoadError }] = await Promise.all([
    supabase.rpc("get_fit_matches", { p_match_category: category, p_result_limit: 30 }),
    supabase.from("follows").select("followed_id").eq("follower_id", userId),
  ]);
  if (matchError || followLoadError) throw new Error("Could not load Fit Matches.");

  const matches = (matchData ?? []) as FitMatch[];
  const followedIds = new Set((followData ?? []).map((row: { followed_id: string }) => row.followed_id));
  const categoryLabel = CATEGORY_LABELS[category];
  const returnTo = category === "overall" ? "/people" : `/people?category=${category}`;

  return <main className="pageShell">
    <div className="pageTitle">
      <span className="eyebrow">PEOPLE MY SIZE</span>
      <h1>Your closest Fit Matches</h1>
      <p>Match % shows how closely this person’s garment-relevant body measurements match yours. Confidence describes how much relevant measurement evidence supports that comparison; it is not a second score and Match % is not a probability that a garment will fit.</p>
      <Link className="textLink" href="/twins">My Fit Twins →</Link>
    </div>
    {profileSaved ? <div className="authMessage">Fit Profile saved. Your match scores are current.</div> : null}
    {followError ? <div className="authMessage error">That Fit Twin change could not be saved.</div> : null}
    <div className="filterBar">
      {(Object.keys(CATEGORY_LABELS) as MatchCategory[]).map((key) => <Link key={key} className={`filter${category === key ? " active" : ""}`} href={key === "overall" ? "/people" : `/people?category=${key}`}>{CATEGORY_LABELS[key]}</Link>)}
    </div>
    {matches.length > 0 ? <div className="cardGrid">{matches.map((person) => {
      const followed = followedIds.has(person.user_id);
      return <MatchCard
        key={person.user_id}
        name={person.display_name?.trim() || person.username}
        handle={`@${person.username}`}
        style={followed ? "Saved Fit Twin" : `${categoryLabel} Fit Match`}
        match={person.match_score}
        secondary={`${categoryLabel} measurements · exact measurements stay private`}
        description={`How closely this person’s ${categoryLabel.toLowerCase()}-relevant body measurements match yours.`}
        href={`/people/${person.username}`}
        linkLabel="View Fit Twin profile →"
        footer={<form action={followed ? unfollowFitTwin : followFitTwin}><input type="hidden" name="target_user_id" value={person.user_id} /><input type="hidden" name="return_to" value={returnTo} /><button className="secondaryButton" type="submit">{followed ? "Remove Fit Twin" : "Save as Fit Twin"}</button></form>}
      />;
    })}</div> : <div className="tableLike"><div className="matchCardBody"><strong>No Fit Matches yet.</strong><p className="muted">Your Fit Profile is ready. Matches will appear here as other members complete compatible Fit Profiles.</p></div></div>}
  </main>;
}
