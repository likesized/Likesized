"use client";

import { useEffect, useRef, useState } from "react";
import { StyleFeedGarmentsButton, type StyleFeedGarmentItem } from "./StyleFeedGarmentsButton";

const resolved=new Map<string,StyleFeedGarmentItem[]>();
const pending=new Map<string,Promise<StyleFeedGarmentItem[]>>();

function loadItems(postId:string){
  const cached=resolved.get(postId);if(cached)return Promise.resolve(cached);const inFlight=pending.get(postId);if(inFlight)return inFlight;
  const request=fetch(`/api/outfits/${postId}/tagged-items`,{cache:"no-store"}).then(async(response)=>{if(!response.ok)throw new Error("Tagged garments could not load.");const payload=await response.json() as {items?:StyleFeedGarmentItem[]};const items=Array.isArray(payload.items)?payload.items:[];resolved.set(postId,items);return items;}).finally(()=>pending.delete(postId));pending.set(postId,request);return request;
}

export default function StyleFeedGarments({postId}:{postId:string}){
  const hostRef=useRef<HTMLDivElement>(null);const [items,setItems]=useState<StyleFeedGarmentItem[]|null>(()=>resolved.get(postId)??null);const [failed,setFailed]=useState(false);
  useEffect(()=>{setItems(resolved.get(postId)??null);setFailed(false);const node=hostRef.current;if(!node)return;const observer=new IntersectionObserver((entries)=>{if(!entries.some((entry)=>entry.isIntersecting))return;observer.disconnect();void loadItems(postId).then(setItems).catch(()=>setFailed(true));},{rootMargin:"350px 0px"});observer.observe(node);return()=>observer.disconnect();},[postId]);
  function warm(){if(items===null&&!failed)void loadItems(postId).then(setItems).catch(()=>setFailed(true));}
  return <div ref={hostRef} onPointerEnter={warm} onPointerDown={warm} onFocusCapture={warm}>{items?.length?<StyleFeedGarmentsButton items={items} postId={postId}/>:failed?<button type="button" onClick={()=>{setFailed(false);void loadItems(postId).then(setItems).catch(()=>setFailed(true));}}>Retry garments</button>:null}</div>;
}
