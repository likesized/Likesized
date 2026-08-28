import Link from "next/link";
import { redirect } from "next/navigation";
import { followPerson, unfollowPerson } from "@/app/people/actions";
import { MatchCard } from "@/components/MatchCard";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type MatchCategory = "overall" | "tops" | "bottoms";
type FitCommunity = "men" | "women" | "both";
type PeopleScope = "twins" | "all";

type FitMatch = {
  match_category: MatchCategory;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  match_score: number;
};

const CATEGORY_LABELS: Record<MatchCategory, string> = {
  overall: "Overall",
  tops: "Tops",
  bottoms: "Bottoms",
};
const COMMUNITY_LABELS: Record<FitCommunity, string> = {
  men: "Men",
  women: "Women",
  both: "Both",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function matchCategory(value: string | undefined): MatchCategory {
  return value === "tops" || value === "bottoms" ? value : "overall";
}
function peopleScope(value: string | undefined): PeopleScope {
  return value === "all" ? "all" : "twins";
}
function fitCommunity(value: string | undefined, fallback: FitCommunity): FitCommunity {
  return value === "men" || value === "women" || value === "both" ? value : fallback;
}
function peopleHref(category: MatchCategory, community: FitCommunity, scope: PeopleScope) {
  const params = new URLSearchParams();
  if (scope === "all") params.set("scope", "all");
  if (category !== "overall") params.set("category", category);
  params.set("community", community);
  return `/people?${params.toString()}`;
}
function matchMap(data: FitMatch[], category: MatchCategory) {
  return new Map(data.filter((row) => row.match_category === category).map((row) => [row.user_id, row.match_score]));
}

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = matchCategory(first(params.category));
  const scope = peopleScope(first(params.scope));
  const requestedCommunity = first(params.community);
  const profileSaved = first(params.profile) === "saved";
  const followError = first(params.follow) === "error";
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/people");

  const [{ data: profile, error: profileError }, { data: fitProfile, error: fitProfileError }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("user_id,fit_community").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileError || fitProfileError) throw new Error("Could not load your Fit Profile status.");
  if (!profile?.username || !fitProfile) redirect("/onboarding");

  const savedCommunity = fitProfile.fit_community === "men" || fitProfile.fit_community === "women" ? fitProfile.fit_community : "both";
  const community = fitCommunity(requestedCommunity, savedCommunity);
  const [matchResult, { data: followData, error: followLoadError }, { data: twinSettings, error: twinSettingsError }] = await Promise.all([
    supabase.rpc("get_fit_matches_batch", { p_match_categories: ["overall", "tops", "bottoms"], p_result_limit: 100, p_fit_community: community }),
    supabase.from("follows").select("followed_id").eq("follower_id", userId),
    supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton", true).maybeSingle(),
  ]);
  if (matchResult.error || followLoadError || twinSettingsError) throw new Error("Could not load Fit Matches.");

  const allMatches = (matchResult.data ?? []) as FitMatch[];
  const overall = matchMap(allMatches, "overall");
  const tops = matchMap(allMatches, "tops");
  const bottoms = matchMap(allMatches, "bottoms");
  const threshold = twinSettings?.threshold_percent ?? 85;
  const designationFor = (targetUserId: string) => fitTwinDesignation({
    overall: overall.get(targetUserId),
    tops: tops.get(targetUserId),
    bottoms: bottoms.get(targetUserId),
  }, threshold);
  const availableMatches = allMatches.filter((person) => person.match_category === category);
  const matches = (scope === "twins" ? availableMatches.filter((person) => Boolean(designationFor(person.user_id))) : availableMatches).slice(0, 30);

  const followedIds = new Set((followData ?? []).map((row: { followed_id: string }) => row.followed_id));
  const categoryLabel = CATEGORY_LABELS[category];
  const returnTo = peopleHref(category, community, scope);

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">PEOPLE MY SIZE</span>
        <h1>Your closest Fit Matches</h1>
        <p>{scope === "twins" ? "People whose current Tops or Bottoms Match qualifies for a Twin-level match." : "Match % shows how closely this person’s garment-relevant body measurements match yours. It is not a probability that a garment will fit."}</p>
        <Link className="textLink" href="/twins">My Fit Twins →</Link>
      </div>

      {profileSaved ? <div className="authMessage">Fit Profile saved. Your match scores are current.</div> : null}
      {followError ? <div className="authMessage error">That follow change could not be saved.</div> : null}

      <span className="muted">People view</span>
      <div className="filterBar">
        <Link className={`filter${scope === "twins" ? " active" : ""}`} href={peopleHref(category, community, "twins")}>Fit Twins</Link>
        <Link className={`filter${scope === "all" ? " active" : ""}`} href={peopleHref(category, community, "all")}>All Matches</Link>
      </div>

      <span className="muted">Fit Community · defaults to your Fit Profile. Switching this view does not change your saved preference.</span>
      <div className="filterBar">
        {(Object.keys(COMMUNITY_LABELS) as FitCommunity[]).map((key) => <Link key={key} className={`filter${community === key ? " active" : ""}`} href={peopleHref(category, key, scope)}>{COMMUNITY_LABELS[key]}</Link>)}
      </div>
      <span className="muted">Match view</span>
      <div className="filterBar">
        {(Object.keys(CATEGORY_LABELS) as MatchCategory[]).map((key) => (
          <Link key={key} className={`filter${category === key ? " active" : ""}`} href={peopleHref(key, community, scope)}>
            {CATEGORY_LABELS[key]}
          </Link>
        ))}
      </div>

      {matches.length > 0 ? (
        <div className="cardGrid">
          {matches.map((person) => {
            const followed = followedIds.has(person.user_id);
            const designation = designationFor(person.user_id);
            const twinLabel = fitTwinLabel(designation);
            const avatar = currentProfilePhotoUrl(supabase, person.avatar_url);
            return (
              <MatchCard
                key={person.user_id}
                name={person.display_name?.trim() || person.username}
                handle={`@${person.username}`}
                style={followed ? twinLabel ? `Following · ${twinLabel}` : "Following" : twinLabel ? `${twinLabel} Match` : `${categoryLabel} Fit Match`}
                avatarUrl={avatar}
                match={person.match_score}
                secondary={`${categoryLabel} measurements · exact measurements stay private`}
                description={`How closely this person’s ${categoryLabel.toLowerCase()}-relevant body measurements match yours.`}
                href={`/people/${person.username}`}
                linkLabel="View profile →"
                footer={
                  <form action={followed ? unfollowPerson : followPerson}>
                    <input type="hidden" name="target_user_id" value={person.user_id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button className="secondaryButton" type="submit">{followed ? "Unfollow" : "Follow"}</button>
                  </form>
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="tableLike">
          <div className="matchCardBody">
            <strong>{scope === "twins" ? "No Twin-level Fit Matches yet." : "No Fit Matches yet."}</strong>
            <p className="muted">{scope === "twins" ? "As more people complete compatible Fit Profiles, Twin-level matches will appear here." : "Your Fit Profile is ready. Matches will appear here as other members complete compatible Fit Profiles in this Fit Community."}</p>
            {scope === "twins" ? <Link className="textLink" href={peopleHref(category, community, "all")}>See all Fit Matches →</Link> : null}
          </div>
        </div>
      )}
    </main>
  );
}
