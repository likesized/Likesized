"use client";

import { useEffect, useState } from "react";
import styles from "./EntityQuickView.module.css";

type Kind="person"|"garment"|"outfit";
type Detail={label:string;value:string|number|null};
type ViewState={kind:Kind;key:string;href:string;title:string;subtitle:string|null;imageUrl:string|null;description:string|null;details:Detail[];loading:boolean};

function entityFrom(url:URL):{kind:Kind;key:string}|null{
  const parts=url.pathname.split("/").filter(Boolean);
  if(parts.length===2&&parts[0]==="people"&&parts[1])return{kind:"person",key:decodeURIComponent(parts[1])};
  if(parts.length===2&&parts[0]==="item"&&parts[1])return{kind:"garment",key:decodeURIComponent(parts[1])};
  if(parts.length===2&&parts[0]==="outfits"&&/^[0-9a-f-]{36}$/i.test(parts[1]))return{kind:"outfit",key:parts[1]};
  return null;
}

function explicitFullNavigation(anchor:HTMLAnchorElement){
  if(anchor.dataset.fullNavigation==="true")return true;
  const text=(anchor.textContent??"").replace(/\s+/g," ").trim();
  return /^(View Full Profile|View Garment|View Full Outfit)\b/i.test(text);
}

export function GlobalEntityQuickViewLayer(){
  const [view,setView]=useState<ViewState|null>(null);

  useEffect(()=>{
    function onClick(event:MouseEvent){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const target=event.target;
      if(!(target instanceof Element))return;
      const anchor=target.closest("a[href]");
      if(!(anchor instanceof HTMLAnchorElement)||anchor.target||anchor.hasAttribute("download")||explicitFullNavigation(anchor))return;
      const url=new URL(anchor.href,window.location.href);
      if(url.origin!==window.location.origin)return;
      const entity=entityFrom(url);
      if(!entity)return;
      event.preventDefault();
      const fallback=decodeURIComponent(entity.key).replaceAll("-"," ");
      setView({kind:entity.kind,key:entity.key,href:`${url.pathname}${url.search}${url.hash}`,title:fallback,subtitle:null,imageUrl:null,description:null,details:[],loading:true});
    }
    document.addEventListener("click",onClick,true);
    return()=>document.removeEventListener("click",onClick,true);
  },[]);

  useEffect(()=>{
    if(!view?.loading)return;
    let cancelled=false;
    async function load(){
      const endpoint=view.kind==="person"?`/api/people/${encodeURIComponent(view.key)}/quick-view`:view.kind==="garment"?`/api/items/${encodeURIComponent(view.key)}/quick-view`:`/api/outfits/${encodeURIComponent(view.key)}/quick-view`;
      try{
        const response=await fetch(endpoint,{cache:"no-store"});
        if(!response.ok)throw new Error();
        const payload=await response.json() as Record<string,unknown>;
        if(cancelled)return;
        if(view.kind==="person"){
          const name=(typeof payload.displayName==="string"&&payload.displayName.trim())||String(payload.username??view.key);
          const detail=(label:string,value:unknown):Detail=>({label,value:typeof value==="number"?value:value===null?null:String(value??"")});
          setView((current)=>current?{...current,title:name,subtitle:`@${String(payload.username??view.key)}`,imageUrl:typeof payload.avatarUrl==="string"?payload.avatarUrl:null,details:[detail("Overall Match",typeof payload.overallMatch==="number"?`${payload.overallMatch}%`:null),detail("Tops Match",typeof payload.topsMatch==="number"?`${payload.topsMatch}%`:null),detail("Bottoms Match",typeof payload.bottomsMatch==="number"?`${payload.bottomsMatch}%`:null),detail("Total Garments",payload.totalGarments),detail("Total Outfits",payload.totalOutfits)],loading:false}:current);
        }else{
          setView((current)=>current?{...current,title:typeof payload.title==="string"?payload.title:current.title,subtitle:typeof payload.subtitle==="string"?payload.subtitle:null,imageUrl:typeof payload.imageUrl==="string"?payload.imageUrl:null,description:typeof payload.description==="string"?payload.description:null,details:Array.isArray(payload.details)?payload.details as Detail[]:[],loading:false}:current);
        }
      }catch{
        if(!cancelled)setView((current)=>current?{...current,loading:false}:current);
      }
    }
    void load();
    return()=>{cancelled=true;};
  },[view?.kind,view?.key,view?.loading]);

  useEffect(()=>{
    if(!view)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setView(null);};
    window.addEventListener("keydown",onKey);
    return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};
  },[Boolean(view)]);

  if(!view)return null;
  const fallback=view.title.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"LS";
  const fullLabel=view.kind==="person"?"View Full Profile":view.kind==="garment"?"View Garment":"View Full Outfit";
  const visible=view.details.filter((detail)=>detail.value!==null&&detail.value!=="");

  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${view.title} quick view`} onClick={()=>setView(null)}>
    <section className={styles.card} onClick={(event)=>event.stopPropagation()}>
      <button className={styles.close} type="button" aria-label="Close quick view" onClick={()=>setView(null)}>×</button>
      <div className={styles.identity}>
        {view.imageUrl?<img className={`${styles.image}${view.kind==="person"?` ${styles.personImage}`:""}`} src={view.imageUrl} alt=""/>:<div className={`${styles.fallback}${view.kind==="person"?` ${styles.personFallback}`:""}`}>{fallback}</div>}
        <div><span className={styles.kicker}>{view.kind}</span><h2 className={styles.title}>{view.title}</h2>{view.subtitle?<span className={styles.subtitle}>{view.subtitle}</span>:null}</div>
      </div>
      {view.loading?<p className={styles.loading}>Loading details…</p>:null}
      {view.description?<p className={styles.description}>{view.description}</p>:null}
      {visible.length?<div className={styles.stats}>{visible.map((detail)=><div className={styles.stat} key={detail.label}><strong>{detail.value}</strong><span>{detail.label}</span></div>)}</div>:null}
      <a className={styles.full} href={view.href} data-full-navigation="true">{fullLabel}</a>
    </section>
  </div>;
}
