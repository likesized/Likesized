"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { OUTFIT_OCCASIONS } from "@/lib/outfit-taxonomy";
import styles from "./outfitDetail.module.css";
import tabStyles from "./OutfitTabs.module.css";

export type OutfitTabKey="style"|"comments"|"tagged";
const OCCASION_BY_LABEL:ReadonlyMap<string,string>=new Map(OUTFIT_OCCASIONS.map((item)=>[item.label,item.value]));
function normalizedStyle(value:string){return value.replace(/^#+/,"").toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,30);}

export default function OutfitTabs({initialTab="style",styleNotes,comments,taggedItems,commentCount=0}:{initialTab?:OutfitTabKey;styleNotes:ReactNode;comments:ReactNode;taggedItems:ReactNode;commentCount?:number}){
  const [tab,setTab]=useState<OutfitTabKey>(initialTab);
  const styleRef=useRef<HTMLDivElement>(null);
  const options:[OutfitTabKey,string][]=[["style","Style Notes"],["comments",`Comments · ${commentCount}`],["tagged","Tagged Items"]];

  useEffect(()=>{
    const root=styleRef.current;
    if(!root||tab!=="style")return;
    const links=[...root.querySelectorAll("span")].filter((span)=>{
      const text=span.textContent?.trim()??"";
      return Boolean(text.startsWith("#")?normalizedStyle(text):OCCASION_BY_LABEL.get(text));
    });
    for(const span of links){span.setAttribute("role","link");span.setAttribute("tabindex","0");span.setAttribute("aria-label",`Explore ${span.textContent?.trim()??"tag"}`);}
    return()=>{for(const span of links){span.removeAttribute("role");span.removeAttribute("tabindex");span.removeAttribute("aria-label");}};
  },[styleNotes,tab]);

  function openExplore(target:EventTarget|null){
    if(!(target instanceof Element))return;
    const span=target.closest("span[role='link']");
    if(!(span instanceof HTMLSpanElement)||!styleRef.current?.contains(span))return;
    const text=span.textContent?.trim()??"";
    const params=new URLSearchParams({view:"outfits",scope:"all"});
    if(text.startsWith("#")){const style=normalizedStyle(text);if(!style)return;params.set("style",style);}else{const occasion=OCCASION_BY_LABEL.get(text);if(!occasion)return;params.set("occasion",occasion);}
    window.location.assign(`/explore?${params.toString()}`);
  }

  return <section className={styles.outfitTabs}>
    <div className={styles.outfitTabBar} role="tablist" aria-label="Outfit details">
      {options.map(([key,label])=><button key={key} type="button" role="tab" aria-selected={tab===key} className={tab===key?styles.outfitTabActive:styles.outfitTabButton} onClick={()=>setTab(key)}>{label}</button>)}
    </div>
    <div className={styles.outfitTabPanel} role="tabpanel">
      {tab==="style"?<div ref={styleRef} className={tabStyles.styleExploreHost} onClick={(event)=>openExplore(event.target)} onKeyDown={(event)=>{if((event.key==="Enter"||event.key===" ")&&(event.target instanceof HTMLSpanElement)){event.preventDefault();openExplore(event.target);}}}>{styleNotes}</div>:null}
      {tab==="comments"?comments:null}
      <div className={tab==="tagged"?styles.taggedTabHost:`${styles.taggedTabHost} ${styles.taggedTabDormant}`}>{taggedItems}</div>
    </div>
  </section>;
}
