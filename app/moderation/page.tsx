import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lockCatalogField, resolveReport } from "./actions";
import styles from "./moderation.module.css";

type Report = {
  id: string;
  target_type: "outfit_post" | "fit_reference_photo";
  target_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: unknown;
  reported: unknown;
};
type Profile = { username: string | null; display_name: string | null };
type Action = {
  id: string;
  action: string;
  target_type: string;
  reason: string;
  created_at: string;
};
type ProductFlag = {
  id: string;
  name: string;
  garment_type_key: string | null;
  market_segment: string;
  brand: unknown;
};
type Brand = { name: string };
type ModeratedContent = {
  imageUrl: string | null;
  description: string;
};
function one<T>(v: unknown): T | null {
  return Array.isArray(v)
    ? ((v[0] as T | undefined) ?? null)
    : ((v as T | null) ?? null);
}
function name(v: unknown) {
  const p = one<Profile>(v);
  return p?.display_name?.trim() || p?.username || "Member";
}
function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login?next=/moderation");
  const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
  if (!isAdmin) redirect("/");
  const [
    { data: reports, error },
    { data: history },
    { count: closedCount },
    { data: catalogFlags },
  ] = await Promise.all([
    supabase
      .from("content_reports")
      .select(
        "id,target_type,target_id,reported_user_id,reason,details,status,created_at,reporter:profiles!content_reports_reporter_id_fkey(username,display_name),reported:profiles!content_reports_reported_user_id_fkey(username,display_name)",
      )
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("moderation_actions")
      .select("id,action,target_type,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .neq("status", "open"),
    supabase
      .from("products")
      .select("id,name,garment_type_key,market_segment,brand:brands(name)")
      .eq("catalog_review_needed", true)
      .order("created_at", { ascending: true }),
  ]);
  if (error) throw new Error("Could not load moderation queue.");
  const rows = (reports ?? []) as Report[];
  const productFlags = (catalogFlags ?? []) as ProductFlag[];
  const moderatedContent = new Map<string, ModeratedContent>();
  const outfitIds = rows
    .filter((row) => row.target_type === "outfit_post")
    .map((row) => row.target_id);
  const fitPhotoIds = rows
    .filter((row) => row.target_type === "fit_reference_photo")
    .map((row) => row.target_id);
  const [{ data: outfits }, { data: fitPhotos }] = await Promise.all([
    outfitIds.length
      ? supabase
          .from("outfit_posts")
          .select("id,photo_url,caption")
          .in("id", outfitIds)
      : Promise.resolve({ data: [] }),
    fitPhotoIds.length
      ? supabase
          .from("fit_reference_photos")
          .select("id,storage_path")
          .in("id", fitPhotoIds)
      : Promise.resolve({ data: [] }),
  ]);
  await Promise.all([
    ...(outfits ?? []).map(async (post) => {
      const feedPath = post.photo_url.replace(/\/display\.webp$/, "/feed.webp");
      let { data } = await supabase.storage
        .from("outfit-photos")
        .createSignedUrl(feedPath, 1800);
      if (!data?.signedUrl && feedPath !== post.photo_url) {
        ({ data } = await supabase.storage
          .from("outfit-photos")
          .createSignedUrl(post.photo_url, 1800));
      }
      moderatedContent.set(`outfit_post:${post.id}`, {
        imageUrl: data?.signedUrl ?? null,
        description: post.caption?.trim() || "Outfit post",
      });
    }),
    ...(fitPhotos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("fit-reference-photos")
        .createSignedUrl(photo.storage_path, 1800);
      moderatedContent.set(`fit_reference_photo:${photo.id}`, {
        imageUrl: data?.signedUrl ?? null,
        description: "Shared Fit Report photo",
      });
    }),
  ]);
  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">ADMIN</span>
        <h1>Moderation</h1>
        <p>
          Review member reports, disputed garment information, removals, and the
          permanent action history.
        </p>
      </div>
      <section className={styles.summary}>
        <div>
          <strong>{rows.length}</strong>
          <span>Open content reports</span>
        </div>
        <div>
          <strong>{productFlags.length}</strong>
          <span>Garment-information flags</span>
        </div>
        <div>
          <strong>{closedCount ?? 0}</strong>
          <span>Resolved reports</span>
        </div>
      </section>
      <section>
        <h2>Content reports</h2>
        {rows.length ? (
          <div className={styles.queue}>
            {rows.map((row) => (
              <article className={styles.report} key={row.id}>
                {moderatedContent.get(`${row.target_type}:${row.target_id}`)
                  ?.imageUrl ? (
                  <img
                    className={styles.preview}
                    src={
                      moderatedContent.get(
                        `${row.target_type}:${row.target_id}`,
                      )?.imageUrl ?? ""
                    }
                    alt={
                      moderatedContent.get(
                        `${row.target_type}:${row.target_id}`,
                      )?.description ?? "Reported member content"
                    }
                  />
                ) : (
                  <div className={styles.unavailable}>
                    Reported image is no longer available.
                  </div>
                )}
                <strong>{label(row.reason)}</strong>
                <div className={styles.meta}>
                  <span>{label(row.target_type)}</span>
                  <span>Reported by {name(row.reporter)}</span>
                  <span>Content owner: {name(row.reported)}</span>
                  <span>{new Date(row.created_at).toLocaleString()}</span>
                </div>
                {row.details ? <p>{row.details}</p> : null}
                <form className={styles.actions} action={resolveReport}>
                  <input type="hidden" name="report_id" value={row.id} />
                  <input
                    name="reason"
                    maxLength={500}
                    required
                    placeholder="Required moderation note"
                  />
                  <button
                    className={styles.dismiss}
                    name="moderation_action"
                    value="dismiss_report"
                  >
                    Dismiss report
                  </button>
                  <button
                    className={styles.danger}
                    name="moderation_action"
                    value="remove_content"
                  >
                    Remove content
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <h2>No open reports.</h2>
            <p>The content queue is clear.</p>
          </div>
        )}
      </section>
      <section className={styles.history}>
        <h2>Disputed garment information</h2>
        {productFlags.length ? (
          <div className={styles.queue}>
            {productFlags.map((product) => {
              const brand = one<Brand>(product.brand);
              return (
                <article className={styles.report} key={product.id}>
                  <strong>
                    {brand?.name || "Brand"} · {product.name}
                  </strong>
                  <p>
                    Current type: {product.garment_type_key || "Missing"} ·
                    Current segment: {product.market_segment}
                  </p>
                  <form className={styles.actions} action={lockCatalogField}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <select name="field_kind" defaultValue="garment_type">
                      <option value="garment_type">Garment type</option>
                      <option value="market_segment">Market segment</option>
                  <option value="attribute">Controlled attribute</option>
                  <option value="description">Description</option>
                    </select>
                    <input
                      name="field_key"
                      required
                      placeholder="Field key (for example garment_type)"
                    />
                    <input
                      name="locked_value"
                      required
                      placeholder="Correct controlled value"
                    />
                    <input
                      name="reason"
                      required
                      maxLength={500}
                      placeholder="Why this is the final value"
                    />
                    <button className={styles.dismiss}>Lock decision</button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <p>No disputed garment fields need review.</p>
        )}
      </section>
      <section className={styles.history}>
        <h2>Recent moderation actions</h2>
        <ul>
          {((history ?? []) as Action[]).map((item) => (
            <li key={item.id}>
              <strong>{label(item.action)}</strong> · {label(item.target_type)}{" "}
              · {item.reason} · {new Date(item.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
