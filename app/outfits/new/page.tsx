import Link from "next/link";
import { redirect } from "next/navigation";
import { GARMENT_CATEGORIES, GARMENT_TYPES } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";
import OutfitComposer, { type ClosetOption, type InitialOutfit } from "./OutfitComposer";
import styles from "../outfits.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ClosetRow = { id: string; size_label: string; variant_id:string|null; created_at: string; product: unknown; submission:unknown };
type ProductRecord = { id:string;name: string; image_url:string|null;garment_type_key: string | null; category: string; brand: unknown };
type SubmissionRecord={product_photo_storage_path:string|null};
type ProductPhotoEvidence={product_id:string;public_url:string;source_status:string;created_at:string};
type BrandRecord = { name: string };
type FitReport = { closet_item_id: string; fit: string; created_at: string; garment_answers:Record<string,string>|null };
type StyleSuggestionRow = { display_tag: string | null };
type OutfitRow = { id: string; status: "draft" | "published"; headline: string | null; story: string | null; comments_enabled: boolean };
type OutfitPhotoRow = { id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; sort_order: number; is_main: boolean; caption:string|null };
type OutfitPhotoTag = { photo_id: string; closet_item_id: string; x: number; y: number };
type VariantRow={id:string;color_label:string|null};
type FitPhotoRow={closet_item_id:string;storage_path:string;photo_role:string};
const FIT_LABELS: Record<string, string> = { too_small: "Too small", snug: "Snug", just_right: "Just right", relaxed: "Relaxed", too_big: "Too big" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPE_BY_KEY=new Map(GARMENT_TYPES.map((item)=>[item.key,item]));
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
    supabase.from("closet_items").select("id,size_label,variant_id,created_at,product:products(id,name,image_url,garment_type_key,category,brand:brands(name)),submission:garment_submissions(product_photo_storage_path)").eq("user_id", userId).order("created_at", { ascending: false }),
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
  const products=closetRows.map((row)=>one<ProductRecord>(row.product)).filter((row):row is ProductRecord=>Boolean(row));
  const productIds=[...new Set(products.map((product)=>product.id))];
  const variantIds=[...new Set(closetRows.map((row)=>row.variant_id).filter((value):value is string=>Boolean(value)))];
  const requestedPreselectedClosetItemId = first(params.closet_item_id) ?? "";
  const preselectedClosetItemId = UUID.test(requestedPreselectedClosetItemId) && closetIds.includes(requestedPreselectedClosetItemId) ? requestedPreselectedClosetItemId : "";

  const reportsRequest = closetIds.length ? supabase.from("fit_reports").select("closet_item_id,fit,created_at,garment_answers").in("closet_item_id", closetIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null });
  const variantsRequest=variantIds.length?supabase.from("product_variants").select("id,color_label").in("id",variantIds):Promise.resolve({data:[],error:null});
  const fitPhotosRequest=closetIds.length?supabase.from("fit_reference_photos").select("closet_item_id,storage_path,photo_role").in("closet_item_id",closetIds):Promise.resolve({data:[],error:null});
  const productPhotosRequest=productIds.length?supabase.from("product_photo_evidence").select("product_id,public_url,source_status,created_at").in("product_id",productIds).neq("source_status","rejected").order("created_at",{ascending:false}):Promise.resolve({data:[],error:null});
  const outfitPartsRequest = requestedId
    ? Promise.all([
      supabase.from("outfit_post_items").select("closet_item_id").eq("post_id", requestedId),
      supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id", requestedId).order("sort_order"),
      supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id", requestedId).order("sort_order"),
      supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main,caption").eq("post_id", requestedId).order("sort_order"),
    ])
    : Promise.resolve(null);

  const [reportsResult,variantsResult,fitPhotosResult,productPhotosResult,outfitParts] = await Promise.all([reportsRequest,variantsRequest,fitPhotosRequest,productPhotosRequest,outfitPartsRequest]);
  if (reportsResult.error) throw new Error(`Could not load Closet fit evidence: ${reportsResult.error.message}`);
  if(variantsResult.error||fitPhotosResult.error||productPhotosResult.error)throw new Error("Could not load Closet garment details.");
  const reports = (reportsResult.data ?? []) as FitReport[];
  const reportByItem = new Map<string, FitReport>();
  for (const report of reports) if (!reportByItem.has(report.closet_item_id)) reportByItem.set(report.closet_item_id, report);
  const variantById=new Map(((variantsResult.data??[]) as VariantRow[]).map((row)=>[row.id,row]));
  const fitPhotosByItem=new Map<string,FitPhotoRow[]>();
  for(const row of (fitPhotosResult.data??[]) as FitPhotoRow[])fitPhotosByItem.set(row.closet_item_id,[...(fitPhotosByItem.get(row.closet_item_id)??[]),row]);
  const productPhotoByProduct=new Map<string,string>();
  for(const row of (productPhotosResult.data??[]) as ProductPhotoEvidence[])if(!productPhotoByProduct.has(row.product_id)&&row.public_url)productPhotoByProduct.set(row.product_id,row.public_url);
  const signedFitPhotoByPath=new Map<string,string>();
  await Promise.all(((fitPhotosResult.data??[]) as FitPhotoRow[]).map(async(row)=>{const {data}=await supabase.storage.from("fit-reference-photos").createSignedUrl(row.storage_path,60*30);if(data?.signedUrl)signedFitPhotoByPath.set(row.storage_path,data.signedUrl);}));
  const privateProductPhotoByItem=new Map<string,string>();
  await Promise.all(closetRows.map(async(item)=>{const submission=one<SubmissionRecord>(item.submission);const path=submission?.product_photo_storage_path;if(!path)return;const {data}=await supabase.storage.from("catalog-submission-photos").createSignedUrl(path,60*30);if(data?.signedUrl)privateProductPhotoByItem.set(item.id,data.signedUrl);}));

  const closet: ClosetOption[] = closetRows.map((item) => {
    const product = one<ProductRecord>(item.product);
    const brand = one<BrandRecord>(product?.brand);
    const report = reportByItem.get(item.id);
    const garmentType = product?.garment_type_key ?? "unknown";
    const category = product?.category ?? "unknown";
    const typeDefinition=TYPE_BY_KEY.get(garmentType);
    const recordedAnswers=report?.garment_answers??{};
    const answers=(typeDefinition?.questions??[]).flatMap((question)=>{
      const answer=recordedAnswers[question.key];
      if(typeof answer!=="string"||!answer)return [];
      const option=question.options.find((candidate)=>candidate.value===answer);
      return option?[{label:question.label,value:option.label}]:[];
    }).slice(0,4);
    const fitRows=fitPhotosByItem.get(item.id)??[];
    const frontRow=fitRows.find((row)=>row.photo_role==="front");
    const backRow=fitRows.find((row)=>row.photo_role==="back");
    const frontUrl=frontRow?signedFitPhotoByPath.get(frontRow.storage_path):undefined;
    const productUrl=product?.image_url||(product?productPhotoByProduct.get(product.id):undefined)||privateProductPhotoByItem.get(item.id);
    const backUrl=backRow?signedFitPhotoByPath.get(backRow.storage_path):undefined;
    const photoUrls=[...new Set([frontUrl,productUrl,backUrl].filter((value):value is string=>Boolean(value)))];
    const garmentTypeLabel=TYPE_LABELS.get(garmentType) ?? garmentType.replaceAll("_", " ");
    const color=item.variant_id?variantById.get(item.variant_id)?.color_label??null:null;
    return {
      id: item.id,
      label: `${brand?.name || "Brand"} · ${product?.name || "Garment"}`,
      detail: [garmentTypeLabel,`Size ${item.size_label}`,color].filter(Boolean).join(" · "),
      brand: brand?.name || "Brand",
      itemName: product?.name || "Garment",
      garmentType,
      garmentTypeLabel,
      category,
      categoryLabel: CATEGORY_LABELS.get(category) ?? category.replaceAll("_", " "),
      size:item.size_label,
      fit:report?FIT_LABELS[report.fit]||report.fit:"Not listed",
      color,
      photoUrls,
      answers,
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
    const tagsRequest = photoIds.length ? supabase.from("outfit_photo_tags").select("photo_id,closet_item_id,x,y").in("photo_id", photoIds) : Promise.resolve({ data: [], error: null });
    const urlsRequest = Promise.all(photoRows.map(async (photo) => {
      if (photo.bucket === "outfit-photos") return [photo.id, supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl] as const;
      const { data, error } = await supabase.storage.from("outfit-draft-photos").createSignedUrl(photo.display_path, 60 * 60);
      if (error) throw new Error(`Could not load an Outfit draft photo: ${error.message}`);
      return [photo.id, data.signedUrl] as const;
    }));
    const [photoTagsResult, photoUrls] = await Promise.all([tagsRequest, urlsRequest]);
    if (photoTagsResult.error) throw new Error(`Could not load Outfit photo tags: ${photoTagsResult.error.message}`);
    const photoTags = (photoTagsResult.data ?? []) as OutfitPhotoTag[];
    const urlByPhoto = new Map<string, string>(photoUrls);
    initial = { id: row.id, status: row.status, headline: row.headline ?? "", story: row.story ?? "", commentsEnabled: row.comments_enabled, closetItemIds: (itemsResult.data ?? []).map((item) => String(item.closet_item_id)), occasions: (occasionsResult.data ?? []).map((item) => String(item.occasion)), styleTags: (stylesResult.data ?? []).map((item) => String(item.display_tag)), photos: photoRows.flatMap((photo) => { const url = urlByPhoto.get(photo.id); return url ? [{ id: photo.id, url, isMain: photo.is_main, sortOrder: photo.sort_order, caption:photo.caption??"", tags: photoTags.filter((tag) => tag.photo_id === photo.id).map((tag) => ({ closetItemId: tag.closet_item_id, x: Number(tag.x), y: Number(tag.y) })) }] : []; }) };
  } else if (preselectedClosetItemId) {
    initial = { id: "", status: "draft", headline: "", story: "", commentsEnabled: true, closetItemIds: [preselectedClosetItemId], occasions: [], styleTags: [], photos: [] };
  }

  const saved = first(params.saved) === "1";
  const editing = initial?.status === "published";
  return <main className="pageShell">
    <div className={styles.composerPageHeader}><div><span className="eyebrow">{editing ? "EDIT OUTFIT" : "NEW OUTFIT"}</span><h1>{editing ? "Edit Outfit." : "Create an Outfit."}</h1><p>Add photos, a few details, and the items you’re wearing.</p></div><Link prefetch={false} data-full-navigation="true" className={styles.quietBackLink} href={editing && initial?.id ? `/outfits/${initial.id}` : "/closet?tab=outfits"}>{editing ? "← Back to Outfit" : "← Back to My Closet"}</Link></div>
    {saved ? <div className="authMessage">Draft saved.</div> : null}
    <OutfitComposer closet={closet} initial={initial} styleSuggestions={styleSuggestions} />
  </main>;
}
