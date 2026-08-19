import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { followFitTwin, unfollowFitTwin } from "@/app/people/actions";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ username: string }>;

type ProfileRecord = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
};

type MatchRecord = {
  user_id: string;
  match_score: number;
};

type ReportRecord = {
  size_label: string;
  fit: string;
  would_buy_again: boolean | null;
  product: unknown;
};

type ProductRecord = {
  name: string;
  slug: string;
  category: string;
  brand: unknown;
};

type BrandRecord = { name: string };

const FIT_LABELS: Record<string, string> = {
  too_small: "Too small",
  snug: "Snug",
  just_right: "Just right",
  relaxed: "Relaxed",
  too_big: "Too big",
};

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

async function scoreFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetUserId: string,
  category: "overall" | "tops" | "bottoms",
) {
  const { data, error } = await supabase.rpc("get_fit_matches", {
    p_match_category: category,
    p_result_limit: 100,
  });

  if (error) throw error;
  return ((data ?? []) as MatchRecord[]).find((row) => row.user_id === targetUserId)?.match_score;
}

export default async function FitTwinProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;

  if (claimsError || !viewerId) {
    redirect(`/login?next=${encodeURIComponent(`/people/${username}`)}`);
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw new Error("Could not load Fit Twin profile.");
  if (!profileData) notFound();

  const profile = profileData as ProfileRecord;
  const isSelf = profile.id === viewerId;

  const [{ data: reportsData, error: reportsError }, { data: followData, error: followError }, overall, tops, bottoms] =
    await Promise.all([
      supabase
        .from("fit_reports")
        .select(
          "size_label, fit, would_buy_again, product:products(name, slug, category, brand:brands(name))",
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(30),
      isSelf
        ? Promise.resolve({ data: null, error: null })
        : supabase
            .from("follows")
            .select("followed_id")
            .eq("follower_id", viewerId)
            .eq("followed_id", profile.id)
            .maybeSingle(),
      isSelf ? Promise.resolve(undefined) : scoreFor(supabase, profile.id, "overall"),
      isSelf ? Promise.resolve(undefined) : scoreFor(supabase, profile.id, "tops"),
      isSelf ? Promise.resolve(undefined) : scoreFor(supabase, profile.id, "bottoms"),
    ]);

  if (reportsError || followError) {
    throw new Error("Could not load Fit Twin evidence.");
  }

  const reports = (reportsData ?? []) as ReportRecord[];
  const followed = Boolean(followData);
  const name = profile.display_name?.trim() || profile.username;
  const returnTo = `/people/${profile.username}`;

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">FIT TWIN PROFILE</span>
        <h1>{name}</h1>
        <p>
          @{profile.username}{profile.bio ? ` · ${profile.bio}` : ""}
        </p>
        <p>
          Match scores and garment evidence are visible here. Exact body measurements stay private.
        </p>

        {!isSelf ? (
          <div className="statsRow">
            <span><b>{typeof overall === "number" ? `${overall}%` : "—"}</b> overall</span>
            <span><b>{typeof tops === "number" ? `${tops}%` : "—"}</b> tops</span>
            <span><b>{typeof bottoms === "number" ? `${bottoms}%` : "—"}</b> bottoms</span>
          </div>
        ) : null}

        {!isSelf ? (
          <div className="authActions">
            <form action={followed ? unfollowFitTwin : followFitTwin}>
              <input type="hidden" name="target_user_id" value={profile.id} />
              <input type="hidden" name="return_to" value={returnTo} />
              <button className={followed ? "secondaryButton" : "primaryButton"} type="submit">
                {followed ? "Remove Fit Twin" : "Save as Fit Twin"}
              </button>
            </form>
            <Link className="secondaryButton" href="/people">Back to matches</Link>
          </div>
        ) : (
          <div className="authActions">
            <Link className="secondaryButton" href="/onboarding">Edit Fit Profile</Link>
            <Link className="secondaryButton" href="/closet">My Closet</Link>
          </div>
        )}
      </div>

      <section className="section flush">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">REAL GARMENT EVIDENCE</span>
            <h2>What {isSelf ? "you've" : "they've"} actually worn</h2>
          </div>
        </div>

        {reports.length > 0 ? (
          <div className="evidenceList">
            {reports.map((report, index) => {
              const product = one<ProductRecord>(report.product);
              const brand = one<BrandRecord>(product?.brand);
              return (
                <div className="evidence" key={`${product?.slug || "item"}-${index}`}>
                  <div className="avatar small">{(brand?.name || product?.name || "F").slice(0, 1).toUpperCase()}</div>
                  <div>
                    {product ? (
                      <Link className="textLink" href={`/item/${product.slug}`}>{product.name}</Link>
                    ) : (
                      <strong>Garment</strong>
                    )}
                    <span>{brand?.name || "Brand"}</span>
                  </div>
                  <div><span>Size</span><strong>{report.size_label}</strong></div>
                  <div><span>Reported fit</span><strong>{FIT_LABELS[report.fit] || report.fit}</strong></div>
                  <div><span>Buy again</span><strong>{report.would_buy_again === true ? "Yes" : report.would_buy_again === false ? "No" : "—"}</strong></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="emptyState">
            <span className="eyebrow">NO GARMENTS SHARED YET</span>
            <h2>No fit evidence to show yet.</h2>
            <p>When this member logs garments, their product, size, and reported fit can appear here without exposing private body measurements.</p>
          </div>
        )}
      </section>
    </main>
  );
}
