import Link from "next/link";
import { redirect } from "next/navigation";
import { GARMENT_CATEGORIES, GARMENT_TYPES } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";
import OutfitComposer, { type ClosetOption, type InitialOutfit } from "./OutfitComposer";
import styles from "../outfits.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ClosetRow = { id: string; size_label: string; created_at: string; product: unknown };
type ProductRecord = { name: string; garment_type_key: string | null; category: string; brand: unknown };
type BrandRecord = { name: string };
type FitReport = { closet_item_id: string; fit: string; created_at: string };
type StyleSuggestionRow = { display_tag: string | null };
type OutfitRow = { id: string; status: "draft" | "published"; headline: string | null; story: string | null; comments_enabled: boolean };
type OutfitPhotoRow = { id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; sort_order: number; is_main: boolean };
type OutfitPhotoTag = { photo_id: string; closet_item_id: string; x: number; y: number };
const FIT_LABELS: Record<string, string> = { too_small: "Too small", snug: "Snug", just_right: "Just right", relaxed: "Relaxed", too_big: "Too big" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPE_LABELS = new Map(GARMENT_TYPES.map((item) => [item.key, item.label]));
const CATEGORY_LABELS: ReadonlyMap<string, string> = new Map(GARMENT_CATEGORIES.map((item) => [item.value, item.label]));
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }

export default async function NewOutfitPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedId = first(params.draft) || first(params.edit) || "";
  if (requestedId && !UUID.test(requestedId)) redirect("/outfits/new");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/outfits/new");

  const outfitRequest = requestedId
    ? supabase.from("outfit_posts").select("id,status,headline,story,comments_enabled").eq("id", requestedId).eq("user_id", userId).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [profileResult, closetResult, styleSuggestionResult, outfitResult] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("closet_items").select("id,size_label,created_at,product:products(name,garment_type_key,category,brand:brands(name))").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.rpc("get_outfit_style_tag_suggestions", { p_query: null, p_result_limit: 50 }),
    outfitRequest,
  ]);
  if (profileResult.error || !profileResult.data?.username) redirect("/onboarding");
  if (closetResult.error) throw new Error(`Could not load your Closet: ${closetResult.error.message}`);
  if (styleSuggestionResult.error) throw new Error(`Could not load Style Tag suggestions: ${styleSuggestionResult.error.message}`);
  if (requestedId && (outfitResult.error || !outfitResult.data)) redirect("/outfits/new");

  const styleSuggestions: string[] = [...new Set(((styleSuggestionResult.data ?? []) as StyleSuggestionRow[]).map((row) => String(row.display_tag ?? "").trim()).filter(Boolean))];
  const closetRows = (closetResult.data ?? []) as ClosetRow[];
  const closetIds = closetRows.map((item) => item.id);
  const requestedPreselectedClosetItemId = first(params.closet_item_id) ?? "";
  const preselectedClosetItemId = UUID.test(requestedPreselectedClosetItemId) && closetIds.includes(requestedPreselectedClosetItemId) ? requestedPreselectedClosetItemId : "";

  const reportsRequest = closetIds.length
    ? supabase.from("fit_reports").select("closet_item_id,fit,created_at").in("closet_item_id", closetIds).order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });
  const outfitPartsRequest = requestedId
    ? Promise.all([
      supabase.from("outfit_post_items").select("closet_item_id").eq("post_id", requestedId),
      supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id", requestedId).order("sort_order"),
      supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id", requestedId).order("sort_order"),
      supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main").eq("post_id", requestedId).order("sort_order"),
    ])
    : Promise.resolve(null);

  const [reportsResult, outfitParts] = await Promise.all([reportsRequest, outfitPartsRequest]);
  if (reportsResult.error) throw new Error(`Could not load Closet fit evidence: ${reportsResult.error.message}`);
  const reports = (reportsResult.data ?? []) as FitReport[];
  const reportByItem = new Map<string, FitReport>();
  for (const report of reports) if (!reportByItem.has(report.closet_item_id)) reportByItem.set(report.closet_item_id, report);

  const closet: ClosetOption[] = closetRows.map((item) => {
    const product = one<ProductRecord>(item.product);
    const brand = one<BrandRecord>(product?.brand);
    const report = reportByItem.get(item.id);
    const garmentType = product?.garment_type_key ?? "unknown";
    const category = product?.category ?? "unknown";
    return {
      id: item.id,
      label: `${brand?.name || "Brand"} · ${product?.name || "Garment"}`,
      detail: `Size ${item.size_label}${report ? ` · ${FIT_LABELS[report.fit] || report.fit}` : ""}`,
      brand: brand?.name || "Brand",
      itemName: product?.name || "Garment",
      garmentType,
      garmentTypeLabel: TYPE_LABELS.get(garmentType) ?? garmentType.replaceAll("_", " "),
      category,
      categoryLabel: CATEGORY_LABELS.get(category) ?? category.replaceAll("_", " "),
      createdAt: item.created_at,
    };
  });

  let initial: InitialOutfit | null = null;
  if (requestedId && outfitParts) {
    const row = outfitResult.data as OutfitRow;
    const [itemsResult, occasionsResult, stylesResult, photosResult] = outfitParts;
    if (itemsResult.error || occasionsResult.error || stylesResult.error || photosResult.error) throw new Error("Could not load this Outfit.");
    const photoRows = (photosResult.data ?? []) as OutfitPhotoRow[];
    const photoIds = photoRows.map((photo) => photo.id);

    const tagsRequest = photoIds.length
      ? supabase.from("outfit_photo_tags").select("photo_id,closet_item_id,x,y").in("photo_id", photoIds)
      : Promise.resolve({ data: [], error: null });
    const urlsRequest = Promise.all(photoRows.map(async (photo) => {
      if (photo.bucket === "outfit-photos") {
        return [photo.id, supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl] as const;
      }
      const { data, error } = await supabase.storage.from("outfit-draft-photos").createSignedUrl(photo.display_path, 60 * 60);
      if (error) throw new Error(`Could not load an Outfit draft photo: ${error.message}`);
      return [photo.id, data.signedUrl] as const;
    }));
    const [photoTagsResult, photoUrls] = await Promise.all([tagsRequest, urlsRequest]);
    if (photoTagsResult.error) throw new Error(`Could not load Outfit photo tags: ${photoTagsResult.error.message}`);
    const photoTags = (photoTagsResult.data ?? []) as OutfitPhotoTag[];
    const urlByPhoto = new Map<string, string>(photoUrls);

    initial = {
      id: row.id,
      status: row.status,
      headline: row.headline ?? "",
      story: row.story ?? "",
      commentsEnabled: row.comments_enabled,
      closetItemIds: (itemsResult.data ?? []).map((item) => String(item.closet_item_id)),
      occasions: (occasionsResult.data ?? []).map((item) => String(item.occasion)),
      styleTags: (stylesResult.data ?? []).map((item) => String(item.display_tag)),
      photos: photoRows.flatMap((photo) => {
        const url = urlByPhoto.get(photo.id);
        return url ? [{ id: photo.id, url, isMain: photo.is_main, sortOrder: photo.sort_order, tags: photoTags.filter((tag) => tag.photo_id === photo.id).map((tag) => ({ closetItemId: tag.closet_item_id, x: Number(tag.x), y: Number(tag.y) })) }] : [];
      }),
    };
  } else if (preselectedClosetItemId) {
    initial = { id: "", status: "draft", headline: "", story: "", commentsEnabled: true, closetItemIds: [preselectedClosetItemId], occasions: [], styleTags: [], photos: [] };
  }

  const saved = first(params.saved) === "1";
  const editing = initial?.status === "published";
  return <main className="pageShell">
    <div className={styles.composerPageHeader}>
      <div><span className="eyebrow">{editing ? "EDIT OUTFIT" : "NEW OUTFIT"}</span><h1>{editing ? "Edit Outfit." : "Create an Outfit."}</h1><p>Add photos, a few details, and the items you’re wearing.</p></div>
      <Link className={styles.quietBackLink} href={editing && initial?.id ? `/outfits/${initial.id}` : "/outfits"}>← Back to Outfits</Link>
    </div>
    {saved ? <div className="authMessage">Draft saved.</div> : null}
    <OutfitComposer closet={closet} initial={initial} styleSuggestions={styleSuggestions} />
  </main>;
}
