import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FitTwinsPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/twins");

  const [{ data: profile, error: profileError }, { data: fitProfile, error: fitProfileError }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (profileError || fitProfileError) throw new Error("Could not load Fit Twin status.");
  if (!profile?.username || !fitProfile?.completed_at) redirect("/onboarding");

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">MY FIT TWINS</span>
        <h1>Fit Twins are determined by LikeSized—not saved by hand.</h1>
        <p>
          Following and Fit Twin status are separate. Fit Twins are people LikeSized identifies from strong current-person body Match quality. Following someone never creates or removes Fit Twin status.
        </p>
      </div>

      <div className="emptyState">
        <span className="eyebrow">QUALIFICATION UNDER VALIDATION</span>
        <h2>No manual Fit Twin list is shown.</h2>
        <p>
          The exact Fit Twin qualification threshold is intentionally not hard-coded until the recovered matching model is fully validated. People My Size remains available for current Match discovery, and Following remains available for the people you choose to keep up with.
        </p>
        <div className="authActions">
          <Link className="primaryButton" href="/people">People My Size →</Link>
          <Link className="secondaryButton" href="/following">Following →</Link>
        </div>
      </div>
    </main>
  );
}
