"use client";

export async function shareOutfit(postId: string, headline: string) {
  const url = `${window.location.origin}/outfits/${postId}`;
  try {
    if (navigator.share) await navigator.share({ title: headline, url });
    else await navigator.clipboard.writeText(url);
    const response = await fetch(`/api/outfits/${postId}/share`, { method: "POST", keepalive: true });
    return response.ok;
  } catch {
    return false;
  }
}
