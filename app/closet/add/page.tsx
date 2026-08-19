import Link from "next/link";
import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddGarmentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/closet/add");
  }

  const params = await searchParams;
  const error = first(params.error);
  const errorMessage =
    error === "invalid_fields"
      ? "Check the garment details and try again."
      : error === "invalid_photo"
        ? "Photo must be a JPEG, PNG, or WebP and no larger than 8 MB."
        : error === "save_failed"
          ? "That garment could not be saved. Try again."
          : null;

  return (
    <main className="pageShell addGarmentShell">
      <div className="pageTitle rowTitle">
        <div>
          <span className="eyebrow">MY CLOSET · ADD GARMENT</span>
          <h1>Log what you actually wear.</h1>
          <p>
            The garment stays in your private Closet. Its size and fit result become evidence that helps people built like you.
          </p>
        </div>
        <Link className="secondaryButton" href="/closet">
          Back to Closet
        </Link>
      </div>

      <form className="garmentForm" action={addGarment}>
        {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

        <div className="fieldPair">
          <label>
            Brand
            <input name="brand" type="text" maxLength={120} placeholder="Levi's" required />
          </label>
          <label>
            Product / style
            <input name="product" type="text" maxLength={180} placeholder="541 Athletic Taper" required />
          </label>
        </div>

        <div className="fieldPair">
          <label>
            Category
            <select name="category" defaultValue="" required>
              <option value="" disabled>Select category</option>
              <option value="tops">Tops</option>
              <option value="bottoms">Bottoms</option>
              <option value="dresses">Dresses</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Size you own
            <input name="size_label" type="text" maxLength={40} placeholder="XL or 34×30" required />
          </label>
        </div>

        <div className="fieldPair">
          <label>
            How does it fit?
            <select name="fit" defaultValue="" required>
              <option value="" disabled>Select fit</option>
              <option value="too_small">Too small</option>
              <option value="snug">Snug</option>
              <option value="just_right">Just right</option>
              <option value="relaxed">Relaxed</option>
              <option value="too_big">Too big</option>
            </select>
          </label>
          <label>
            Would you buy it again?
            <select name="would_buy_again" defaultValue="unsure">
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unsure">Not sure</option>
            </select>
          </label>
        </div>

        <div className="fieldPair">
          <label>
            Times worn
            <input name="wears_count" type="number" min="0" max="100000" step="1" defaultValue="0" />
          </label>
          <label>
            Optional garment photo
            <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <span className="fieldHelp">Private · JPEG, PNG, or WebP · 8 MB max</span>
          </label>
        </div>

        <label>
          Fit notes <span className="muted inlineMuted">optional</span>
          <textarea
            name="fit_notes"
            maxLength={1000}
            rows={5}
            placeholder="Roomy in the thighs, right at the waist..."
          />
        </label>

        <button className="primaryButton fullButton" type="submit">
          Add to my Closet →
        </button>
      </form>
    </main>
  );
}
