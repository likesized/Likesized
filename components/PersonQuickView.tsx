"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CanonicalPersonQuickViewCard } from "@/components/CanonicalPersonQuickViewCard";
import { loadPersonQuickView, readPersonQuickView, warmPersonQuickView, type PersonQuickViewSummary } from "@/lib/person-quick-view-client";
import styles from "@/app/outfits/[id]/CreatorQuickView.module.css";

type Props={username:string;displayName?:string|null;avatarUrl?:string|null;children:ReactNode;inline?:boolean};

export function PersonQuickView({username,displayName,avatarUrl,children,inline=false}:Props){
  const triggerRef=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false);
  const [summary,setSummary]=useState<PersonQuickViewSummary|null>(()=>readPersonQuickView(username));
  const [loading,setLoading]=useState(false);
  const [returnTo,setReturnTo]=useState("/people");
  const name=summary?.displayName?.trim()||displayName?.trim()||username;
  const photo=summary?.avatarUrl??avatarUrl??null;
  const resolvedUsername=summary?.username??username;

  useEffect(()=>{
    setSummary(readPersonQuickView(username));
    const node=triggerRef.current;
    if(!node)return;
    const observer=new IntersectionObserver((entries)=>{
      if(entries.some((entry)=>entry.isIntersecting)){warmPersonQuickView(username);observer.disconnect();}
    },{rootMargin:"350px 0px"});
    observer.observe(node);
    return()=>observer.disconnect();
  },[username]);

  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    window.addEventListener("keydown",onKey);
    return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};
  },[open]);

  async function openQuickView(){
    setReturnTo(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    const cached=readPersonQuickView(username);
    if(cached)setSummary(cached);
    setOpen(true);
    if(cached||summary||loading)return;
    setLoading(true);
    try{const payload=await loadPersonQuickView(username);if(payload)setSummary(payload);}finally{setLoading(false);}
  }

  const triggerStyle={display:inline?"inline":"inline-block",margin:0,padding:0,border:0,background:"transparent",color:"inherit",font:"inherit",textAlign:"left" as const,cursor:"pointer"};
  return <>
    <button ref={triggerRef} type="button" style={triggerStyle} aria-label={`Quick view ${name}`} onPointerEnter={()=>warmPersonQuickView(username)} onPointerDown={()=>warmPersonQuickView(username)} onFocus={()=>warmPersonQuickView(username)} onClick={()=>void openQuickView()}>{children}</button>
    {open?<CanonicalPersonQuickViewCard
      displayName={name}
      username={resolvedUsername}
      avatarUrl={photo}
      userId={summary?.userId??null}
      signedIn={summary?.signedIn??false}
      owner={summary?.owner??false}
      following={summary?.following??false}
      notificationsOn={summary?.notificationsOn??false}
      overallMatch={summary?.overallMatch??null}
      topsMatch={summary?.topsMatch??null}
      bottomsMatch={summary?.bottomsMatch??null}
      garmentCount={summary?.totalGarments??null}
      outfitCount={summary?.totalOutfits??null}
      returnTo={returnTo}
      onClose={()=>setOpen(false)}
      loading={loading&&!summary}
      profileLink={<Link className={styles.fullProfile} href={`/people/${resolvedUsername}`} data-full-navigation="true">View Full Profile</Link>}
    />:null}
  </>;
}
