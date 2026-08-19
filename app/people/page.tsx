import Link from "next/link";
import { redirect } from "next/navigation";
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

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const category = matchCategory(first(params.category));
  const profileSaved = first(params.profile) === "saved";
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/people");
  }

  const [{ data: profile, error: profileError }, { data: fitProfile, error: fitProfileError }] =
    await Promise.all([
      supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
      supabase.from("fit_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);

  if (profileError || fitProfileError) {
    throw new Error("Could not load your Fit Profile status.");
  }

  if (!profile?.username || !fitProfile) {
    redirect("/onboarding");
  }

  const { data, error } = await supabase.rpc("get_fit_matches", {
    p_match_category: category,
    p_result_limit: 30,
  });

  if (error) {
    throw new Error("Could not calculate Fit Matches.");
  }

  const matches = (data ?? []) as FitMatch[];
  const categoryLabel = CATEGORY_LABELS[category];

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">PEOPLE MY SIZE</span>
        <h1>Your closest Fit Matches</h1>
        <p>
          Overall is useful for discovery. Tops and Bottoms recalculate the score using only the measurements that matter most for that garment category.
        </p>
      </div>

      {profileSaved ? (
        <div className="authMessage">Fit Profile saved. Your match scores are current.</div>
      ) : null}

      <div className="filterBar">
        {(Object.keys(CATEGORY_LABELS) as MatchCategory[]).map((key) => (
          <Link
            key={key}
            className={`filter${category === key ? " active" : ""}`}
            href={key === "overall" ? "/people" : `/people?category=${key}`}
          >
            {CATEGORY_LABELS[key]}
          </Link>
        ))}
      </div>

      {matches.length > 0 ? (
        <div className="cardGrid">
          {matches.map((person) => (
            <MatchCard
              key={person.user_id}
              name={person.display_name?.trim() || person.username}
              handle={`@${person.username}`}
              style={`${categoryLabel} Fit Match`}
              match={person.match_score}
              secondary={`${categoryLabel} measurements · exact measurements stay private`}
              description={`This ${categoryLabel.toLowerCase()} score is calculated from shared measurement categories without exposing either person's raw measurements.`}
              href=""
            />
          ))}
        </div>
      ) : (
        <div className="tableLike">
          <div className="matchCardBody">
            <strong>No Fit Matches yet.</strong>
            <p className="muted">
              Your Fit Profile is ready. Matches will appear here as other members complete compatible Fit Profiles.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
