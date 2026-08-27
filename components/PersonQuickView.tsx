"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CanonicalPersonQuickViewCard } from "@/components/CanonicalPersonQuickViewCard";
import styles from "@/app/outfits/[id]/CreatorQuickView.module.css";

type Summary={userId:string|null;username:string;displayName:string|null;avatarUrl:string|null;signedIn:boolean;owner:boolean;following:boolean;notificationsOn:boolean;overallMatch:number|null;topsMatch:number|null;bottomsMatch:number|null;totalGarments:number|null;totalOutfits:number|null};
type Props={username:string;displayName?:string|null;avatarUrl?:string|null;children:ReactNode;inline?:boolean};

export function PersonQuickView({username,displayName,avatarUrl,children,inline=false}:Props){
  const [open,setOpen]=useState(false);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [loading,setLoading]=useState(false);
  const [returnTo,setReturnTo]=useState("/people");
  const name=summary?.displayName?.trim()||displayName?.trim()||username;
  const photo=summary?.avatarUrl??avatarUrl??null;
  const resolvedUsername=summary?.username??username;

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
    setOpen(true);
    if(summary||loading)return;
    setLoading(true);
    try{const response=await fetch(`/api/people/${encodeURIComponent(username)}/quick-view`,{cache:"no-store"});if(response.ok)setSummary(await response.json() as Summary);}finally{setLoading(false);}
  }

  const triggerStyle={display:inline?"inline":"inline-block",margin:0,padding:0,border:0,background:"transparent",color:"inherit",font:"inherit",textAlign:"left" as const,cursor:"pointer"};
  return <>
    <button type="button" style={triggerStyle} aria-label={`Quick view ${name}`} onClick={()=>void openQuickView()}>{children}</button>
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
