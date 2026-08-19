"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function fail(code: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(code)}`);
}

function requiredText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function requiredPositiveNumber(
  formData: FormData,
  name: string,
  max: number,
) {
  const raw = requiredText(formData, name);
  const value = Number(raw);

  if (!raw || !Number.isFinite(value) || value <= 0 || value > max) {
    fail("invalid_measurements");
  }

  return Math.round(value * 100) / 100;
}

function optionalPositiveNumber(
  formData: FormData,
  name: string,
  max: number,
) {
  const raw = requiredText(formData, name);
  if (!raw) return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > max) {
    fail("invalid_measurements");
  }

  return Math.round(value * 100) / 100;
}

export async function saveFitProfile(formData: FormData) {
  const username = requiredText(formData, "username");

  if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
    fail("invalid_username");
  }

  const heightFeetRaw = requiredText(formData, "height_feet");
  const heightInchesRaw = requiredText(formData, "height_inches");
  const heightFeet = Number(heightFeetRaw);
  const heightInches = Number(heightInchesRaw);

  if (
    !heightFeetRaw ||
    !heightInchesRaw ||
    !Number.isInteger(heightFeet) ||
    heightFeet < 1 ||
    heightFeet > 8 ||
    !Number.isFinite(heightInches) ||
    heightInches < 0 ||
    heightInches >= 12
  ) {
    fail("invalid_measurements");
  }

  const heightIn = Math.round((heightFeet * 12 + heightInches) * 100) / 100;
  const weightLb = requiredPositiveNumber(formData, "weight_lb", 9999.99);
  const chestIn = requiredPositiveNumber(formData, "chest_in", 999.99);
  const waistIn = requiredPositiveNumber(formData, "waist_in", 999.99);
  const hipsIn = requiredPositiveNumber(formData, "hips_in", 999.99);
  const inseamIn = requiredPositiveNumber(formData, "inseam_in", 999.99);
  const shouldersIn = optionalPositiveNumber(formData, "shoulders_in", 999.99);
  const torsoIn = optionalPositiveNumber(formData, "torso_in", 999.99);

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/onboarding");
  }

  const now = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username,
      updated_at: now,
    })
    .eq("id", userId)
    .select("id")
    .single();

  if (profileError) {
    if (profileError.code === "23505") {
      fail("username_taken");
    }

    fail("save_failed");
  }

  const { error: fitProfileError } = await supabase
    .from("fit_profiles")
    .upsert(
      {
        user_id: userId,
        height_in: heightIn,
        weight_lb: weightLb,
        chest_in: chestIn,
        waist_in: waistIn,
        hips_in: hipsIn,
        inseam_in: inseamIn,
        shoulders_in: shouldersIn,
        torso_in: torsoIn,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

  if (fitProfileError) {
    fail("save_failed");
  }

  redirect("/people?profile=saved");
}
