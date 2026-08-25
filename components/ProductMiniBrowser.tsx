"use client";

import type { ReactNode } from "react";
import { EntityQuickView } from "@/components/EntityQuickView";

export function ProductMiniBrowser({href,label,children}:{href:string;label:string;children:ReactNode}){
  const kind=href.includes("kind=outfit")||href.startsWith("/outfits/")?"outfit":"garment";
  return <EntityQuickView kind={kind} title={label} href={href} fullLabel={kind==="outfit"?"View Full Outfit":"View Garment"}>{children}</EntityQuickView>;
}
