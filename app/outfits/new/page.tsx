import Link from "next/link";
import { redirect } from "next/navigation";
import { createOutfit } from "@/app/outfits/actions";
import { createClient } from "@/lib/supabase/server";
import styles from "../outfits.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ClosetRow = {
  id: string;
  size_label: string;
  product: unknown;
};

type ProductRecord = {
  name: string;
  brand: unknown;
};

type BrandRecord = { name: string };
type FitReport = { closet_item_id: string; fit: string };

const FIT_LABELS: Record<string, string> = {
  too_small: "Too small",
  snug: "Snug",
  just_right: "Just right",
  relaxed: "Relaxed",
  too_big: "Too big",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export default async function NewOutfitPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/outfits/new");
  }

  const params = await searchParams;
  const error = first(params.error);
  const errorMessage =
    error === "invalid_fields"
      ? "Choose 1–6 Closet garments and keep the caption under 500 characters."
      : error === "invalid_photo"
        ? "Add a JPEG, PNG, or WebP photo no larger than 8 MB."
        : error === "invalid_items"
          ? "One of those garments is no longer available in your Closet."
          : error === "save_failed"
            ? "That outfit could not be posted. Try again."
            : null;

  const { data: closetData, error: closetError } = await supabase
    .from("closet_items")
    .select("id, size_label, product:products(name, brand:brands(name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (closetError) {
    throw new Error("Could not load your Closet.");
  }

  const closet = (closetData ?? []) as ClosetRow[];
  const ids = closet.map((item) => item.id);
  let reports: FitReport[] = [];

  if (ids.length > 0) {
    const { data, error: reportError } = await supabase
      .from("fit_reports")
      .select("closet_item_id, fit")
      .in("closet_item_id", ids);

    if (reportError) throw new Error("Could not load Closet fit evidence.");
    reports = (data ?? []) as FitReport[];
  }

  const reportByItem = new Map(reports.map((report) => [report.closet_item_id, report]));

  return (
    <main className="pageShell">
      <div className="pageTitle rowTitle">
        <div>
          <span className="eyebrow">POST AN OUTFIT</span>
          <h1>Show the fit, not your measurements.</h1>
          <p>
            Add one photo and tag 1–6 garments from your Closet. Members see the products, sizes, and fit evidence you intentionally attach—not your private body data.
          </p>
        </div>
        <Link className="secondaryButton" href="/outfits">Back to outfits</Link>
      </div>

      {closet.length === 0 ? (
        <div className="emptyState">
          <span className="eyebrow">NO GARMENTS TO TAG</span>
          <h2>Log something in your Closet first.</h2>
          <p>An outfit needs at least one real garment with a saved fit report.</p>
          <Link className="primaryButton" href="/closet/add">Add a garment →</Link>
        </div>
      ) : (
        <form className={styles.form} action={createOutfit}>
          {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

          <label>
            Outfit photo
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
            <span className="fieldHelp">JPEG, PNG, or WebP · 8 MB max · visible to signed-in members</span>
          </label>

          <label>
            Caption <span className="muted inlineMuted">optional</span>
            <textarea name="caption" rows={4} maxLength={500} placeholder="What are you wearing? How does it feel?" />
          </label>

          <fieldset className={styles.fieldset}>
            <legend>Tag 1–6 garments from your Closet</legend>
            <div className={styles.choices}>
              {closet.map((item) => {
                const product = one<ProductRecord>(item.product);
                const brand = one<BrandRecord>(product?.brand);
                const report = reportByItem.get(item.id);
                return (
                  <label className={styles.choice} key={item.id}>
                    <input type="checkbox" name="closet_item_id" value={item.id} />
                    <span>
                      <strong>{brand?.name || "Brand"} · {product?.name || "Garment"}</strong>
                      <small>Size {item.size_label}{report ? ` · ${FIT_LABELS[report.fit] || report.fit}` : ""}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button className="primaryButton fullButton" type="submit">Post outfit →</button>
        </form>
      )}
    </main>
  );
}
