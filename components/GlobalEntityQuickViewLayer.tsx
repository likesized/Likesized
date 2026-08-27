"use client";

import { useEffect, useState } from "react";
import { CanonicalPersonQuickViewCard } from "@/components/CanonicalPersonQuickViewCard";
import { loadPersonQuickView, readPersonQuickView, warmPersonQuickView, type PersonQuickViewSummary } from "@/lib/person-quick-view-client";
import entityStyles from "./EntityQuickView.module.css";
import personStyles from "@/app/outfits/[id]/CreatorQuickView.module.css";

type Kind="person"|"garment"|"outfit";
type Detail={label:string;value:string|number|null};
type ViewState={kind:Kind;key:string;href:string;returnTo:string;title:string;subtitle:string|null;imageUrl:string|null;description:string|null;details:Detail[];loading:boolean;userId?:string|null;signedIn?:boolean;owner?:boolean;following?:boolean;notificationsOn?:boolean;overallMatch?:number|null;topsMatch?:number|null;bottomsMatch?:number|null;totalGarments?:number|null;totalOutfits?:number|null};

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
  return /^(View Full Profile|View Garment|View Detailed Garment Report|View Full Outfit)\b/i.test(text);
}

function personView(activeView:ViewState,payload:PersonQuickViewSummary):ViewState{
  const name=payload.displayName?.trim()||payload.username||activeView.key;
  return {...activeView,title:name,subtitle:`@${payload.username||activeView.key}`,imageUrl:payload.avatarUrl,userId:payload.userId,signedIn:payload.signedIn,owner:payload.owner,following:payload.following,notificationsOn:payload.notificationsOn,overallMatch:payload.overallMatch,topsMatch:payload.topsMatch,bottomsMatch:payload.bottomsMatch,totalGarments:payload.totalGarments,totalOutfits:payload.totalOutfits,loading:false};
}

function personKeyFromAnchor(anchor:HTMLAnchorElement){
  const url=new URL(anchor.href,window.location.href);
  if(url.origin!==window.location.origin)return null;
  const entity=entityFrom(url);
  return entity?.kind==="person"?entity.key:null;
}

export function GlobalEntityQuickViewLayer(){
  const [view,setView]=useState<ViewState|null>(null);

  useEffect(()=>{
    const observer=new IntersectionObserver((entries)=>{
      for(const entry of entries){
        if(!entry.isIntersecting||!(entry.target instanceof HTMLAnchorElement))continue;
        const username=personKeyFromAnchor(entry.target);
        if(username)warmPersonQuickView(username);
        observer.unobserve(entry.target);
      }
    },{rootMargin:"350px 0px"});

    function observePersonLinks(root:ParentNode){
      root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor)=>{if(personKeyFromAnchor(anchor))observer.observe(anchor);});
    }
    observePersonLinks(document);
    const mutations=new MutationObserver((records)=>{
      for(const record of records)for(const node of record.addedNodes)if(node instanceof Element){
        if(node instanceof HTMLAnchorElement&&personKeyFromAnchor(node))observer.observe(node);
        observePersonLinks(node);
      }
    });
    mutations.observe(document.body,{childList:true,subtree:true});

    function warmFromEvent(event:Event){
      const target=event.target;
      if(!(target instanceof Element))return;
      const anchor=target.closest("a[href]");
      if(!(anchor instanceof HTMLAnchorElement))return;
      const username=personKeyFromAnchor(anchor);
      if(username)warmPersonQuickView(username);
    }

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
      const base:ViewState={kind:entity.kind,key:entity.key,href:`${url.pathname}${url.search}${url.hash}`,returnTo:`${window.location.pathname}${window.location.search}${window.location.hash}`,title:fallback,subtitle:null,imageUrl:null,description:null,details:[],loading:true};
      if(entity.kind==="person"){
        const cached=readPersonQuickView(entity.key);
        setView(cached?personView(base,cached):base);
      }else setView(base);
    }
    document.addEventListener("pointerover",warmFromEvent,true);
    document.addEventListener("pointerdown",warmFromEvent,true);
    document.addEventListener("focusin",warmFromEvent,true);
    document.addEventListener("click",onClick,true);
    return()=>{
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("pointerover",warmFromEvent,true);
      document.removeEventListener("pointerdown",warmFromEvent,true);
      document.removeEventListener("focusin",warmFromEvent,true);
      document.removeEventListener("click",onClick,true);
    };
  },[]);

  useEffect(()=>{
    const active=view;if(!active?.loading)return;let cancelled=false;
    async function load(activeView:ViewState){
      try{
        if(activeView.kind==="person"){
          const payload=await loadPersonQuickView(activeView.key);
          if(cancelled)return;
          setView((current)=>current&&payload?personView(current,payload):current?{...current,loading:false}:current);
          return;
        }
        const endpoint=activeView.kind==="garment"?`/api/items/${encodeURIComponent(activeView.key)}/quick-view`:`/api/outfits/${encodeURIComponent(activeView.key)}/quick-view`;
        const response=await fetch(endpoint,{cache:"no-store"});if(!response.ok)throw new Error();const payload=await response.json() as Record<string,unknown>;if(cancelled)return;
        setView((current)=>current?{...current,title:typeof payload.title==="string"?payload.title:current.title,subtitle:typeof payload.subtitle==="string"?payload.subtitle:null,imageUrl:typeof payload.imageUrl==="string"?payload.imageUrl:null,description:typeof payload.description==="string"?payload.description:null,details:Array.isArray(payload.details)?payload.details as Detail[]:[],loading:false}:current);
      }catch{if(!cancelled)setView((current)=>current?{...current,loading:false}:current);}
    }
    void load(active);return()=>{cancelled=true;};
  },[view?.kind,view?.key,view?.loading]);

  useEffect(()=>{if(!view)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setView(null);};window.addEventListener("keydown",onKey);return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};},[Boolean(view)]);

  if(!view)return null;
  const fallback=view.title.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"LS";
  const fullLabel=view.kind==="person"?"View Full Profile":view.kind==="garment"?"View Detailed Garment Report":"View Full Outfit";
  const visible=view.details.filter((detail)=>detail.value!==null&&detail.value!=="");

  if(view.kind==="person"){
    return <CanonicalPersonQuickViewCard
      displayName={view.title}
      username={view.subtitle?.replace(/^@/,"")??view.key}
      avatarUrl={view.imageUrl}
      userId={view.userId??null}
      signedIn={view.signedIn??false}
      owner={view.owner??false}
      following={view.following??false}
      notificationsOn={view.notificationsOn??false}
      overallMatch={view.overallMatch??null}
      topsMatch={view.topsMatch??null}
      bottomsMatch={view.bottomsMatch??null}
      garmentCount={view.totalGarments??null}
      outfitCount={view.totalOutfits??null}
      returnTo={view.returnTo}
      onClose={()=>setView(null)}
      loading={view.loading}
      profileLink={<a className={personStyles.fullProfile} href={view.href} data-full-navigation="true">View Full Profile</a>}
    />;
  }

  return <div className={entityStyles.overlay} role="dialog" aria-modal="true" aria-label={`${view.title} quick view`} onClick={()=>setView(null)}><section className={entityStyles.card} onClick={(event)=>event.stopPropagation()}><button className={entityStyles.close} type="button" aria-label="Close quick view" onClick={()=>setView(null)}>×</button><div className={entityStyles.identity}>{view.imageUrl?<img className={entityStyles.image} src={view.imageUrl} alt=""/>:<div className={entityStyles.fallback}>{fallback}</div>}<div><span className={entityStyles.kicker}>{view.kind}</span><h2 className={entityStyles.title}>{view.title}</h2>{view.subtitle?<span className={entityStyles.subtitle}>{view.subtitle}</span>:null}</div></div>{view.loading?<p className={entityStyles.loading}>Loading details…</p>:null}{view.description?<p className={entityStyles.description}>{view.description}</p>:null}{visible.length?<div className={entityStyles.stats}>{visible.map((detail)=><div className={entityStyles.stat} key={detail.label}><strong>{detail.value}</strong><span>{detail.label}</span></div>)}</div>:null}<a className={entityStyles.full} href={view.href} data-full-navigation="true">{fullLabel}</a></section></div>;
}
