"use client";

import { useEffect, useState } from "react";
import styles from "../outfits.module.css";

export default function OutfitEngagementClient({ postId, headline }: { postId: string; headline: string }) {
  const [shared, setShared] = useState(false);
  useEffect(() => {
    const key = `likesized-outfit-view:${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch(`/api/outfits/${postId}/view`, { method: "POST", keepalive: true });
  }, [postId]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: headline, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      void fetch(`/api/outfits/${postId}/share`, { method: "POST", keepalive: true });
    } catch { /* cancelled share */ }
  }

  return <button type="button" className={styles.shareButton} onClick={share}>{shared ? "Link copied ✓" : "Share"}</button>;
}
