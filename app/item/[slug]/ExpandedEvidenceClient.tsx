"use client";

import { useState } from "react";
import styles from "./itemDetail.module.css";

type EvidenceRow={fitReportId:string;member:string;bodyMatch:number;sizeLabel:string;fitLabel:string;evidenceLabel:string;garment:string;variationDetail:string};

export default function ExpandedEvidenceClient({slug,variationKey}:{slug:string;variationKey:string|null}){
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [rows,setRows]=useState<EvidenceRow[]|null>(null);

  async function toggle(){
    const next=!open;setOpen(next);
    if(!next||rows||loading)return;
    setLoading(true);setError("");
    const query=variationKey?`?variation=${encodeURIComponent(variationKey)}`:"";
    try{
      const response=await fetch(`/api/items/${encodeURIComponent(slug)}/evidence${query}`,{cache:"no-store"});
      if(!response.ok){const payload=await response.json().catch(()=>null) as {error?:string}|null;throw new Error(payload?.error||"Evidence could not load.");}
      const payload=await response.json() as {rows:EvidenceRow[]};setRows(payload.rows);
    }catch(error:unknown){setError(error instanceof Error?error.message:"Evidence could not load.");}
    finally{setLoading(false);}
  }

  return <div className={styles.moreEvidence}>
    <button className={styles.moreButton} type="button" aria-expanded={open} onClick={()=>void toggle()}>{open?"Hide more evidence":"See more evidence"}</button>
    {open?<div className={styles.moreList}>{loading?<div className={styles.empty}>Loading evidence…</div>:error?<div className="authMessage error">{error}</div>:rows?.length?rows.map((row)=><div className={styles.moreRow} key={row.fitReportId}><div><strong>{row.member}</strong><span>{row.garment}{row.variationDetail?` · ${row.variationDetail}`:""}</span></div><div><strong>{row.bodyMatch}%</strong><span>Body Match</span></div><div><strong>{row.sizeLabel}</strong><span>Size worn</span></div><div><strong>{row.fitLabel}</strong><span>{row.evidenceLabel}</span></div></div>):<div className={styles.empty}>No additional evidence is available yet.</div>}</div>:null}
  </div>;
}
