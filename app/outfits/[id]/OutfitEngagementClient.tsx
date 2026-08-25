"use client";

import { useEffect, useState } from "react";
import { UniversalActionButton } from "@/components/UniversalActionBar";
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
    const url=window.location.href;
    try{
      if(navigator.share)await navigator.share({title:headline,url});else await navigator.clipboard.writeText(url);
      const response=await fetch(`/api/outfits/${postId}/share`,{method:"POST",keepalive:true});
      if(response.ok)setCount((value)=>value+1);
      setShared(true);window.setTimeout(()=>setShared(false),1600);
    }catch{/* user cancelled or browser denied */}
  }
  return <UniversalActionButton className={styles.iconAction} action="share" type="button" onClick={()=>void share()} ariaLabel={shared?"Outfit shared":"Share Outfit"} title={shared?"Shared":"Share"} count={count} countClassName={styles.actionCount}/>;
}
