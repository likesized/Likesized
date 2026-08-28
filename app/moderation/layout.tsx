import Link from "next/link";
import type { ReactNode } from "react";

export default function ModerationLayout({ children }: { children: ReactNode }) {
  return <>
    <div className="pageShell">
      <nav aria-label="Admin catalog sections" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/moderation">Catalog + moderation</Link>
        <Link href="/moderation/product-images">Product images</Link>
      </nav>
    </div>
    {children}
  </>;
}
