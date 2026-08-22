"use client";

import { useEffect, useState } from "react";
import styles from "@/app/closet/add/fitReport.module.css";

export function FitReportSuccessModal({ closetItemId, wasUpdated }: { closetItemId: string; wasUpdated: boolean }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeModal() {
    window.history.replaceState(null, "", "/closet/add");
    setOpen(false);
  }

  function navigate(href: string) {
    window.location.assign(href);
  }

  if (!open) return null;

  return <div className={styles.successOverlay} role="dialog" aria-modal="true" aria-labelledby="fit-report-success-title">
    <div className={styles.successCard}>
      <button className={styles.successClose} type="button" aria-label="Close Fit Report confirmation" onClick={closeModal}>×</button>
      <span className="eyebrow">{wasUpdated ? "FIT REPORT UPDATED" : "FIT REPORT ADDED"}</span>
      <h2 id="fit-report-success-title">{wasUpdated ? "Thanks! Your existing Fit Report has been updated." : "Thanks! Your Fit Report has been added."}</h2>
      <p>{wasUpdated ? "This matched the same item, size, objective garment variant, and body profile, so LikeSized updated your existing report instead of counting a duplicate." : "You can view it in your Closet or start styling the item right now."}</p>
      <div className={styles.successActions}>
        <button className="secondaryButton" type="button" onClick={() => navigate("/closet")}>View it in My Closet</button>
        <button className="primaryButton" type="button" onClick={() => navigate(`/outfits/new?closet_item_id=${encodeURIComponent(closetItemId)}`)}>Style this item</button>
      </div>
    </div>
  </div>;
}
