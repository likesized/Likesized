"use client";

import { useState } from "react";

export function StyleFeedLikeButton({ postId, initialLiked, initialCount, className }: { postId: string; initialLiked: boolean; initialCount: number; className?: string }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !previousLiked;
    setLiked(nextLiked);
    setCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
    setPending(true);
    try {
      const response = await fetch(`/api/outfits/${postId}/like`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: nextLiked }),
      });
      const payload = await response.json() as { liked?: boolean; likeCount?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update Like.");
      setLiked(typeof payload.liked === "boolean" ? payload.liked : nextLiked);
      if (typeof payload.likeCount === "number") setCount(payload.likeCount);
    } catch {
      setLiked(previousLiked);
      setCount(previousCount);
    } finally {
      setPending(false);
    }
  }

  return <button className={className} type="button" aria-pressed={liked} disabled={pending} onClick={() => void toggle()}>{liked ? "♥" : "♡"} Like{count ? ` ${count}` : ""}</button>;
}
