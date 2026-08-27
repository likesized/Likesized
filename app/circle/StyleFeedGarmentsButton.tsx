"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./StyleFeedGarmentsButton.module.css";

export type StyleFeedGarmentItem = {
  closetItemId: string;
  label: string;
  detail: string;
  href: string;
  imageUrl: string | null;
};

export function StyleFeedGarmentsButton({items}:{items:StyleFeedGarmentItem[]}){
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    window.addEventListener("keydown",onKey);
    return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};
  },[open]);

  if(!items.length)return null;

  return <>
    <button className={styles.trigger} type="button" onClick={()=>setOpen(true)}>View Garments →</button>
    {open?<div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Garments in this Outfit" onClick={()=>setOpen(false)}>
      <section className={styles.card} onClick={(event)=>event.stopPropagation()}>
        <header className={styles.header}><h2>Garments</h2><button className={styles.close} type="button" aria-label="Close garments" onClick={()=>setOpen(false)}>×</button></header>
        <div className={styles.list}>{items.map((item)=><Link className={styles.item} key={item.closetItemId} href={item.href} data-full-navigation="true" onClick={()=>setOpen(false)}>{item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className={styles.fallback}>{item.label.slice(0,1).toUpperCase()}</span>}<span className={styles.identity}><strong>{item.label}</strong><span>{item.detail}</span></span></Link>)}</div>
      </section>
    </div>:null}
  </>;
}
