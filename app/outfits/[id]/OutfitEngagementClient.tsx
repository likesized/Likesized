"use client";

import { useEffect, useState } from "react";
import { UniversalActionButton } from "@/components/UniversalActionBar";
import { shareOutfit } from "@/lib/outfit-share-client";
import styles from "./outfitDetail.module.css";

export default function OutfitEngagementClient({postId,headline,shareCount}:{postId:string;headline:string;shareCount:number}){
  const [shared,setShared]=useState(false);
  const [count,setCount]=useState(shareCount);
  useEffect(()=>{
    const key=`likesized:outfit-view:${postId}`;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,"1");
    void fetch(`/api/outfits/${postId}/view`,{method:"POST",keepalive:true}).catch(()=>{sessionStorage.removeItem(key);});
  },[postId]);
  async function share(){
    const ok=await shareOutfit(postId,headline);
    if(!ok)return;
    setCount((value)=>value+1);
    setShared(true);
    window.setTimeout(()=>setShared(false),1600);
  }
  return <UniversalActionButton className={styles.iconAction} action="share" type="button" onClick={()=>void share()} ariaLabel={shared?"Outfit shared":"Share Outfit"} title={shared?"Shared":"Share"} count={count} countClassName={styles.actionCount}/>;
}
