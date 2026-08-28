"use client";

import { useEffect, useState } from "react";

export default function ItemLoading() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="pageShell" aria-busy="true">
      <section className="itemHero">
        <div className="productImage" aria-hidden="true" />
        <div className="itemDetails">
          <span className="eyebrow">GARMENT</span>
          <h1>Loading garment</h1>
          <div className="recommendation" role="status" aria-live="polite">
            <span>OUR FITUITION</span>
            <strong>Calculating your FITuition…</strong>
            <b>{slow ? "Taking a little longer than usual — still working." : "Using your current Fit Profile and the latest relevant Fit Reports."}</b>
          </div>
          <p className="muted">Your full personalized evidence is calculated only when you open the garment. LikeSized does not warm every garment’s full FITuition in the background.</p>
        </div>
      </section>
    </main>
  );
}
