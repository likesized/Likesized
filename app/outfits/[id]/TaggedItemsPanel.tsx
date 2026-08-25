"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { reportProductItem } from "@/app/item/[slug]/actions";
import { addToWishLocker, likeProduct, removeFromWishLocker, unlikeProduct } from "@/app/likelocker/actions";
import { SwipeDismissImageLightbox } from "@/components/SwipeDismissImageLightbox";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink, UniversalActionSummary } from "@/components/UniversalActionBar";
import quickStyles from "./TaggedItemsPanel.module.css";
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
type BestMatch={bodyMatch:number;sizeLabel:string;fitLabel:string};
type FitMeta={category:string;profileReady:boolean;matchingFitReports:number;strong:boolean;fitSnippet:string|null;bestMatch:BestMatch|null};

export default function TaggedItemsPanel({items,postId,signedIn}:{items:TaggedItem[];postId:string;signedIn:boolean}){
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [gateItem,setGateItem]=useState<TaggedItem|null>(null);
  const [imageOpen,setImageOpen]=useState(false);
  const [fitMeta,setFitMeta]=useState<Record<string,FitMeta>>({});
  const [liked,setLiked]=useState<Record<string,boolean>>(()=>Object.fromEntries(items.map((item)=>[item.productId,item.liked])));
  const [wished,setWished]=useState<Record<string,boolean>>(()=>Object.fromEntries(items.map((item)=>[item.productId,item.wished])));
  const [likePending,setLikePending]=useState<Record<string,boolean>>({});
  const [wishPending,setWishPending]=useState<Record<string,boolean>>({});
  const [actionError,setActionError]=useState("");
  const selected=items.find((item)=>item.closetItemId===selectedId)??null;
  const returnTo=`/outfits/${postId}?tab=tagged`;
  const productKey=useMemo(()=>[...new Set(items.map((item)=>item.productId))].sort().join(","),[items]);

  useEffect(()=>{
    if(!signedIn||!productKey)return;
    let active=true;
    void fetch(`/api/outfits/${postId}/tagged-fit?products=${encodeURIComponent(productKey)}`).then(async(response)=>{
      if(!response.ok)return;
      const payload=await response.json() as {items?:Record<string,FitMeta>};
      if(active&&payload.items)setFitMeta(payload.items);
    }).catch(()=>{});
    return()=>{active=false;};
  },[postId,productKey,signedIn]);

  useEffect(()=>{
    function openFromPhoto(event:Event){
      const closetItemId=(event as CustomEvent<{closetItemId?:string}>).detail?.closetItemId;
      if(!closetItemId)return;
      const item=items.find((entry)=>entry.closetItemId===closetItemId);
      if(!item)return;
      if(signedIn)setSelectedId(item.closetItemId);else setGateItem(item);
    }
    window.addEventListener("likesized:open-tagged-item",openFromPhoto);
    return()=>window.removeEventListener("likesized:open-tagged-item",openFromPhoto);
  },[items,signedIn]);

  function openItem(item:TaggedItem){
    if(!signedIn){setGateItem(item);return;}
    setSelectedId(item.closetItemId);
  }
  async function runLike(item:TaggedItem){
    if(likePending[item.productId])return;
    const next=!liked[item.productId];
    setActionError("");
    setLiked((current)=>({...current,[item.productId]:next}));
    setLikePending((current)=>({...current,[item.productId]:true}));
    const formData=new FormData();formData.set("product_id",item.productId);formData.set("return_to",returnTo);formData.set("stay_open","1");
    try{await (next?likeProduct:unlikeProduct)(formData);}
    catch{setLiked((current)=>({...current,[item.productId]:!next}));setActionError("LikeLocker could not update. Try again.");}
    finally{setLikePending((current)=>({...current,[item.productId]:false}));}
  }
  async function runWish(item:TaggedItem){
    if(wishPending[item.productId])return;
    const next=!wished[item.productId];
    setActionError("");
    setWished((current)=>({...current,[item.productId]:next}));
    setWishPending((current)=>({...current,[item.productId]:true}));
    const formData=new FormData();formData.set("product_id",item.productId);formData.set("return_to",returnTo);formData.set("stay_open","1");
    try{await (next?addToWishLocker:removeFromWishLocker)(formData);}
    catch{setWished((current)=>({...current,[item.productId]:!next}));setActionError("Wish Locker could not update. Try again.");}
    finally{setWishPending((current)=>({...current,[item.productId]:false}));}
  }
  async function share(item:TaggedItem){
    const url=new URL(item.href,window.location.origin).toString();
    try{if(navigator.share)await navigator.share({title:item.label,url});else await navigator.clipboard.writeText(url);}catch{/* cancelled */}
  }

  if(!items.length)return <p className="muted">No tagged items on this Outfit.</p>;
  const meta=selected?fitMeta[selected.productId]:null;
  return <div className={styles.taggedPanel}>
    <div className={styles.taggedGrid}>{items.map((item)=>{
      const itemMeta=fitMeta[item.productId];
      const fallbackCategory=item.detail.split("·")[0]?.trim()||"Garment";
      return <button className={styles.taggedCard} type="button" key={item.closetItemId} onClick={()=>openItem(item)}>
        {item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className={styles.taggedFallback}>{item.label.slice(0,1).toUpperCase()}</span>}
        <span><strong>{item.label}</strong><small>{itemMeta?.category||fallbackCategory}</small>{signedIn?<small>Matching Fit Reports: {itemMeta?itemMeta.matchingFitReports:"…"}</small>:<small>Sign in to see your fit matches</small>}</span>
      </button>;
    })}</div>

    {selected?<div className={styles.itemPreviewOverlay} role="dialog" aria-modal="true" aria-label={`${selected.label} preview`} onClick={()=>setSelectedId(null)}>
      <div className={styles.itemPreviewCard} onClick={(event)=>event.stopPropagation()}>
        <button className={styles.itemPreviewClose} type="button" aria-label="Close item preview" onClick={()=>setSelectedId(null)}>×</button>
        <div className={styles.itemPreviewTop}>
          {selected.imageUrl?<button className={quickStyles.garmentImageTrigger} type="button" aria-label="Open full-size garment photo" onClick={()=>setImageOpen(true)}><img className={styles.itemPreviewImage} src={selected.imageUrl} alt=""/></button>:<div className={styles.itemPreviewFallback}>{selected.label.slice(0,1).toUpperCase()}</div>}
          <div className={styles.itemPreviewInfo}><strong>{selected.label}</strong><span>{meta?.category||selected.detail.split("·")[0]?.trim()||"Garment"}</span>{meta?.profileReady?<span>Matching Fit Reports: {meta.matchingFitReports}</span>:<span>Complete your Fit Profile for personalized evidence.</span>}</div>
        </div>
        <div className={`${styles.fitSnippet} ${meta?.strong?styles.fitSnippetStrong:""}`}>
          {!meta?<><strong>Checking your fit evidence…</strong><span>Comparing this item with your Fit Profile and Closet history.</span></>:!meta.profileReady?<><strong>Build your Fit Profile to use FITuition.</strong><span>Your measurements stay private.</span></>:<>
            {meta.bestMatch?<span><b>{meta.bestMatch.bodyMatch}% Body Match</b> · Size {meta.bestMatch.sizeLabel} · {meta.bestMatch.fitLabel}</span>:null}
            {meta.fitSnippet?<strong>{meta.fitSnippet}</strong>:meta.matchingFitReports>0?<><strong>FITuition isn’t confident enough yet.</strong><span>We found {meta.matchingFitReports} relevant fit {meta.matchingFitReports===1?"match":"matches"}, but not enough strong evidence to recommend a size yet.</span></>:<><strong>FITuition needs more evidence.</strong><span>We don’t have enough relevant Fit Reports to recommend a size yet.</span></>}
          </>}
          <Link prefetch={false} className="textLink" href={selected.href}>See fit evidence →</Link>
        </div>
        {actionError?<small role="status" className="muted">{actionError}</small>:null}
        <UniversalActionBar className={styles.itemPreviewActions} ariaLabel="Item actions">
          <UniversalActionButton action="likeLocker" type="button" disabled={Boolean(likePending[selected.productId])} active={Boolean(liked[selected.productId])} onClick={()=>void runLike(selected)}/>
          <UniversalActionButton action="wishLocker" type="button" disabled={Boolean(wishPending[selected.productId])} active={Boolean(wished[selected.productId])} onClick={()=>void runWish(selected)}/>
          {selected.canShop?<UniversalActionLink action="shop" className={styles.previewActionLink} href={`/api/outfits/${postId}/shop?product_id=${selected.productId}`} target="_blank" rel="noopener noreferrer"/>:null}
          <UniversalActionButton action="share" type="button" onClick={()=>void share(selected)}/>
          <details className={styles.itemReport}><UniversalActionSummary action="report" ariaLabel="Report this item" title="Report"/><form action={reportProductItem}>
            <input type="hidden" name="product_id" value={selected.productId}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="stay_open" value="1"/>
            <label>Reason<select name="reason" defaultValue="" required><option value="" disabled>Select a reason</option><option value="inappropriate_content">Inappropriate content</option><option value="image_mismatch">Image mismatch</option><option value="incorrect_information">Incorrect information</option><option value="other">Other</option></select></label>
            <label>Details <span className="muted inlineMuted">optional</span><textarea name="details" maxLength={500} rows={2}/></label><button type="submit">Send report</button>
          </form></details>
        </UniversalActionBar>
        <Link prefetch={false} className={styles.fullDetailsLink} href={selected.href}>Full details →</Link>
      </div>
    </div>:null}

    {selected?.imageUrl&&imageOpen?<SwipeDismissImageLightbox src={selected.imageUrl} alt={selected.label} label="Full-size garment photo" onClose={()=>setImageOpen(false)}/>:null}

    {gateItem?<div className={styles.itemPreviewOverlay} role="dialog" aria-modal="true" aria-label="Sign in to see personalized fit" onClick={()=>setGateItem(null)}>
      <div className={styles.taggedAuthGate} onClick={(event)=>event.stopPropagation()}>
        <button className={styles.itemPreviewClose} type="button" aria-label="Close" onClick={()=>setGateItem(null)}>×</button>
        <span className="eyebrow">PERSONALIZED FIT</span>
        <strong>See how {gateItem.label} fits you.</strong>
        <p>Create an account or sign in to see Matching Fit Reports, Body Match, and FITuition for this item.</p>
        <div className={styles.taggedAuthActions}><Link prefetch={false} className="primaryButton" href="/signup">Create account</Link><Link prefetch={false} className="secondaryButton" href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in</Link></div>
      </div>
    </div>:null}
  </div>;
}
