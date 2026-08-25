"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { deleteOutfitComment, likeOutfitComment, unlikeOutfitComment } from "@/app/outfits/actions";
import { reportContent } from "@/app/moderation/actions";
import styles from "./outfitDetail.module.css";

const PAGE_SIZE=20;
type CommentItem={id:string;body:string;createdAt:string;username:string;displayName:string|null;avatarUrl:string|null;likeCount:number;likedByViewer:boolean;canDelete:boolean};
type Cursor={createdAt:string;id:string};
type PagePayload={comments:CommentItem[];nextCursor:Cursor|null};
function formatDate(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}

export default function CommentThread({comments,commentCount,composer,signIn,initialOpen=false,error}:{comments:ReactNode[];commentCount:number;composer:ReactNode;signIn:ReactNode;initialOpen?:boolean;error?:ReactNode}){
  void comments;
  const [postId,setPostId]=useState("");
  const [open,setOpen]=useState(initialOpen);
  const [preview,setPreview]=useState<CommentItem[]>([]);
  const [full,setFull]=useState<CommentItem[]>([]);
  const [cursor,setCursor]=useState<Cursor|null>(null);
  const [previewLoaded,setPreviewLoaded]=useState(false);
  const [fullLoaded,setFullLoaded]=useState(false);
  const [loadingEarlier,setLoadingEarlier]=useState(false);
  const signedIn=Boolean(composer);
  const returnTo=postId?`/outfits/${postId}?tab=comments&comments=1`:"/outfits";

  async function requestPage(id:string,limit:number,before?:Cursor|null):Promise<PagePayload|null>{
    const params=new URLSearchParams({limit:String(limit)});
    if(before){params.set("before_created_at",before.createdAt);params.set("before_id",before.id);}
    try{
      const response=await fetch(`/api/outfits/${id}/comments?${params.toString()}`);
      if(!response.ok)return null;
      return await response.json() as PagePayload;
    }catch{return null;}
  }
  async function loadPreview(id:string){
    const payload=await requestPage(id,3);
    setPreview(payload?.comments??[]);
    setPreviewLoaded(true);
  }
  async function loadFull(id:string){
    const payload=await requestPage(id,PAGE_SIZE);
    setFull(payload?.comments??[]);
    setCursor(payload?.nextCursor??null);
    setFullLoaded(true);
  }
  async function loadEarlier(){
    if(!postId||!cursor||loadingEarlier)return;
    setLoadingEarlier(true);
    const payload=await requestPage(postId,PAGE_SIZE,cursor);
    if(payload){setFull((current)=>[...current,...payload.comments]);setCursor(payload.nextCursor);}
    setLoadingEarlier(false);
  }
  function openComments(){
    setOpen(true);
    if(postId&&!fullLoaded)void loadFull(postId);
  }

  useEffect(()=>{
    const match=window.location.pathname.match(/^\/outfits\/([0-9a-f-]+)$/i);
    setPostId(match?.[1]??"");
  },[]);
  useEffect(()=>{
    if(!postId)return;
    void loadPreview(postId);
    if(open&&!fullLoaded)void loadFull(postId);
  },[postId]);

  function renderComment(comment:CommentItem){
    const authorName=comment.displayName?.trim()||comment.username||"LikeSized member";
    return <article className={styles.comment} key={comment.id}>
      {comment.avatarUrl?<img className={styles.commentAvatar} src={comment.avatarUrl} alt=""/>:<div className={styles.commentAvatarFallback}>{authorName.slice(0,1).toUpperCase()}</div>}
      <div className={styles.commentBody}>
        <div className={styles.commentIdentity}><Link href={`/people/${comment.username}`}><strong>{authorName}</strong><span>@{comment.username}</span></Link><small>{formatDate(comment.createdAt)}</small></div>
        <div className={styles.commentTextRow}><p>{comment.body}</p><div className={styles.commentActions}>
          {signedIn&&postId?<form action={comment.likedByViewer?unlikeOutfitComment:likeOutfitComment}><input type="hidden" name="comment_id" value={comment.id}/><input type="hidden" name="post_id" value={postId}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-label={comment.likedByViewer?"Unlike comment":"Like comment"}>{comment.likedByViewer?"♥":"♡"}{comment.likeCount?` ${comment.likeCount}`:""}</button></form>:<span>♡{comment.likeCount?` ${comment.likeCount}`:""}</span>}
          {signedIn&&postId?<details className="reportFlagControl"><summary title="Report comment" aria-label="Report comment">⚑</summary><form action={reportContent}><input type="hidden" name="target_type" value="outfit_comment"/><input type="hidden" name="target_id" value={comment.id}/><input type="hidden" name="return_to" value={returnTo}/><label>Reason<select name="reason" defaultValue="other"><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="inappropriate_content">Inappropriate content</option><option value="scam_misleading">Scam / misleading</option><option value="other">Other</option></select></label><label>Details (optional)<textarea name="details" maxLength={500}/></label><button type="submit">Send report</button></form></details>:null}
          {comment.canDelete&&postId?<form action={deleteOutfitComment}><input type="hidden" name="comment_id" value={comment.id}/><input type="hidden" name="post_id" value={postId}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit">Delete</button></form>:null}
        </div></div>
      </div>
    </article>;
  }

  return <div className={styles.commentsPreview}>
    {!previewLoaded?<p className="muted">Loading comments…</p>:preview.length?<div className={styles.commentPreviewList}>{preview.map(renderComment)}</div>:<p className="muted">No comments yet.</p>}
    <button className={styles.viewCommentsButton} type="button" onClick={openComments}>{commentCount?`View all ${commentCount} comment${commentCount===1?"":"s"}`:"Add a comment"}</button>
    {open?<div className={styles.commentsOverlay} role="dialog" aria-modal="true" aria-label="Outfit comments" onClick={()=>setOpen(false)}>
      <section className={styles.commentsSheet} onClick={(event)=>event.stopPropagation()}>
        <header className={styles.commentsSheetHeader}><strong>Comments</strong><span>{commentCount}</span><button type="button" aria-label="Close comments" onClick={()=>setOpen(false)}>×</button></header>
        <div className={styles.commentsSheetBody}>
          {!fullLoaded?<p className="muted">Loading comments…</p>:full.length?<div className={styles.commentList}>{full.map(renderComment)}</div>:<p className="muted">No comments yet.</p>}
          {cursor?<button className={styles.loadEarlierButton} type="button" disabled={loadingEarlier} onClick={()=>void loadEarlier()}>{loadingEarlier?"Loading…":"Load earlier comments"}</button>:null}
        </div>
        {error}
        <footer className={styles.commentsSheetFooter}>{composer??signIn}</footer>
      </section>
    </div>:null}
  </div>;
}
