import Link from "next/link";

export default function BrowsePage() {
  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">DISCOVER</span>
        <h1>Browse</h1>
        <p>Discover garments and outfits through LikeSized fit evidence.</p>
      </div>

      <div className="emptyState">
        <span className="eyebrow">BROWSE</span>
        <h2>Garment and outfit discovery lives here.</h2>
        <p>The full Garments / Outfits browse experience is the next product-surface build. Existing catalog search remains available while that surface is completed.</p>
        <Link className="secondaryButton" href="/search">Search the current catalog →</Link>
      </div>
    </main>
  );
}
