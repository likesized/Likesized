"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MeasurementType = {
  key: string;
  dimension: "length" | "weight";
};

type SizeReferenceType = "bra" | "shoe" | "shirt" | "pants" | "dress" | "other";

function fail(code: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(code)}`);
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveFitProfile(formData: FormData) {
  const username = text(formData, "username");
  const unitSystem = text(formData, "unit_system") === "metric" ? "metric" : "imperial";

  if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) fail("invalid_username");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/onboarding");

  const { data: typesData, error: typesError } = await supabase
    .from("measurement_types")
    .select("key, dimension")
    .order("sort_order");
  if (typesError) fail("save_failed");

  const rows: Array<Record<string, unknown>> = [];
  for (const type of (typesData ?? []) as MeasurementType[]) {
    const raw = text(formData, `measurement_${type.key}`);
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) fail("invalid_measurements");

    rows.push({
      measurement_type_key: type.key,
      entered_value: value,
      entered_unit: type.dimension === "weight"
        ? (unitSystem === "imperial" ? "lb" : "kg")
        : (unitSystem === "imperial" ? "in" : "cm"),
      source: "manual",
      method: type.dimension === "weight" ? "scale" : "tape",
    });
  }

  if (!rows.length) fail("invalid_measurements");

  const sizeReferences: Array<Record<string, unknown>> = [];
  const braBandRaw = text(formData, "size_ref_bra_band");
  const braCup = text(formData, "size_ref_bra_cup").toUpperCase();
  const braSystem = text(formData, "size_ref_bra_system").toUpperCase();
  if (braBandRaw || braCup) {
    const band = Number(braBandRaw);
    if (!braBandRaw || !braCup || !["US", "UK", "EU"].includes(braSystem) || !Number.isFinite(band) || band <= 0) {
      fail("invalid_size_references");
    }
    sizeReferences.push({
      reference_type: "bra",
      original_size_label: `${band}${braCup}`,
      sizing_system: braSystem,
      band_size: band,
      cup_designation: braCup,
    });
  }

  const shoeRaw = text(formData, "size_ref_shoe_size");
  const shoeSystem = text(formData, "size_ref_shoe_system").toUpperCase();
  if (shoeRaw) {
    const shoeSize = Number(shoeRaw);
    if (!["US", "UK", "EU", "JP"].includes(shoeSystem) || !Number.isFinite(shoeSize) || shoeSize <= 0) {
      fail("invalid_size_references");
    }
    sizeReferences.push({
      reference_type: "shoe",
      original_size_label: String(shoeSize),
      sizing_system: shoeSystem,
      shoe_size: shoeSize,
    });
  }

  const simpleReferences: Array<[SizeReferenceType, string]> = [
    ["shirt", "size_ref_shirt"],
    ["pants", "size_ref_pants"],
    ["dress", "size_ref_dress"],
    ["other", "size_ref_other"],
  ];
  for (const [referenceType, fieldName] of simpleReferences) {
    const label = text(formData, fieldName);
    if (!label) continue;
    if (label.length > 60) fail("invalid_size_references");
    sizeReferences.push({
      reference_type: referenceType,
      original_size_label: label,
    });
  }

  const { error } = await supabase.rpc("save_fit_profile", {
    p_username: username,
    p_unit_system: unitSystem,
    p_measurements: rows,
    p_size_references: sizeReferences,
  });

  if (error) {
    if (error.code === "23505") fail("username_taken");
    if (error.code === "22023") {
      if (error.message.toLowerCase().includes("size reference")) fail("invalid_size_references");
      fail("invalid_measurements");
    }
    fail("save_failed");
  }

  redirect("/people?profile=saved");
}
