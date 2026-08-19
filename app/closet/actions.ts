"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = new Set([
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "other",
]);

const FIT_RATINGS = new Set([
  "too_small",
  "snug",
  "just_right",
  "relaxed",
  "too_big",
]);

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function fail(code: string): never {
  redirect(`/closet/add?error=${encodeURIComponent(code)}`);
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function slugify(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "item"
  );
}

function escapeIlike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type BrandRecord = {
  id: string;
  name: string;
  slug: string;
};

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
};

async function findBrand(supabase: SupabaseClient, name: string) {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug")
    .ilike("name", escapeIlike(name))
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as BrandRecord | null;
}

async function getOrCreateBrand(supabase: SupabaseClient, name: string) {
  const existing = await findBrand(supabase, name);
  if (existing) return existing;

  const baseSlug = slugify(name);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("brands")
      .insert({ name, slug })
      .select("id, name, slug")
      .single();

    if (!error) return data as BrandRecord;

    if (error.code === "23505") {
      const raced = await findBrand(supabase, name);
      if (raced) return raced;
      continue;
    }

    throw error;
  }

  throw new Error("Could not create brand.");
}

async function findProduct(
  supabase: SupabaseClient,
  brandId: string,
  name: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, category")
    .eq("brand_id", brandId)
    .ilike("name", escapeIlike(name))
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ProductRecord | null;
}

async function getOrCreateProduct(
  supabase: SupabaseClient,
  brand: BrandRecord,
  name: string,
  category: string,
) {
  const existing = await findProduct(supabase, brand.id, name);
  if (existing) return existing;

  const baseSlug = `${brand.slug}-${slugify(name)}`.slice(0, 140);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("products")
      .insert({
        brand_id: brand.id,
        name,
        slug,
        category,
      })
      .select("id, name, slug, category")
      .single();

    if (!error) return data as ProductRecord;

    if (error.code === "23505") {
      const raced = await findProduct(supabase, brand.id, name);
      if (raced) return raced;
      continue;
    }

    throw error;
  }

  throw new Error("Could not create product.");
}

async function getOrCreateVariant(
  supabase: SupabaseClient,
  productId: string,
  sizeLabel: string,
) {
  const find = async () => {
    const { data, error } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .eq("size_label", sizeLabel)
      .is("color_label", null)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as { id: string } | null;
  };

  const existing = await find();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      size_label: sizeLabel,
      color_label: null,
    })
    .select("id")
    .single();

  if (!error) return data.id as string;

  if (error.code === "23505") {
    const raced = await find();
    if (raced) return raced.id;
  }

  throw error;
}

export async function addGarment(formData: FormData) {
  const brandName = text(formData, "brand");
  const productName = text(formData, "product");
  const category = text(formData, "category");
  const sizeLabel = text(formData, "size_label");
  const fit = text(formData, "fit");
  const fitNotes = text(formData, "fit_notes") || null;
  const wouldBuyAgainRaw = text(formData, "would_buy_again");
  const wearsRaw = text(formData, "wears_count") || "0";
  const wearsCount = Number(wearsRaw);

  if (
    !brandName ||
    brandName.length > 120 ||
    !productName ||
    productName.length > 180 ||
    !sizeLabel ||
    sizeLabel.length > 40 ||
    !CATEGORIES.has(category) ||
    !FIT_RATINGS.has(fit) ||
    !Number.isInteger(wearsCount) ||
    wearsCount < 0 ||
    wearsCount > 100000 ||
    (fitNotes && fitNotes.length > 1000)
  ) {
    fail("invalid_fields");
  }

  const wouldBuyAgain =
    wouldBuyAgainRaw === "yes"
      ? true
      : wouldBuyAgainRaw === "no"
        ? false
        : null;

  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  if (photo) {
    if (!PHOTO_TYPES[photo.type] || photo.size > 8 * 1024 * 1024) {
      fail("invalid_photo");
    }
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/closet/add");
  }

  const [{ data: profile }, { data: fitProfile }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile?.username || !fitProfile) {
    redirect("/onboarding");
  }

  const closetItemId = randomUUID();
  let photoPath: string | null = null;

  try {
    const brand = await getOrCreateBrand(supabase, brandName);
    const product = await getOrCreateProduct(
      supabase,
      brand,
      productName,
      category,
    );
    const variantId = await getOrCreateVariant(
      supabase,
      product.id,
      sizeLabel,
    );

    if (photo) {
      const extension = PHOTO_TYPES[photo.type];
      photoPath = `${userId}/${closetItemId}/garment.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("closet-photos")
        .upload(photoPath, await photo.arrayBuffer(), {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;
    }

    const { error: closetError } = await supabase.from("closet_items").insert({
      id: closetItemId,
      user_id: userId,
      product_id: product.id,
      variant_id: variantId,
      size_label: sizeLabel,
      wears_count: wearsCount,
      photo_url: photoPath,
    });

    if (closetError) throw closetError;

    const { error: reportError } = await supabase.from("fit_reports").insert({
      user_id: userId,
      closet_item_id: closetItemId,
      product_id: product.id,
      variant_id: variantId,
      size_label: sizeLabel,
      fit,
      fit_notes: fitNotes,
      would_buy_again: wouldBuyAgain,
    });

    if (reportError) {
      await supabase.from("closet_items").delete().eq("id", closetItemId);
      throw reportError;
    }
  } catch {
    if (photoPath) {
      await supabase.storage.from("closet-photos").remove([photoPath]);
    }
    fail("save_failed");
  }

  redirect("/closet?added=1");
}
