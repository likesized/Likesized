import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_CANONICAL_IMAGE_BATCH = 200;
const FIT_PHOTO_BUCKET = "fit-reference-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type CanonicalProductImageRequest = {
  productId: string;
  variationKey?: string | null;
};

export type CanonicalProductImage = {
  productId: string;
  variationKey: string | null;
  sourceKind: "fit_reference_photo" | "product_photo_evidence" | "official_product_image";
  sourceId: string | null;
  imageUrl: string;
  photoQualityScore: number | null;
  canonicalLocked: boolean;
};

type CanonicalProductImageRow = {
  product_id: string;
  variation_key: string | null;
  source_kind: CanonicalProductImage["sourceKind"];
  source_id: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  image_url: string | null;
  photo_quality_score: number | null;
  canonical_locked: boolean;
};

function requestKey(productId: string, variationKey: string | null | undefined) {
  return `${productId}:${variationKey ?? ""}`;
}

/**
 * Resolve canonical Product imagery through the one Roadmap 13A database boundary.
 * The database returns persisted winners in one bounded RPC. Private Fit Photo paths
 * are then signed in one storage call, so list surfaces do not create per-Product
 * resolver or signing fan-out.
 */
export async function resolveCanonicalProductImages(
  supabase: SupabaseClient,
  requests: CanonicalProductImageRequest[],
): Promise<Map<string, CanonicalProductImage>> {
  if (!requests.length) return new Map();
  if (requests.length > MAX_CANONICAL_IMAGE_BATCH) {
    throw new Error(`At most ${MAX_CANONICAL_IMAGE_BATCH} canonical Product images may be resolved at once`);
  }

  const productIds = requests.map((request) => request.productId);
  const variationKeys = requests.map((request) => request.variationKey ?? null);
  const hasVariation = variationKeys.some((value) => value !== null);

  const { data, error } = await supabase.rpc("get_canonical_product_images", {
    p_product_ids: productIds,
    p_variation_keys: hasVariation ? variationKeys : null,
  });
  if (error) throw error;

  const rows = (data ?? []) as CanonicalProductImageRow[];
  const fitPaths = [...new Set(
    rows
      .filter((row) => row.source_kind === "fit_reference_photo" && row.storage_bucket === FIT_PHOTO_BUCKET && row.storage_path)
      .map((row) => row.storage_path as string),
  )];

  const signedByPath = new Map<string, string>();
  if (fitPaths.length) {
    const { data: signedRows, error: signError } = await supabase.storage
      .from(FIT_PHOTO_BUCKET)
      .createSignedUrls(fitPaths, SIGNED_URL_TTL_SECONDS);
    if (signError) throw signError;
    for (const signed of signedRows ?? []) {
      if (signed.path && signed.signedUrl) signedByPath.set(signed.path, signed.signedUrl);
    }
  }

  const resolved = new Map<string, CanonicalProductImage>();
  for (const row of rows) {
    const url = row.source_kind === "fit_reference_photo"
      ? (row.storage_path ? signedByPath.get(row.storage_path) ?? null : null)
      : row.image_url;
    if (!url) continue;
    resolved.set(requestKey(row.product_id, row.variation_key), {
      productId: row.product_id,
      variationKey: row.variation_key,
      sourceKind: row.source_kind,
      sourceId: row.source_id,
      imageUrl: url,
      photoQualityScore: row.photo_quality_score,
      canonicalLocked: row.canonical_locked,
    });
  }

  return resolved;
}

export function canonicalProductImageKey(productId: string, variationKey?: string | null) {
  return requestKey(productId, variationKey);
}
