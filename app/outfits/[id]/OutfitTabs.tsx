"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import styles from "../outfits.module.css";

export type OutfitTabKey="style"|"comments"|"tagged";

export default function OutfitTabs({initialTab="style",styleNotes,comments,taggedItems}:{initialTab?:OutfitTabKey;styleNotes:ReactNode;comments:ReactNode;taggedItems:ReactNode}){
  const [tab,setTab]=useState<OutfitTabKey>(initialTab);
  const options:[OutfitTabKey,string][]=[["style","Style Notes"],["comments","Comments"],["tagged","Tagged Items"]];
  return <section className={styles.outfitTabs}>
    <div className={styles.outfitTabBar} role="tablist" aria-label="Outfit details">
      {options.map(([key,label])=><button key={key} type="button" role="tab" aria-selected={tab===key} className={tab===key?styles.outfitTabActive:styles.outfitTabButton} onClick={()=>setTab(key)}>{label}</button>)}
    </div>
    <div className={styles.outfitTabPanel} role="tabpanel">
      {tab==="style"?styleNotes:tab==="comments"?comments:taggedItems}
    </div>
  </section>;
}
