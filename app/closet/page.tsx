import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ClosetRow = {
  id: string;
  size_label: string;
  wears_count: number;
  photo_url: string | null;
  product: unknown;
};

type ProductView = {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: unknown;
};

type BrandView = { name: string };

type FitReport = {
  closet_item_id: string;
  fit: string;
  would_buy_again: boolean | null;
};

const FIT_LABELS: Record<string, string> = {
  too_small: "Too small",
  snug: "Snug",
  just_right: "Just right",
  relaxed: "Relaxed",
  too_big: "Too big",
};

const CATEGORY_LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  other: "Other",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/closet");
  }

  const params = await searchParams;
  const added = first(params.added) === "1";

  const { data, error } = await supabase
    .from("closet_items")
    .select(
      "id, size_label, wears_count, photo_url, product:products(id, name, slug, category, brand:brands(name))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load Closet.");
  }

  const items = (data ?? []) as ClosetRow[];
  const itemIds = items.map((item) => item.id);
  let reports: FitReport[] = [];

  if (itemIds.length > 0) {
    const { data: reportData, error: reportError } = await supabase
      .from("fit_reports")
      .select("closet_item_id, fit, would_buy_again")
      .in("closet_item_id", itemIds);

    if (reportError) {
      throw new Error("Could not load fit reports.");
    }

    reports = (reportData ?? []) as FitReport[];
  }

  const reportByItem = new Map(reports.map((report) => [report.closet_item_id, report]));

  const photoUrls = new Map<string, string>();
  await Promise.all(
    items.map(async (item) => {
      if (!item.photo_url) return;
      const { data: signed } = await supabase.storage
        .from("closet-photos")
        .createSignedUrl(item.photo_url, 60 * 30);
      if (signed?.signedUrl) photoUrls.set(item.id, signed.signedUrl);
    }),
  );

  const garmentCount = items.length;
  const strength = Math.min(100, garmentCount * 10);
  const remaining = Math.max(0, 10 - garmentCount);

  return (
    <main className="pageShell">
      <div className="pageTitle rowTitle">
        <div>
          <span className="eyebrow">MY CLOSET</span>
          <h1>Teach LikeSized what fits you.</h1>
        </div>
        <Link className="primaryButton" href="/closet/add">
          + Add garment
        </Link>
      </div>

      {added ? <div className="authMessage">Garment added to your Closet.</div> : null}

      <div className="profileStrength">
        <div>
          <strong>Fit evidence strength</strong>
          <span>
            {garmentCount} garment{garmentCount === 1 ? "" : "s"} logged
            {remaining > 0
              ? ` · Add ${remaining} more for stronger recommendations`
              : " · Strong V1 fit history"}
          </span>
        </div>
        <div className="meter"><span style={{ width: `${strength}%` }} /></div>
        <b>{strength}%</b>
      </div>

      {items.length > 0 ? (
        <div className="tableLike">
          {items.map((item) => {
            const product = one<ProductView>(item.product);
            const brand = one<BrandView>(product?.brand);
            const report = reportByItem.get(item.id);
            const signedPhoto = photoUrls.get(item.id);

            return (
              <div className="closetRow" key={item.id}>
                {signedPhoto ? (
                  <img className="garmentPhoto" src={signedPhoto} alt="" />
                ) : (
                  <div className="garmentThumb">{(brand?.name || "?").slice(0, 1).toUpperCase()}</div>
                )}
                <div className="closetMain">
                  <span className="muted">{brand?.name || "Brand"}</span>
                  <strong>{product?.name || "Garment"}</strong>
                  <span>{CATEGORY_LABELS[product?.category || ""] || "Other"}</span>
                </div>
                <div><span className="muted">SIZE</span><strong>{item.size_label}</strong></div>
                <div><span className="muted">FIT</span><strong>{FIT_LABELS[report?.fit || ""] || "—"}</strong></div>
                <div><span className="muted">WORN</span><strong>{item.wears_count}×</strong></div>
                <span className="closetStatus">
                  {report?.would_buy_again === true
                    ? "Buy again"
                    : report?.would_buy_again === false
                      ? "Wouldn't rebuy"
                      : "Logged"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="emptyState">
          <span className="eyebrow">YOUR CLOSET IS EMPTY</span>
          <h2>Start with something you already know fits.</h2>
          <p>
            Log the brand, product, size, and fit. Every real garment gives LikeSized better evidence for future recommendations.
          </p>
          <Link className="primaryButton" href="/closet/add">Add my first garment →</Link>
        </div>
      )}
    </main>
  );
}
