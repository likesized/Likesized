"use client";

import { useEffect, useState } from "react";
import styles from "./itemDetail.module.css";

export default function GarmentNotifyButton({slug,variationKey}:{slug:string;variationKey:string|null}){
  const [watching,setWatching]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    const controller=new AbortController();
    const query=variationKey?`?variation=${encodeURIComponent(variationKey)}`:"";
    void fetch(`/api/items/${encodeURIComponent(slug)}/evidence-watch${query}`,{cache:"no-store",signal:controller.signal})
      .then(async(response)=>response.ok?response.json() as Promise<{watching?:boolean}>:null)
      .then((payload)=>{if(payload&&!controller.signal.aborted)setWatching(Boolean(payload.watching));})
      .catch(()=>{});
    return()=>controller.abort();
  },[slug,variationKey]);

  async function enable(){
    if(watching||pending)return;
    setPending(true);setError("");
    try{
      const response=await fetch(`/api/items/${encodeURIComponent(slug)}/evidence-watch`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({variationKey})});
      if(!response.ok)throw new Error();
      setWatching(true);
    }catch{setError("Notification request could not be saved. Try again.");}
    finally{setPending(false);}
  }

  return <div className={styles.notifyWrap}>
    <button className={styles.notifyButton} type="button" disabled={watching||pending} onClick={()=>void enable()}>{watching?"Notifications on":pending?"Saving…":"🔔 Notify Me"}</button>
    <span>Get notified when new Fit Reports add better evidence for this garment.</span>
    {error?<small role="status">{error}</small>:null}
  </div>;
}
