import Link from "next/link";
import { redirect } from "next/navigation";
import { unfollowFitTwin } from "@/app/people/actions";
import { MatchCard } from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/server";

type ProfileRecord = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type MatchRecord = {
  user_id: string;
  match_score: number;
};

export default async function FitTwinsPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/twins");
  }

  const { data: followData, error: followError } = await supabase
    .from("follows")
    .select("followed_id")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (followError) {
    throw new Error("Could not load Fit Twins.");
  }

  const followedIds = (followData ?? []).map(
    (row: { followed_id: string }) => row.followed_id,
  );

  let profiles: ProfileRecord[] = [];
  if (followedIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", followedIds);

    if (error) throw new Error("Could not load Fit Twin profiles.");
    profiles = (data ?? []) as ProfileRecord[];
  }

  const { data: matchesData, error: matchesError } = await supabase.rpc(
    "get_fit_matches",
    { p_match_category: "overall", p_result_limit: 100 },
  );

  if (matchesError) {
    throw new Error("Could not refresh Fit Twin scores.");
  }

  const matchByUser = new Map(
    ((matchesData ?? []) as MatchRecord[]).map((row) => [row.user_id, row.match_score]),
  );
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const orderedProfiles = followedIds
    .map((id) => profileById.get(id))
    .filter((profile): profile is ProfileRecord => Boolean(profile));

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">MY FIT TWINS</span>
        <h1>The Fit Matches you saved.</h1>
        <p>
          Fit Twins are your saved Fit Matches. Their current safe match score can change as either person improves their Fit Profile; exact measurements remain private.
        </p>
        <Link className="textLink" href="/people">Find more Fit Matches →</Link>
      </div>

      {orderedProfiles.length > 0 ? (
        <div className="cardGrid">
          {orderedProfiles.map((person) => (
            <MatchCard
              key={person.id}
              name={person.display_name?.trim() || person.username}
              handle={`@${person.username}`}
              style="Fit Twin"
              match={matchByUser.get(person.id)}
              secondary="Saved from People My Size"
              description="Open this Fit Twin profile to see their safe match scores and real garment fit evidence."
              href={`/people/${person.username}`}
              linkLabel="View Fit Twin profile →"
              footer={
                <form action={unfollowFitTwin}>
                  <input type="hidden" name="target_user_id" value={person.id} />
                  <input type="hidden" name="return_to" value="/twins" />
                  <button className="secondaryButton" type="submit">Remove Fit Twin</button>
                </form>
              }
            />
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <span className="eyebrow">NO FIT TWINS SAVED</span>
          <h2>Save the Fit Matches you want to keep up with.</h2>
          <p>
            Start in People My Size. Save someone as a Fit Twin when their real-world fit evidence is useful to you.
          </p>
          <Link className="primaryButton" href="/people">Find people my size →</Link>
        </div>
      )}
    </main>
  );
}
