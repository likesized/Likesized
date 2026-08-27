"use client";

import { useState } from "react";
import { shareOutfit } from "@/lib/outfit-share-client";

export function StyleFeedShareButton({ postId, headline, className }: { postId: string; headline: string; className?: string }) {
  const [shared, setShared] = useState(false);

  async function share() {
    const ok = await shareOutfit(postId, headline);
    if (!ok) return;
    setShared(true);
    window.setTimeout(() => setShared(false), 1600);
  }

  return (
    <button className={className} type="button" onClick={() => void share()} aria-label={shared ? "Outfit shared" : "Share Outfit"}>
      {shared ? "Shared" : "Share"}
    </button>
  );
}
