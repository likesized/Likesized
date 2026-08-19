"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MeasurementType = {
  key: string;
  dimension: "length" | "weight";
};

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

  const { error } = await supabase.rpc("save_fit_profile", {
    p_username: username,
    p_unit_system: unitSystem,
    p_measurements: rows,
  });

  if (error) {
    if (error.code === "23505") fail("username_taken");
    if (error.code === "22023") fail("invalid_measurements");
    fail("save_failed");
  }

  redirect("/people?profile=saved");
}
