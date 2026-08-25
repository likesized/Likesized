"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function TaggedItemsPanel({items,postId,signedIn}:{items:TaggedItem[];postId:string;signedIn:boolean}){
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=items.find((item)=>item.closetItemId===selectedId)??null;
  const returnTo=`/outfits/${postId}?tab=tagged`;
  if(!items.length)return <p className="muted">No tagged items on this Outfit.</p>;
  return <div className={styles.taggedPanel}>
    <div className={styles.taggedGrid}>{items.map((item)=><button className={styles.taggedCard} type="button" key={item.closetItemId} onClick={()=>setSelectedId(item.closetItemId)}>
      {item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className={styles.taggedFallback}>{item.label.slice(0,1).toUpperCase()}</span>}
      <span><strong>{item.label}</strong><small>{item.detail}</small></span>
    </button>)}</div>
    {selected?<div className={styles.itemPreviewOverlay} role="dialog" aria-modal="true" aria-label={`${selected.label} preview`} onClick={()=>setSelectedId(null)}>
      <div className={styles.itemPreviewCard} onClick={(event)=>event.stopPropagation()}>
        <button className={styles.itemPreviewClose} type="button" aria-label="Close item preview" onClick={()=>setSelectedId(null)}>×</button>
        {selected.imageUrl?<img className={styles.itemPreviewImage} src={selected.imageUrl} alt=""/>:<div className={styles.itemPreviewFallback}>{selected.label.slice(0,1).toUpperCase()}</div>}
        <div className={styles.itemPreviewInfo}><strong>{selected.label}</strong><span>{selected.detail}</span><Link className="textLink" href={selected.href}>Full details →</Link></div>
        {signedIn?<div className={styles.itemPreviewActions}>
          <form action={selected.liked?unlikeProduct:likeProduct}><input type="hidden" name="product_id" value={selected.productId}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-label={selected.liked?"Unlike item":"Like item"} title={selected.liked?"Unlike item":"Like item"}>{selected.liked?"♥":"♡"}</button></form>
          <form action={selected.wished?removeFromWishLocker:addToWishLocker}><input type="hidden" name="product_id" value={selected.productId}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit">{selected.wished?"✓ Wish Locker":"+ Wish Locker"}</button></form>
          {selected.canShop?<Link className={styles.cartAction} href={`/api/outfits/${postId}/shop?product_id=${selected.productId}`} aria-label="Open shopping link" title="Open shopping link">🛒</Link>:null}
        </div>:<Link className={styles.compactSecondary} href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in for Like / Wish Locker / shopping</Link>}
      </div>
    </div>:null}
  </div>;
}
