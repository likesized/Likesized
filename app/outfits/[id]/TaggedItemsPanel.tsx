"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { reportProductItem } from "@/app/item/[slug]/actions";
import { addToWishLocker, likeProduct, removeFromWishLocker, unlikeProduct } from "@/app/likelocker/actions";
import styles from "./outfitDetail.module.css";

export type TaggedItem={
  closetItemId:string;
  productId:string;
  label:string;
  detail:string;
  href:string;
  imageUrl:string|null;
  liked:boolean;
  wished:boolean;
  canShop:boolean;
};
type FitMeta={category:string;matchingFitReports:number;strong:boolean;fitSnippet:string|null};

export default function TaggedItemsPanel({items,postId,signedIn}:{items:TaggedItem[];postId:string;signedIn:boolean}){
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [fitMeta,setFitMeta]=useState<Record<string,FitMeta>>({});
  const [liked,setLiked]=useState<Record<string,boolean>>(()=>Object.fromEntries(items.map((item)=>[item.productId,item.liked])));
  const [wished,setWished]=useState<Record<string,boolean>>(()=>Object.fromEntries(items.map((item)=>[item.productId,item.wished])));
  const [pending,startTransition]=useTransition();
  const selected=items.find((item)=>item.closetItemId===selectedId)??null;
  const returnTo=`/outfits/${postId}?tab=tagged`;
  const productKey=useMemo(()=>[...new Set(items.map((item)=>item.productId))].sort().join(","),[items]);

  useEffect(()=>{
    if(!productKey)return;
    let active=true;
    void fetch(`/api/outfits/${postId}/tagged-fit?products=${encodeURIComponent(productKey)}`).then(async(response)=>{
      if(!response.ok)return;
      const payload=await response.json() as {items?:Record<string,FitMeta>};
      if(active&&payload.items)setFitMeta(payload.items);
    }).catch(()=>{});
    return()=>{active=false;};
  },[postId,productKey]);

  function runLike(item:TaggedItem){
    const next=!liked[item.productId];
    setLiked((current)=>({...current,[item.productId]:next}));
    startTransition(async()=>{
      const formData=new FormData();formData.set("product_id",item.productId);formData.set("return_to",returnTo);formData.set("stay_open","1");
      try{await (next?likeProduct:unlikeProduct)(formData);}catch{setLiked((current)=>({...current,[item.productId]:!next}));}
    });
  }
  function runWish(item:TaggedItem){
    const next=!wished[item.productId];
    setWished((current)=>({...current,[item.productId]:next}));
    startTransition(async()=>{
      const formData=new FormData();formData.set("product_id",item.productId);formData.set("return_to",returnTo);formData.set("stay_open","1");
      try{await (next?addToWishLocker:removeFromWishLocker)(formData);}catch{setWished((current)=>({...current,[item.productId]:!next}));}
    });
  }
  async function share(item:TaggedItem){
    const url=new URL(item.href,window.location.origin).toString();
    try{if(navigator.share)await navigator.share({title:item.label,url});else await navigator.clipboard.writeText(url);}catch{/* cancelled */}
  }

  if(!items.length)return <p className="muted">No tagged items on this Outfit.</p>;
  return <div className={styles.taggedPanel}>
    <div className={styles.taggedGrid}>{items.map((item)=>{
      const meta=fitMeta[item.productId];
      const fallbackCategory=item.detail.split("·")[0]?.trim()||"Garment";
      return <button className={styles.taggedCard} type="button" key={item.closetItemId} onClick={()=>setSelectedId(item.closetItemId)}>
        {item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className={styles.taggedFallback}>{item.label.slice(0,1).toUpperCase()}</span>}
        <span><strong>{item.label}</strong><small>{meta?.category||fallbackCategory}</small><small>Matching Fit Reports: {meta?meta.matchingFitReports:"—"}</small></span>
      </button>;
    })}</div>
    {selected?<div className={styles.itemPreviewOverlay} role="dialog" aria-modal="true" aria-label={`${selected.label} preview`} onClick={()=>setSelectedId(null)}>
      <div className={styles.itemPreviewCard} onClick={(event)=>event.stopPropagation()}>
        <button className={styles.itemPreviewClose} type="button" aria-label="Close item preview" onClick={()=>setSelectedId(null)}>×</button>
        <div className={styles.itemPreviewTop}>
          {selected.imageUrl?<img className={styles.itemPreviewImage} src={selected.imageUrl} alt=""/>:<div className={styles.itemPreviewFallback}>{selected.label.slice(0,1).toUpperCase()}</div>}
          <div className={styles.itemPreviewInfo}><strong>{selected.label}</strong><span>{fitMeta[selected.productId]?.category||selected.detail.split("·")[0]?.trim()||"Garment"}</span><span>Matching Fit Reports: {fitMeta[selected.productId]?.matchingFitReports??"—"}</span></div>
        </div>
        <div className={`${styles.fitSnippet} ${fitMeta[selected.productId]?.strong?styles.fitSnippetStrong:""}`}>
          {fitMeta[selected.productId]?.strong&&fitMeta[selected.productId]?.fitSnippet?<strong>{fitMeta[selected.productId].fitSnippet}</strong>:<><strong>FITuition needs more useful evidence.</strong><span>We don’t have a strong personalized result for you yet.</span></>}
          <Link className="textLink" href={selected.href}>{fitMeta[selected.productId]?.strong?"See fit evidence →":"See the evidence we have →"}</Link>
        </div>
        {signedIn?<div className={styles.itemPreviewActions}>
          <button type="button" disabled={pending} aria-pressed={Boolean(liked[selected.productId])} onClick={()=>runLike(selected)}>{liked[selected.productId]?"♥ Liked":"♡ Like"}</button>
          <button type="button" disabled={pending} aria-pressed={Boolean(wished[selected.productId])} onClick={()=>runWish(selected)}>{wished[selected.productId]?"✓ Wish Locker":"+ Wish Locker"}</button>
          {selected.canShop?<Link className={styles.previewActionLink} href={`/api/outfits/${postId}/shop?product_id=${selected.productId}`} target="_blank" rel="noopener noreferrer">Shop</Link>:null}
          <button type="button" onClick={()=>void share(selected)}>Share</button>
          <details className={styles.itemReport}><summary>Report</summary><form action={reportProductItem}>
            <input type="hidden" name="product_id" value={selected.productId}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="stay_open" value="1"/>
            <label>Reason<select name="reason" defaultValue="incorrect_information"><option value="inappropriate_content">Inappropriate content</option><option value="image_mismatch">Image mismatch</option><option value="incorrect_information">Incorrect information</option><option value="other">Other</option></select></label>
            <label>Details <span className="muted inlineMuted">optional</span><textarea name="details" maxLength={500} rows={2}/></label><button type="submit">Send report</button>
          </form></details>
        </div>:<Link className={styles.compactSecondary} href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in for Like, Wish Locker, Shop, Share, and Report</Link>}
        <Link className={styles.fullDetailsLink} href={selected.href}>Full details →</Link>
      </div>
    </div>:null}
  </div>;
}
