import type { ReactNode } from "react";
import CanonicalProductImageAdmin from "./CanonicalProductImageAdmin";

export default function ModerationLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <div className="pageShell">
      <CanonicalProductImageAdmin />
    </div>
  </>;
}
