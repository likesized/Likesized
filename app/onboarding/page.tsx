import { redirect } from "next/navigation";
import { saveFitProfile } from "@/app/onboarding/actions";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function displayNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/onboarding");
  }

  const [{ data: profile, error: profileError }, { data: fitProfile, error: fitError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("fit_profiles")
        .select(
          "height_in, weight_lb, chest_in, waist_in, hips_in, inseam_in, shoulders_in, torso_in",
        )
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (profileError || fitError) {
    throw new Error("Could not load Fit Profile.");
  }

  const params = await searchParams;
  const error = first(params.error);
  const errorMessage =
    error === "invalid_username"
      ? "Choose a username with 3–32 letters, numbers, or underscores."
      : error === "username_taken"
        ? "That username is already taken. Try another one."
        : error === "invalid_measurements"
          ? "Check the measurements and try again."
          : error === "save_failed"
            ? "Your Fit Profile could not be saved. Try again."
            : null;

  const totalHeight = fitProfile?.height_in ? Number(fitProfile.height_in) : null;
  const heightFeet = totalHeight === null ? "" : String(Math.floor(totalHeight / 12));
  const heightInches =
    totalHeight === null
      ? ""
      : String(Math.round((totalHeight - Math.floor(totalHeight / 12) * 12) * 100) / 100);
  const editing = Boolean(fitProfile);

  return (
    <main className="onboardingShell">
      <section className="onboardingIntro">
        <span className="eyebrow">FIT PROFILE</span>
        <h1>{editing ? "Keep your fit data current." : "Give us the measurements clothing actually cares about."}</h1>
        <p>
          Your exact measurements stay private. They power garment-specific matching; other members see match percentages, not your measurements.
        </p>
        <div className="privacyNote">
          <b>Privacy default:</b> precise measurements hidden, match percentages visible.
        </div>
      </section>

      <form className="fitForm" action={saveFitProfile}>
        {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

        <div className="fieldPair">
          <label>
            Username
            <div>
              <input
                name="username"
                type="text"
                autoComplete="username"
                defaultValue={profile?.username ?? ""}
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_]{3,32}"
                placeholder="your_username"
                required
              />
            </div>
          </label>
          <label>
            What others see
            <div>
              <span>Your username and match percentage. Never your exact measurements.</span>
            </div>
          </label>
        </div>

        <div className="fieldPair">
          <label>
            Height
            <div>
              <input
                name="height_feet"
                type="number"
                inputMode="numeric"
                min="1"
                max="8"
                step="1"
                defaultValue={heightFeet}
                aria-label="Height feet"
                placeholder="5"
                required
              />
              <span>ft</span>
              <input
                name="height_inches"
                type="number"
                inputMode="decimal"
                min="0"
                max="11.99"
                step="0.01"
                defaultValue={heightInches}
                aria-label="Height inches"
                placeholder="10"
                required
              />
              <span>in</span>
            </div>
          </label>
          <label>
            Weight
            <div>
              <input
                name="weight_lb"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={displayNumber(fitProfile?.weight_lb)}
                placeholder="194"
                required
              />
              <span>lb</span>
            </div>
          </label>
        </div>

        <div className="fieldPair">
          <label>
            Chest / bust
            <div>
              <input
                name="chest_in"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={displayNumber(fitProfile?.chest_in)}
                placeholder="43"
                required
              />
              <span>in</span>
            </div>
          </label>
          <label>
            Waist
            <div>
              <input
                name="waist_in"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={displayNumber(fitProfile?.waist_in)}
                placeholder="35"
                required
              />
              <span>in</span>
            </div>
          </label>
        </div>

        <div className="fieldPair">
          <label>
            Hips
            <div>
              <input
                name="hips_in"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={displayNumber(fitProfile?.hips_in)}
                placeholder="41"
                required
              />
              <span>in</span>
            </div>
          </label>
          <label>
            Inseam
            <div>
              <input
                name="inseam_in"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={displayNumber(fitProfile?.inseam_in)}
                placeholder="30"
                required
              />
              <span>in</span>
            </div>
          </label>
        </div>

        <details open={Boolean(fitProfile?.shoulders_in || fitProfile?.torso_in)}>
          <summary>Optional measurements for even better matches</summary>
          <div className="fieldPair optionalFields">
            <label>
              Shoulder width
              <div>
                <input
                  name="shoulders_in"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  defaultValue={displayNumber(fitProfile?.shoulders_in)}
                  placeholder="19"
                />
                <span>in</span>
              </div>
            </label>
            <label>
              Torso length
              <div>
                <input
                  name="torso_in"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  defaultValue={displayNumber(fitProfile?.torso_in)}
                  placeholder="25"
                />
                <span>in</span>
              </div>
            </label>
          </div>
        </details>

        <button type="submit" className="primaryButton fullButton">
          {editing ? "Save Fit Profile →" : "Find people LikeSized to me →"}
        </button>
      </form>
    </main>
  );
}
