"use client";

import { useState } from "react";
import styles from "./CommentThread.module.css";

export type SubmittedComment={id:string;body:string;createdAt:string;username:string;displayName:string|null;avatarUrl:string|null;likeCount:number;likedByViewer:boolean;canDelete:boolean};

export default function CommentComposer({postId,onAdded}:{postId:string;onAdded:(comment:SubmittedComment)=>void}){
  const [body,setBody]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const value=body.trim();
    if(!value||pending)return;
    setPending(true);
    setError("");
    try{
      const response=await fetch(`/api/outfits/${postId}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:value})});
      const payload=await response.json() as {comment?:SubmittedComment;error?:string};
      if(!response.ok||!payload.comment)throw new Error(payload.error||"Could not add comment.");
      onAdded(payload.comment);
      setBody("");
    }catch(cause){
      setError(cause instanceof Error?cause.message:"Could not add comment.");
    }finally{
      setPending(false);
    }
  }

  return <form className={styles.composer} onSubmit={(event)=>void submit(event)}>
    <label className={styles.composerField}>
      <span className={styles.composerMeta}><span>Add a comment</span><span>{body.length}/500</span></span>
      <textarea name="body" value={body} onChange={(event)=>setBody(event.target.value)} rows={1} maxLength={500} required placeholder="Add a comment…"/>
    </label>
    <button className={styles.composerButton} type="submit" disabled={!body.trim()||pending}>{pending?"Posting…":"Comment"}</button>
    {error?<small role="status" className={styles.composerError}>{error}</small>:null}
  </form>;
}
