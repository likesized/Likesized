"use client";

import { useEffect, useState } from "react";
import styles from "@/app/closet/add/fitReport.module.css";

export function FitReportSuccessModal({ closetItemId, wasUpdated, underReview = false }: { closetItemId: string; wasUpdated: boolean; underReview?: boolean }) {
  const [open, setOpen] = useState(true);
  const [embedded, setEmbedded] = useState(false);

  function returnToOutfit() {
    window.parent.postMessage(
      { type: "likesized:outfit-garment-saved", closetItemId },
      window.location.origin,
    );
  }

  useEffect(() => {
    const isEmbedded = window.parent !== window;
    setEmbedded(isEmbedded);
    if (isEmbedded) {
      const timer = window.setTimeout(returnToOutfit, 25);
      return () => window.clearTimeout(timer);
    }
  }, [closetItemId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, embedded]);

  function closeModal() {
    if (embedded) {
      returnToOutfit();
      return;
    }
    window.history.replaceState(null, "", "/closet/add");
    setOpen(false);
  }

  function navigate(href: string) {
    window.location.assign(href);
  }

  if (!open) return null;

  if (embedded) {
    return <div className={styles.successOverlay} role="dialog" aria-modal="true" aria-labelledby="fit-report-success-title">
      <div className={styles.successCard}>
        <span className="eyebrow">GARMENT ADDED</span>
        <h2 id="fit-report-success-title">Returning to your Outfit…</h2>
        <p>Your Fit Report is saved and this garment will be added to the Outfit automatically.</p>
        <div className={styles.successActions}><button className="secondaryButton" type="button" onClick={returnToOutfit}>Back to Outfit</button></div>
      </div>
    </div>;
  }

  const eyebrow = underReview ? "FIT REPORT SAVED · ITEM UNDER REVIEW" : wasUpdated ? "FIT REPORT UPDATED" : "FIT REPORT ADDED";
  const title = underReview
    ? "Thanks! Your Fit Report has been saved."
    : wasUpdated
      ? "Your Fit Report has been updated."
      : "Thanks! Your Fit Report has been added.";
  const message = underReview
    ? "You can keep using this item in your Closet while LikeSized reviews the item details. It will not be treated as normal Product fit evidence until that review is resolved."
    : wasUpdated
      ? "We found an existing report for this same fit, so we added your latest details there instead of creating another one."
      : "You can view it in your Closet or start styling the item right now.";

  return <div className={styles.successOverlay} role="dialog" aria-modal="true" aria-labelledby="fit-report-success-title">
    <div className={styles.successCard}>
      <button className={styles.successClose} type="button" aria-label="Close Fit Report confirmation" onClick={closeModal}>×</button>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id="fit-report-success-title">{title}</h2>
      <p>{message}</p>
      <div className={styles.successActions}>
        <button className="secondaryButton" type="button" onClick={() => navigate("/closet")}>View it in My Closet</button>
        <button className="primaryButton" type="button" onClick={() => navigate(`/outfits/new?closet_item_id=${encodeURIComponent(closetItemId)}`)}>Style this item</button>
      </div>
    </div>
  </div>;
}
