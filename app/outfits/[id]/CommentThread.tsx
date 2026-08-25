"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./outfitDetail.module.css";

const PAGE_SIZE=20;

export default function CommentThread({comments,commentCount,composer,signIn,initialOpen=false,error}:{comments:ReactNode[];commentCount:number;composer:ReactNode;signIn:ReactNode;initialOpen?:boolean;error?:ReactNode}){
  const [open,setOpen]=useState(initialOpen);
  const [visible,setVisible]=useState(PAGE_SIZE);
  useEffect(()=>{if(!open)setVisible(PAGE_SIZE);},[open]);
  const preview=comments.slice(-3);
  const full=comments.slice(Math.max(0,comments.length-visible));
  const hidden=Math.max(0,comments.length-visible);

  return <div className={styles.commentsPreview}>
    {preview.length?<div className={styles.commentPreviewList}>{preview}</div>:<p className="muted">No comments yet.</p>}
    <button className={styles.viewCommentsButton} type="button" onClick={()=>setOpen(true)}>{commentCount?`View all ${commentCount} comment${commentCount===1?"":"s"}`:"Add a comment"}</button>
    {open?<div className={styles.commentsOverlay} role="dialog" aria-modal="true" aria-label="Outfit comments" onClick={()=>setOpen(false)}>
      <section className={styles.commentsSheet} onClick={(event)=>event.stopPropagation()}>
        <header className={styles.commentsSheetHeader}><strong>Comments</strong><span>{commentCount}</span><button type="button" aria-label="Close comments" onClick={()=>setOpen(false)}>×</button></header>
        <div className={styles.commentsSheetBody}>
          {hidden?<button className={styles.loadEarlierButton} type="button" onClick={()=>setVisible((value)=>value+PAGE_SIZE)}>Load earlier comments ({hidden})</button>:null}
          {full.length?<div className={styles.commentList}>{full}</div>:<p className="muted">No comments yet.</p>}
        </div>
        {error}
        <footer className={styles.commentsSheetFooter}>{composer??signIn}</footer>
      </section>
    </div>:null}
  </div>;
}
