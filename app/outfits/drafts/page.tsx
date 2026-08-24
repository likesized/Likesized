import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "../outfits.module.css";

type DraftRow = {
  id: string;
  headline: string | null;
  story: string | null;
  updated_at: string;
  created_at: string;
};

export default async function OutfitDraftsPage() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/outfits/drafts");

  const { data, error } = await supabase
    .from("outfit_posts")
    .select("id,headline,story,updated_at,created_at")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Could not load Outfit drafts: ${error.message}`);
  const drafts = (data ?? []) as DraftRow[];

  return <main className="pageShell">
    <div className={`pageTitle rowTitle ${styles.outfitsPageHeader}`}>
      <div><span className="eyebrow">OUTFIT DRAFTS</span><h1>Pick up where you left off.</h1><p>Drafts are only visible to you until you publish them.</p></div>
      <div className={styles.creatorHeaderActions}><Link className={styles.quietLink} href="/outfits">← Outfits</Link><Link className={styles.compactPrimary} href="/outfits/new">+ New Outfit</Link></div>
    </div>

    {drafts.length ? <div className={styles.draftWorkspaceGrid}>{drafts.map((draft) => <Link className={styles.draftWorkspaceCard} href={`/outfits/new?draft=${draft.id}`} key={draft.id}>
      <span className="eyebrow">DRAFT</span>
      <strong>{draft.headline?.trim() || "Untitled Outfit"}</strong>
      {draft.story?.trim() ? <p>{draft.story.trim().slice(0, 140)}{draft.story.trim().length > 140 ? "…" : ""}</p> : <p>No Outfit Story yet.</p>}
      <span>Updated {new Date(draft.updated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
    </Link>)}</div> : <div className="emptyState"><span className="eyebrow">NO DRAFTS</span><h2>You don’t have any Outfit drafts right now.</h2><Link className={styles.compactPrimary} href="/outfits/new">Create an Outfit</Link></div>}
  </main>;
}
