"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { reportProductItem } from "@/app/item/[slug]/actions";
import { addToWishLocker, likeProduct, removeFromWishLocker, unlikeProduct } from "@/app/likelocker/actions";
import { SwipeDismissImageLightbox } from "@/components/SwipeDismissImageLightbox";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink, UniversalActionSummary } from "@/components/UniversalActionBar";
import quickStyles from "./TaggedItemsPanel.module.css";
import styles from "./outfitDetail.module.css";

export type TaggedItem={closetItemId:string;productId:string;label:string;detail:string;href:string;imageUrl:string|null;liked:boolean;wished:boolean;canShop:boolean};
type RelevantReport={fitReportId:string;bodyMatch:number|null;sizeLabel:string;fitLabel:string;isOwn:boolean};
type StrongFitReport={sizeLabel:string;count:number;fitBreakdown:{fit:string;fitLabel:string;count:number;percent:number}[]};
type SourceBreakdown={communityBlend:number;closetBlend:number;communityTopSizeLabel:string|null;closetTopSizeLabel:string|null;sourcesAgree:boolean|null};
type Recommendation={sizeLabel:string;confidence:number;confidenceLabel:string;similarWearerCount:number;sizeEvidenceCount:number;sourceBreakdown:SourceBreakdown};
type FitMeta={category:string;variationDetail:string;profileReady:boolean;matchingFitReports:number;objectiveVariantKey:string;recommendation:Recommendation|null;relevantReports:RelevantReport[];strongFitReports:StrongFitReport[];closetEvidenceCount:number};

export default function TaggedItemsPanel({items,postId,signedIn}:{items:TaggedItem[];postId:string;signedIn:boolean}){
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [gateItem,setGateItem]=useState<TaggedItem|null>(null);
  const [imageOpen,setImageOpen]=useState(false);
  const [evidenceOpen,setEvidenceOpen]=useState(false);
  const [fitMeta,setFitMeta]=useState<Record<string,FitMeta>>({});
  const [fitLoading,setFitLoading]=useState<Record<string,boolean>>({});
  const [fitErrors,setFitErrors]=useState<Record<string,string>>({});
  const loadedFitMeta=useRef(new Set<string>());
  const loadingFitMeta=useRef(new Set<string>());
  const [liked,setLiked]=useState<Record<string,boolean>>(()=>Object.fromEntries(items.map((item)=>[item.productId,item.liked])));
  const [wished,setWished]=useState<Record<string,boolean>>(()=>Object.fromEntries(items.map((item)=>[item.productId,item.wished])));
  const [likePending,setLikePending]=useState<Record<string,boolean>>({});
  const [wishPending,setWishPending]=useState<Record<string,boolean>>({});
  const [actionError,setActionError]=useState("");
  const [watching,setWatching]=useState<Record<string,boolean>>({});
  const [watchPending,setWatchPending]=useState<Record<string,boolean>>({});
  const selected=items.find((item)=>item.closetItemId===selectedId)??null;
  const returnTo=`/outfits/${postId}?tab=tagged`;

  const loadFitMeta=useCallback(async(closetItemId:string,signal?:AbortSignal,force=false)=>{
    if(!signedIn)return;
    if(force){loadedFitMeta.current.delete(closetItemId);setFitMeta((current)=>{const next={...current};delete next[closetItemId];return next;});}
    if(loadedFitMeta.current.has(closetItemId)||loadingFitMeta.current.has(closetItemId))return;
    loadingFitMeta.current.add(closetItemId);
    setFitLoading((current)=>({...current,[closetItemId]:true}));
    setFitErrors((current)=>{const next={...current};delete next[closetItemId];return next;});
    try{
      const response=await fetch(`/api/outfits/${postId}/tagged-fit?closet_item_id=${encodeURIComponent(closetItemId)}`,{cache:"no-store",signal});
      if(!response.ok){const payload=await response.json().catch(()=>null) as {error?:string}|null;throw new Error(payload?.error||"FITuition evidence could not load.");}
      const payload=await response.json() as FitMeta;
      if(signal?.aborted)return;
      loadedFitMeta.current.add(closetItemId);
      setFitMeta((current)=>({...current,[closetItemId]:payload}));
    }catch(error:unknown){
      if(signal?.aborted)return;
      setFitErrors((current)=>({...current,[closetItemId]:error instanceof Error?error.message:"FITuition evidence could not load."}));
    }finally{
      loadingFitMeta.current.delete(closetItemId);
      if(!signal?.aborted)setFitLoading((current)=>({...current,[closetItemId]:false}));
    }
  },[postId,signedIn]);

  useEffect(()=>{
    if(!signedIn||!items.length)return;
    const controllers=items.map(()=>new AbortController());
    items.forEach((item,index)=>{void loadFitMeta(item.closetItemId,controllers[index].signal);});
    return()=>controllers.forEach((controller)=>controller.abort());
  },[items,signedIn,loadFitMeta]);

  useEffect(()=>{
    if(!selectedId||!signedIn)return;
    const controller=new AbortController();
    void fetch(`/api/outfits/${postId}/tagged-fit/watch?closet_item_id=${encodeURIComponent(selectedId)}`,{cache:"no-store",signal:controller.signal})
      .then(async(response)=>response.ok?response.json() as Promise<{watching?:boolean}>:null)
      .then((payload)=>{if(!payload||controller.signal.aborted)return;setWatching((current)=>({...current,[selectedId]:Boolean(payload.watching)||Boolean(current[selectedId])}));})
      .catch(()=>{/* notification status is non-blocking */});
    return()=>controller.abort();
  },[selectedId,signedIn,postId]);

  useEffect(()=>{function openFromPhoto(event:Event){const closetItemId=(event as CustomEvent<{closetItemId?:string}>).detail?.closetItemId;if(!closetItemId)return;const item=items.find((entry)=>entry.closetItemId===closetItemId);if(!item)return;if(signedIn){setEvidenceOpen(false);setSelectedId(item.closetItemId);}else setGateItem(item);}window.addEventListener("likesized:open-tagged-item",openFromPhoto);return()=>window.removeEventListener("likesized:open-tagged-item",openFromPhoto);},[items,signedIn]);

  function openItem(item:TaggedItem){if(!signedIn){setGateItem(item);return;}setEvidenceOpen(false);setActionError("");setSelectedId(item.closetItemId);}
  function retryFit(item:TaggedItem){void loadFitMeta(item.closetItemId,undefined,true);}
  async function runLike(item:TaggedItem){if(likePending[item.productId])return;const next=!liked[item.productId];setActionError("");setLiked((current)=>({...current,[item.productId]:next}));setLikePending((current)=>({...current,[item.productId]:true}));const formData=new FormData();formData.set("product_id",item.productId);formData.set("return_to",returnTo);formData.set("stay_open","1");try{await(next?likeProduct:unlikeProduct)(formData);}catch{setLiked((current)=>({...current,[item.productId]:!next}));setActionError("LikeLocker could not update. Try again.");}finally{setLikePending((current)=>({...current,[item.productId]:false}));}}
  async function runWish(item:TaggedItem){if(wishPending[item.productId])return;const next=!wished[item.productId];setActionError("");setWished((current)=>({...current,[item.productId]:next}));setWishPending((current)=>({...current,[item.productId]:true}));const formData=new FormData();formData.set("product_id",item.productId);formData.set("return_to",returnTo);formData.set("stay_open","1");try{await(next?addToWishLocker:removeFromWishLocker)(formData);}catch{setWished((current)=>({...current,[item.productId]:!next}));setActionError("Wishlist could not update. Try again.");}finally{setWishPending((current)=>({...current,[item.productId]:false}));}}
  async function share(item:TaggedItem){const url=new URL(item.href,window.location.origin).toString();try{if(navigator.share)await navigator.share({title:item.label,url});else await navigator.clipboard.writeText(url);}catch{/* cancelled */}}
  async function requestWatch(item:TaggedItem){if(watchPending[item.closetItemId]||watching[item.closetItemId])return;setActionError("");setWatchPending((current)=>({...current,[item.closetItemId]:true}));try{const response=await fetch(`/api/outfits/${postId}/tagged-fit/watch`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({closetItemId:item.closetItemId})});if(!response.ok)throw new Error();setWatching((current)=>({...current,[item.closetItemId]:true}));}catch{setActionError("Notification request could not be saved. Try again.");}finally{setWatchPending((current)=>({...current,[item.closetItemId]:false}));}}
  function renderWatchPrompt(item:TaggedItem){return <div className={quickStyles.notifyPrompt}>{watching[item.closetItemId]?<span className={quickStyles.watchState}>Notifications on</span>:<button className={quickStyles.notifyAction} type="button" disabled={Boolean(watchPending[item.closetItemId])} onClick={()=>void requestWatch(item)}><span aria-hidden="true">🔔</span>{watchPending[item.closetItemId]?"Saving…":"Notify me"}</button>}<span>FITuition will notify you when people close to your size post a Fit Report for this item.</span></div>;}

  if(!items.length)return <p className="muted">No tagged items on this Outfit.</p>;
  const meta=selected?fitMeta[selected.closetItemId]:null;
  const isLoading=selected?Boolean(fitLoading[selected.closetItemId]):false;
  const fitError=selected?fitErrors[selected.closetItemId]:null;
  const sortedRelevantReports=meta?.relevantReports.length?[...meta.relevantReports].sort((a,b)=>(b.bodyMatch??-1)-(a.bodyMatch??-1)||Number(b.isOwn)-Number(a.isOwn)):[];
  const bestRelevantReport=sortedRelevantReports[0]??null;
  const additionalRelevantReports=sortedRelevantReports.slice(1);
  const showRecommendation=Boolean(meta?.recommendation&&meta.matchingFitReports>0);

  function renderRelevantReport(report:RelevantReport,bestAvailable=false){return <div className={styles.relevantReport} key={report.fitReportId}><div>{report.bodyMatch===null?<strong>Your Fit Report</strong>:bestAvailable?<><strong>Best Available Matching Fit Report</strong><span>{report.bodyMatch}% Body Match</span></>:<><strong>{report.bodyMatch}%</strong><span>Body Match</span></>}</div><div><span>Size</span><strong>{report.sizeLabel}</strong></div><div><span>Fit Result</span><strong>{report.fitLabel}</strong></div></div>;}

  return <div className={styles.taggedPanel}>
    <div className={styles.taggedGrid}>{items.map((item)=>{const cachedMeta=fitMeta[item.closetItemId];const cardLoading=Boolean(fitLoading[item.closetItemId]);const cardError=fitErrors[item.closetItemId];return <button className={styles.taggedCard} type="button" key={item.closetItemId} onClick={()=>openItem(item)}>{item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className={styles.taggedFallback}>{item.label.slice(0,1).toUpperCase()}</span>}<span><strong>{item.label}</strong><small>{item.detail}</small>{signedIn?(cardLoading?<small>Relevant Fit Reports: Checking…</small>:cardError?<small>Relevant Fit Reports: unavailable</small>:cachedMeta?.profileReady?<small>Relevant Fit Reports: {cachedMeta.matchingFitReports}</small>:cachedMeta?<small>Complete your Fit Profile for personalized evidence.</small>:null):null}</span></button>;})}</div>

    {selected?<div className={styles.itemPreviewOverlay} role="dialog" aria-modal="true" aria-label={`${selected.label} quick view`} onClick={()=>setSelectedId(null)}><div className={styles.itemPreviewCard} onClick={(event)=>event.stopPropagation()}>
      <button className={styles.itemPreviewClose} type="button" aria-label="Close item preview" onClick={()=>setSelectedId(null)}>×</button>
      {evidenceOpen&&meta?<>
        <button className={styles.previewBack} type="button" onClick={()=>setEvidenceOpen(false)}>← Back</button>
        {showRecommendation&&meta.recommendation?<>
          {meta.strongFitReports.length?<div className={styles.relevantReportList}>{meta.strongFitReports.flatMap((group)=>group.fitBreakdown.filter((fit)=>fit.count>0).map((fit)=><div className={styles.relevantReport} key={`${group.sizeLabel}:${fit.fit}`}><div><strong>{fit.count}</strong><span>report{fit.count===1?"":"s"}</span></div><div><span>Size</span><strong>{group.sizeLabel}</strong></div><div><span>Fit Result</span><strong>{fit.fitLabel}</strong></div></div>))}</div>:bestRelevantReport?<div className={styles.relevantReportList}>{renderRelevantReport(bestRelevantReport,true)}</div>:null}
        </>:bestRelevantReport?<>
          <div className={styles.relevantReportList}>{renderRelevantReport(bestRelevantReport,true)}</div>
          {additionalRelevantReports.length?<details className={quickStyles.evidenceSection}><summary className={styles.evidenceLink}>View more Relevant Fit Reports →</summary><div className={styles.relevantReportList}>{additionalRelevantReports.map((report)=>renderRelevantReport(report))}</div></details>:null}
        </>:null}
        <Link prefetch={false} className={quickStyles.fullEvidenceLink} href={selected.href} data-full-navigation="true">View Garment Detail →</Link>
      </>:<>
        <div className={styles.itemPreviewTop}>{selected.imageUrl?<button className={quickStyles.garmentImageTrigger} type="button" aria-label="Open full-size garment photo" onClick={()=>setImageOpen(true)}><img className={styles.itemPreviewImage} src={selected.imageUrl} alt=""/></button>:<div className={styles.itemPreviewFallback}>{selected.label.slice(0,1).toUpperCase()}</div>}<div className={styles.itemPreviewInfo}><strong>{selected.label}</strong><span>{meta?.category||selected.detail}</span>{meta?.variationDetail?<span className={quickStyles.variationDetail}>{meta.variationDetail}</span>:null}<span>{isLoading?"Relevant Fit Reports: Checking…":fitError?"Relevant Fit Reports: unavailable":meta?.profileReady?`Relevant Fit Reports: ${meta.matchingFitReports}`:"Complete your Fit Profile for personalized evidence."}</span></div></div>
        <section className={styles.fituitionCard} aria-label="FITuition">
          <span className={styles.fituitionKicker}>FITuition</span>
          {isLoading?<><strong className={styles.fituitionHeadline}>Checking your fit evidence…</strong><p>Comparing Size Match evidence with your Fit Profile and Closet history.</p></>:fitError||!meta?<><strong className={styles.fituitionHeadline}>FITuition couldn’t load this evidence.</strong><p>{fitError||"The evidence request did not finish."}</p><button className={styles.notifyLink} type="button" onClick={()=>retryFit(selected)}>Try again</button></>:!meta.profileReady?<><strong className={styles.fituitionHeadline}>Build your Fit Profile to use FITuition.</strong><p>Your measurements stay private.</p></>:showRecommendation&&meta.recommendation?<><strong className={styles.fituitionHeadline}>Our FITuition suggests: {meta.recommendation.sizeLabel}</strong><div className={styles.recommendationRow}><span className={styles.confidenceBadge}>Confidence: {meta.recommendation.confidenceLabel}</span></div>{meta.recommendation.sourceBreakdown.sourcesAgree===false?<p><strong>Mixed evidence.</strong> Size Match evidence leans {meta.recommendation.sourceBreakdown.communityTopSizeLabel??"another way"}, while your Closet History leans {meta.recommendation.sourceBreakdown.closetTopSizeLabel??"another way"}.</p>:meta.closetEvidenceCount>0?<p>Relevant Fit Reports and your Closet History point most strongly to this size.</p>:<p>Relevant Fit Reports point most strongly to this size.</p>}<button className={styles.evidenceLink} type="button" onClick={()=>setEvidenceOpen(true)}>See FITuition Details →</button></>:meta.matchingFitReports>0?<><strong className={styles.fituitionHeadline}>Not enough fit data to confidently recommend a size.</strong><p>Relevant Fit Reports: {meta.matchingFitReports}</p><button className={styles.evidenceLink} type="button" onClick={()=>setEvidenceOpen(true)}>See FITuition Details →</button></>:<><strong className={styles.fituitionHeadline}>Not enough fit data to confidently recommend a size.</strong>{renderWatchPrompt(selected)}</>}
        </section>
        <UniversalActionBar className={styles.itemPreviewActions} ariaLabel="Garment actions"><UniversalActionButton action="likeLocker" type="button" showLabel disabled={Boolean(likePending[selected.productId])} active={Boolean(liked[selected.productId])} onClick={()=>void runLike(selected)}/><UniversalActionButton action="wishLocker" type="button" showLabel disabled={Boolean(wishPending[selected.productId])} active={Boolean(wished[selected.productId])} onClick={()=>void runWish(selected)}/>{selected.canShop?<UniversalActionLink action="shop" showLabel className={styles.previewActionLink} href={`/api/outfits/${postId}/shop?product_id=${selected.productId}`} target="_blank" rel="noopener noreferrer"/>:null}<UniversalActionButton action="share" showLabel type="button" onClick={()=>void share(selected)}/><details className={styles.itemReport}><UniversalActionSummary action="report" showLabel ariaLabel="Report this garment" title="Report"/><form action={reportProductItem}><input type="hidden" name="product_id" value={selected.productId}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="stay_open" value="1"/><label>Reason<select name="reason" defaultValue="" required><option value="" disabled>Select a reason</option><option value="inappropriate_content">Inappropriate content</option><option value="image_mismatch">Image mismatch</option><option value="incorrect_information">Incorrect information</option><option value="other">Other</option></select></label><label>Details <span className="muted inlineMuted">optional</span><textarea name="details" maxLength={500} rows={2}/></label><button type="submit">Send report</button></form></details></UniversalActionBar>
        <Link prefetch={false} className={quickStyles.fullEvidenceLink} href={selected.href} data-full-navigation="true">View Garment Detail →</Link>
      </>}
      {actionError?<small role="status" className={styles.previewError}>{actionError}</small>:null}
    </div></div>:null}
    {selected?.imageUrl&&imageOpen?<SwipeDismissImageLightbox src={selected.imageUrl} alt={selected.label} label="Full-size garment photo" onClose={()=>setImageOpen(false)}/>:null}
    {gateItem?<div className={styles.itemPreviewOverlay} role="dialog" aria-modal="true" aria-label="Sign in to see personalized fit" onClick={()=>setGateItem(null)}><div className={styles.taggedAuthGate} onClick={(event)=>event.stopPropagation()}><button className={styles.itemPreviewClose} type="button" aria-label="Close" onClick={()=>setGateItem(null)}>×</button><span className="eyebrow">PERSONALIZED FIT</span><strong>See how {gateItem.label} fits you.</strong><p>Create an account or sign in to see Matching Fit Reports, Body Match, and FITuition for this garment.</p><div className={styles.taggedAuthActions}><Link prefetch={false} className="primaryButton" href="/signup">Create account</Link><Link prefetch={false} className="secondaryButton" href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in</Link></div></div></div>:null}
  </div>;
}