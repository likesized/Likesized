"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { followPerson, setFollowingNotificationSubscription, unfollowPerson } from "@/app/people/actions";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink } from "@/components/UniversalActionBar";
import styles from "@/app/outfits/[id]/CreatorQuickView.module.css";

type Summary={userId:string|null;username:string;displayName:string|null;avatarUrl:string|null;signedIn:boolean;owner:boolean;following:boolean;notificationsOn:boolean;overallMatch:number|null;topsMatch:number|null;bottomsMatch:number|null;totalGarments:number|null;totalOutfits:number|null};
type Props={username:string;displayName?:string|null;avatarUrl?:string|null;children:ReactNode;inline?:boolean};

function stat(value:number|null){return typeof value==="number"?`${value}%`:"—";}

export function PersonQuickView({username,displayName,avatarUrl,children,inline=false}:Props){
  const [open,setOpen]=useState(false);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [loading,setLoading]=useState(false);
  const name=summary?.displayName?.trim()||displayName?.trim()||username;
  const photo=summary?.avatarUrl??avatarUrl??null;
  const returnTo=typeof window==="undefined"?"/people":`${window.location.pathname}${window.location.search}${window.location.hash}`;

  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    window.addEventListener("keydown",onKey);
    return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow=previous;};
  },[open]);

  async function openQuickView(){
    setOpen(true);
    if(summary||loading)return;
    setLoading(true);
    try{const response=await fetch(`/api/people/${encodeURIComponent(username)}/quick-view`,{cache:"no-store"});if(response.ok)setSummary(await response.json() as Summary);}finally{setLoading(false);}
  }

  return <>
    <button type="button" style={inline?{display:"inline",margin:0,padding:0,border:0,background:"transparent",color:"inherit",font:"inherit",textAlign:"left",cursor:"pointer"}:{margin:0,padding:0,border:0,background:"transparent",color:"inherit",font:"inherit",textAlign:"left",cursor:"pointer"}} aria-label={`Quick view ${name}`} onClick={()=>void openQuickView()}>{children}</button>
    {open?<div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${name} profile quick view`} onClick={()=>setOpen(false)}><section className={styles.card} onClick={(event)=>event.stopPropagation()}>
      <button className={styles.close} type="button" aria-label="Close profile quick view" onClick={()=>setOpen(false)}>×</button>
      <div className={styles.identity}>{photo?<img src={photo} alt=""/>:<span>{name.slice(0,1).toUpperCase()}</span>}<div><strong>{name}</strong><small>@{summary?.username??username}</small></div></div>
      {loading&&!summary?<p className={styles.helper}>Loading profile details…</p>:<div className={styles.stats}>
        <div className={styles.overallStat}><strong>{summary?.owner?"—":stat(summary?.overallMatch??null)}</strong><span>Overall Match</span></div>
        <div><strong>{summary?.owner?"—":stat(summary?.topsMatch??null)}</strong><span>Tops Match</span></div>
        <div><strong>{summary?.owner?"—":stat(summary?.bottomsMatch??null)}</strong><span>Bottoms Match</span></div>
        <div><strong>{summary?.totalGarments??"—"}</strong><span>Total Garments</span></div>
        <div><strong>{summary?.totalOutfits??"—"}</strong><span>Total Outfits</span></div>
      </div>}
      {summary&&!summary.owner&&summary.userId?<UniversalActionBar className={styles.actions} ariaLabel="Profile actions">
        {summary.signedIn?summary.following?<form action={unfollowPerson}><input type="hidden" name="target_user_id" value={summary.userId}/><input type="hidden" name="return_to" value={returnTo}/><UniversalActionButton action="follow" active type="submit" showLabel/></form>:<form action={followPerson}><input type="hidden" name="target_user_id" value={summary.userId}/><input type="hidden" name="return_to" value={returnTo}/><UniversalActionButton action="follow" type="submit" showLabel/></form>:<UniversalActionLink action="follow" href={`/login?next=${encodeURIComponent(returnTo)}`} showLabel/>}
        {summary.signedIn&&summary.following?<form action={setFollowingNotificationSubscription}><input type="hidden" name="target_user_id" value={summary.userId}/><input type="hidden" name="enabled" value={summary.notificationsOn?"false":"true"}/><input type="hidden" name="return_to" value={returnTo}/><UniversalActionButton action="notify" active={summary.notificationsOn} type="submit" showLabel/></form>:null}
      </UniversalActionBar>:null}
      <Link className={styles.fullProfile} href={`/people/${summary?.username??username}`} data-full-navigation="true">View Full Profile</Link>
    </section></div>:null}
  </>;
}
