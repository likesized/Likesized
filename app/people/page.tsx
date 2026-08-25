import Link from "next/link";
import { redirect } from "next/navigation";
import { followPerson, unfollowPerson } from "@/app/people/actions";
import { MatchCard } from "@/components/MatchCard";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type MatchCategory = "overall" | "tops" | "bottoms";
type FitCommunity = "men" | "women" | "both";

type FitMatch = {
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
function fitCommunity(value: string | undefined, fallback: FitCommunity): FitCommunity {
  return value === "men" || value === "women" || value === "both" ? value : fallback;
}
function peopleHref(category:MatchCategory,community:FitCommunity){
  const params=new URLSearchParams();
  if(category!=="overall")params.set("category",category);
  params.set("community",community);
  return `/people?${params.toString()}`;
}
function matchMap(data: unknown) {
  return new Map(((data ?? []) as FitMatch[]).map((row) => [row.user_id, row.match_score]));
}

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = matchCategory(first(params.category));
  const requestedCommunity=first(params.community);
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

  const savedCommunity=fitProfile.fit_community==="men"||fitProfile.fit_community==="women"?fitProfile.fit_community:"both";
  const community=fitCommunity(requestedCommunity,savedCommunity);
  const [overallResult,topsResult,bottomsResult,{ data: followData, error: followLoadError },{data:twinSettings,error:twinSettingsError}] = await Promise.all([
    supabase.rpc("get_fit_matches", { p_match_category: "overall", p_result_limit: 100, p_fit_community:community }),
    supabase.rpc("get_fit_matches", { p_match_category: "tops", p_result_limit: 100, p_fit_community:community }),
    supabase.rpc("get_fit_matches", { p_match_category: "bottoms", p_result_limit: 100, p_fit_community:community }),
    supabase.from("follows").select("followed_id").eq("follower_id", userId),
    supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton",true).maybeSingle(),
  ]);
  if (overallResult.error || topsResult.error || bottomsResult.error || followLoadError || twinSettingsError) throw new Error("Could not load Fit Matches.");

  const matchData = category === "tops" ? topsResult.data : category === "bottoms" ? bottomsResult.data : overallResult.data;
  const matches = ((matchData ?? []) as FitMatch[]).slice(0,30);
  const overall = matchMap(overallResult.data);
  const tops = matchMap(topsResult.data);
  const bottoms = matchMap(bottomsResult.data);
  const threshold=twinSettings?.threshold_percent??85;
  const avatarUrlByUser = new Map<string, string>();
  await Promise.all(matches.map(async (person) => {
    if (!person.avatar_url) return;
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(person.avatar_url, 60 * 30);
    if (signed?.signedUrl) avatarUrlByUser.set(person.user_id, signed.signedUrl);
  }));

  const followedIds = new Set((followData ?? []).map((row: { followed_id: string }) => row.followed_id));
  const categoryLabel = CATEGORY_LABELS[category];
  const returnTo = peopleHref(category,community);

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">PEOPLE MY SIZE</span>
        <h1>Your closest Fit Matches</h1>
        <p>Match % shows how closely this person’s garment-relevant body measurements match yours. It is not a probability that a garment will fit.</p>
        <Link className="textLink" href="/twins">My Fit Twins →</Link>
      </div>

      {profileSaved ? <div className="authMessage">Fit Profile saved. Your match scores are current.</div> : null}
      {followError ? <div className="authMessage error">That follow change could not be saved.</div> : null}

      <span className="muted">Fit Community · defaults to your Fit Profile. Switching this view does not change your saved preference.</span>
      <div className="filterBar">
        {(Object.keys(COMMUNITY_LABELS) as FitCommunity[]).map((key)=><Link key={key} className={`filter${community===key?" active":""}`} href={peopleHref(category,key)}>{COMMUNITY_LABELS[key]}</Link>)}
      </div>
      <span className="muted">Match view</span>
      <div className="filterBar">
        {(Object.keys(CATEGORY_LABELS) as MatchCategory[]).map((key) => (
          <Link key={key} className={`filter${category === key ? " active" : ""}`} href={peopleHref(key,community)}>
            {CATEGORY_LABELS[key]}
          </Link>
        ))}
      </div>

      {matches.length > 0 ? (
        <div className="cardGrid">
          {matches.map((person) => {
            const followed = followedIds.has(person.user_id);
            const twinLabel = followed ? fitTwinLabel(fitTwinDesignation({
              overall:overall.get(person.user_id),
              tops:tops.get(person.user_id),
              bottoms:bottoms.get(person.user_id),
            },threshold)) : null;
            return (
              <MatchCard
                key={person.user_id}
                name={person.display_name?.trim() || person.username}
                handle={`@${person.username}`}
                style={followed ? twinLabel ? `Following · ${twinLabel}` : "Following" : `${categoryLabel} Fit Match`}
                avatarUrl={avatarUrlByUser.get(person.user_id) ?? null}
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
            <strong>No Fit Matches yet.</strong>
            <p className="muted">Your Fit Profile is ready. Matches will appear here as other members complete compatible Fit Profiles in this Fit Community.</p>
          </div>
        </div>
      )}
    </main>
  );
}
