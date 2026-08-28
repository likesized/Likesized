"use client";

import { useState } from "react";
import { addToWishLocker, likeProduct, removeFromWishLocker, unlikeProduct } from "@/app/likelocker/actions";
import { reportProductItem } from "./actions";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink, UniversalActionSummary } from "@/components/UniversalActionBar";
import styles from "./itemDetail.module.css";

export type RetailerListing = { id: string; name: string; url: string };

export default function ItemActionsClient({
  productId,
  productName,
  returnTo,
  initialLiked,
  initialWished,
  retailers,
}: {
  productId: string;
  productName: string;
  returnTo: string;
  initialLiked: boolean;
  initialWished: boolean;
  retailers: RetailerListing[];
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [wished, setWished] = useState(initialWished);
  const [likePending, setLikePending] = useState(false);
  const [wishPending, setWishPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reported, setReported] = useState(false);
  const [reportPending, setReportPending] = useState(false);

  async function toggleLike() {
    if (likePending) return;
    const next = !liked;
    setActionError("");
    setLiked(next);
    setLikePending(true);
    const data = new FormData();
    data.set("product_id", productId);
    data.set("return_to", returnTo);
    data.set("stay_open", "1");
    try {
      await (next ? likeProduct : unlikeProduct)(data);
    } catch {
      setLiked(!next);
      setActionError("LikeLocker could not update. Try again.");
    } finally {
      setLikePending(false);
    }
  }

  async function toggleWish() {
    if (wishPending) return;
    const next = !wished;
    setActionError("");
    setWished(next);
    setWishPending(true);
    const data = new FormData();
    data.set("product_id", productId);
    data.set("return_to", returnTo);
    data.set("stay_open", "1");
    try {
      await (next ? addToWishLocker : removeFromWishLocker)(data);
    } catch {
      setWished(!next);
      setActionError("Wishlist could not update. Try again.");
    } finally {
      setWishPending(false);
    }
  }

  async function share() {
    const url = new URL(returnTo, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: productName, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // Native share cancellation is not an error state.
    }
  }

  async function report(data: FormData) {
    if (reportPending) return;
    setReportPending(true);
    setActionError("");
    data.set("product_id", productId);
    data.set("return_to", returnTo);
    data.set("stay_open", "1");
    try {
      await reportProductItem(data);
      setReported(true);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Report could not be sent. Try again.");
    } finally {
      setReportPending(false);
    }
  }

  return <div className={styles.actionArea}>
    <UniversalActionBar className={styles.actionBar} ariaLabel="Garment actions">
      <UniversalActionButton action="likeLocker" active={liked} className={styles.actionButton} showLabel disabled={likePending} onClick={() => void toggleLike()} />
      <UniversalActionButton action="wishLocker" active={wished} className={styles.actionButton} showLabel disabled={wishPending} onClick={() => void toggleWish()} />
      {retailers.length === 1 ? <UniversalActionLink action="shop" href={retailers[0].url} className={styles.actionButton} showLabel target="_blank" rel="noopener noreferrer" /> : null}
      {retailers.length > 1 ? <details className={styles.actionMenu}><UniversalActionSummary action="shop" className={styles.actionButton} showLabel /><div className={styles.retailerMenu}>{retailers.map((retailer) => <a key={retailer.id} href={retailer.url} target="_blank" rel="noopener noreferrer">{retailer.name}</a>)}</div></details> : null}
      <UniversalActionButton action="share" className={styles.actionButton} showLabel onClick={() => void share()} />
      <details className={styles.actionMenu}>
        <UniversalActionSummary action="report" className={styles.actionButton} showLabel />
        <form className={styles.reportForm} action={report}>
          <label>What’s wrong?
            <select name="reason" defaultValue="" required>
              <option value="" disabled>Select a reason</option>
              <option value="inappropriate_content">Inappropriate content</option>
              <option value="image_mismatch">Image doesn’t match this product</option>
              <option value="incorrect_information">Incorrect product information</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label>Details <span>optional</span><textarea name="details" maxLength={500} rows={3} placeholder="Tell us what looks wrong." /></label>
          <button className="secondaryButton" type="submit" disabled={reportPending}>{reportPending ? "Sending…" : "Send report"}</button>
          {reported ? <span className={styles.success}>Report sent.</span> : null}
        </form>
      </details>
    </UniversalActionBar>
    {actionError ? <div className="authMessage error">{actionError}</div> : null}
  </div>;
}
