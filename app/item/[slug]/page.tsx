import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  recommendSize,
  type RecommendationEvidence,
} from "@/lib/recommendation";

type Params = Promise<{ slug: string }>;

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  image_url: string | null;
  brand: unknown;
};

type BrandRecord = { name: string };

type ReportRecord = {
  user_id: string;
  size_label: string;
  fit: RecommendationEvidence["fit"];
  would_buy_again: boolean | null;
  created_at: string;
  profile: unknown;
};

type ProfileRecord = {
  username: string;
  display_name: string | null;
};

type MatchRecord = {
  user_id: string;
  match_score: number;
};

const FIT_LABELS: Record<RecommendationEvidence["fit"], string> = {
  too_small: "Too small",
  snug: "Snug",
  just_right: "Just right",
  relaxed: "Relaxed",
  too_big: "Too big",
};

const CATEGORY_LABELS: Record<string, string> = {
  tops: "TOPS",
  bottoms: "BOTTOMS",
  dresses: "DRESSES",
  outerwear: "OUTERWEAR",
  shoes: "SHOES",
  other: "OTHER",
};

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

function matchCategory(category: string): "overall" | "tops" | "bottoms" {
  if (category === "bottoms") return "bottoms";
  if (category === "tops" || category === "outerwear") return "tops";
  return "overall";
}

function categoryMatchLabel(category: "overall" | "tops" | "bottoms") {
  return category === "overall"
    ? "Overall match"
    : `${category[0].toUpperCase()}${category.slice(1)} match`;
}

export default async function ItemPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;

  if (claimsError || !viewerId) {
    redirect(`/login?next=${encodeURIComponent(`/item/${slug}`)}`);
  }

  const [{ data: viewerProfile }, { data: viewerFitProfile }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("user_id").eq("user_id", viewerId).maybeSingle(),
  ]);

  if (!viewerProfile?.username || !viewerFitProfile) {
    redirect("/onboarding");
  }

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, category, image_url, brand:brands(name)")
    .eq("slug", slug)
    .maybeSingle();

  if (productError) {
    throw new Error("Could not load product.");
  }

  if (!productData) notFound();

  const product = productData as ProductRecord;
  const brand = one<BrandRecord>(product.brand);
  const selectedMatchCategory = matchCategory(product.category);

  const [{ data: reportsData, error: reportsError }, { data: matchesData, error: matchesError }] =
    await Promise.all([
      supabase
        .from("fit_reports")
        .select(
          "user_id, size_label, fit, would_buy_again, created_at, profile:profiles(username, display_name)",
        )
        .eq("product_id", product.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_fit_matches", {
        p_match_category: selectedMatchCategory,
        p_result_limit: 100,
      }),
    ]);

  if (reportsError || matchesError) {
    throw new Error("Could not load product fit evidence.");
  }

  const reports = (reportsData ?? []) as ReportRecord[];
  const matchRows = (matchesData ?? []) as MatchRecord[];
  const matchByUser = new Map(matchRows.map((row) => [row.user_id, row.match_score]));

  const uniqueReports: ReportRecord[] = [];
  const seenUsers = new Set<string>();

  for (const report of reports) {
    if (seenUsers.has(report.user_id)) continue;
    seenUsers.add(report.user_id);
    uniqueReports.push(report);
  }

  const otherWearers = uniqueReports.filter((report) => report.user_id !== viewerId);
  const similarRows = otherWearers
    .map((report) => ({
      report,
      matchScore: matchByUser.get(report.user_id),
    }))
    .filter(
      (row): row is { report: ReportRecord; matchScore: number } =>
        typeof row.matchScore === "number",
    )
    .sort((a, b) => b.matchScore - a.matchScore);

  const recommendation = recommendSize(
    similarRows.map(({ report, matchScore }) => ({
      sizeLabel: report.size_label,
      fit: report.fit,
      matchScore,
      wouldBuyAgain: report.would_buy_again,
    })),
  );

  const closeMatches = similarRows.filter((row) => row.matchScore >= 70).length;
  const buyAgainAnswers = uniqueReports.filter(
    (report) => report.would_buy_again !== null,
  );
  const buyAgainPercent =
    buyAgainAnswers.length > 0
      ? Math.round(
          (buyAgainAnswers.filter((report) => report.would_buy_again === true).length /
            buyAgainAnswers.length) *
            100,
        )
      : null;
  const categoryLabel = CATEGORY_LABELS[product.category] || "OTHER";
  const matchLabel = categoryMatchLabel(selectedMatchCategory);
  const evidenceRows = similarRows.slice(0, 20);
  const placeholder =
    product.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "FIT";

  return (
    <main className="pageShell">
      <section className="itemHero">
        <div className="productImage">{placeholder}</div>
        <div className="itemDetails">
          <span className="eyebrow">
            {brand?.name?.toUpperCase() || "BRAND"} · {categoryLabel}
          </span>
          <h1>{product.name}</h1>
          <p>
            Fit evidence from real wearers, ranked using the measurements that matter most for this garment category. Their exact measurements stay private.
          </p>

          {recommendation ? (
            <>
              <div className="recommendation">
                <span>RECOMMENDED SIZE</span>
                <strong>{recommendation.sizeLabel}</strong>
                <b>{recommendation.confidence}% confidence</b>
              </div>
              <div className="tiny">
                Based on {recommendation.similarWearerCount} similar wearer{recommendation.similarWearerCount === 1 ? "" : "s"}; {recommendation.sizeEvidenceCount} reported this size.
              </div>
            </>
          ) : (
            <>
              <div className="recommendation">
                <span>RECOMMENDED SIZE</span>
                <strong>—</strong>
                <b>Not enough evidence yet</b>
              </div>
              <div className="tiny">
                We need positive fit reports from people with a meaningful {selectedMatchCategory} match before calling a size.
              </div>
            </>
          )}

          <div className="statsRow">
            <span><b>{reports.length}</b> fit report{reports.length === 1 ? "" : "s"}</span>
            <span><b>{closeMatches}</b> close match{closeMatches === 1 ? "" : "es"}</span>
            <span><b>{buyAgainPercent === null ? "—" : `${buyAgainPercent}%`}</b> would buy again</span>
          </div>
        </div>
      </section>

      <section className="section flush">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">BEST EVIDENCE FIRST</span>
            <h2>People closest to your fit</h2>
          </div>
        </div>

        {evidenceRows.length > 0 ? (
          <div className="evidenceList">
            {evidenceRows.map(({ report, matchScore }) => {
              const profile = one<ProfileRecord>(report.profile);
              const name =
                profile?.display_name?.trim() ||
                profile?.username ||
                "LikeSized member";
              const handle = profile?.username ? `@${profile.username}` : "Member";

              return (
                <div className="evidence" key={report.user_id}>
                  <div className="avatar small">{name.slice(0, 1).toUpperCase()}</div>
                  <div><strong>{name}</strong><span>{handle}</span></div>
                  <div><span>{matchLabel}</span><strong>{matchScore}%</strong></div>
                  <div><span>Wore</span><strong>{report.size_label}</strong></div>
                  <div><span>Reported fit</span><strong>{FIT_LABELS[report.fit]}</strong></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="emptyState">
            <span className="eyebrow">MATCHED EVIDENCE</span>
            <h2>No similar wearers have reported this product yet.</h2>
            <p>
              General fit reports can exist before a matched recommendation does. LikeSized waits for meaningful body-match evidence instead of pretending certainty.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
