"use client";

import { useEffect, useState } from "react";
import styles from "./outfitDetail.module.css";

export default function OutfitEngagementClient({ postId, headline }: { postId: string; headline: string }) {
  const [shared,setShared]=useState(false);
  useEffect(()=>{
    const key=`likesized:outfit-view:${postId}`;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,"1");
    void fetch(`/api/outfits/${postId}/view`,{method:"POST",keepalive:true});
  },[postId]);
  async function share(){
    const url=window.location.href;
    try{
      if(navigator.share)await navigator.share({title:headline,url});
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(()=>setShared(false),1600);
      void fetch(`/api/outfits/${postId}/share`,{method:"POST",keepalive:true});
    }catch{/* cancelled share */}
  }
  return <button className={styles.iconAction} type="button" onClick={()=>void share()} aria-label={shared?"Outfit link copied":"Share Outfit"} title={shared?"Link copied":"Share Outfit"}>{shared?"✓":"↗"}</button>;
}
