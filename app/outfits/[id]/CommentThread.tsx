"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { deleteOutfitComment } from "@/app/outfits/actions";
import { reportContent } from "@/app/moderation/actions";
import CommentComposer, { type SubmittedComment } from "./CommentComposer";
import styles from "./outfitDetail.module.css";

const PAGE_SIZE=20;
type SortMode="top"|"newest";
type CommentItem=SubmittedComment;
type Cursor={createdAt:string;id:string;likeCount:number};
type PagePayload={comments:CommentItem[];nextCursor:Cursor|null};
function formatDate(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}
function sortComments(items:CommentItem[],sort:SortMode){return [...items].sort((a,b)=>sort==="top"?b.likeCount-a.likeCount||Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id.localeCompare(a.id):Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id.localeCompare(a.id));}

export default function CommentThread({postId,commentCount,signedIn,signIn,initialOpen=false,error}:{postId:string;commentCount:number;signedIn:boolean;signIn:ReactNode;initialOpen?:boolean;error?:ReactNode}){
  const [open,setOpen]=useState(initialOpen);
  const [sort,setSort]=useState<SortMode>("top");
  const [count,setCount]=useState(commentCount);
  const [preview,setPreview]=useState<CommentItem[]>([]);
  const [full,setFull]=useState<CommentItem[]>([]);
  const [cursor,setCursor]=useState<Cursor|null>(null);
  const [previewLoaded,setPreviewLoaded]=useState(false);
  const [fullLoaded,setFullLoaded]=useState(false);
  const [loadingEarlier,setLoadingEarlier]=useState(false);
  const [interactionError,setInteractionError]=useState("");
  const returnTo=`/outfits/${postId}?tab=comments&comments=1`;

  async function requestPage(limit:number,sortMode:SortMode,before?:Cursor|null):Promise<PagePayload|null>{
    const params=new URLSearchParams({limit:String(limit),sort:sortMode});
    if(before){params.set("before_created_at",before.createdAt);params.set("before_id",before.id);if(sortMode==="top")params.set("before_like_count",String(before.likeCount));}
    try{
      const response=await fetch(`/api/outfits/${postId}/comments?${params.toString()}`,{cache:"no-store"});
      if(!response.ok)return null;
      return await response.json() as PagePayload;
    }catch{return null;}
  }
  async function loadPreview(sortMode:SortMode){
    const payload=await requestPage(3,sortMode);
    setPreview(payload?.comments??[]);
    setPreviewLoaded(true);
  }
  async function loadFull(sortMode:SortMode){
    const payload=await requestPage(PAGE_SIZE,sortMode);
    setFull(payload?.comments??[]);
    setCursor(payload?.nextCursor??null);
    setFullLoaded(true);
  }
  async function loadEarlier(){
    if(!cursor||loadingEarlier)return;
    setLoadingEarlier(true);
    const payload=await requestPage(PAGE_SIZE,sort,cursor);
    if(payload){setFull((current)=>[...current,...payload.comments]);setCursor(payload.nextCursor);}
    setLoadingEarlier(false);
  }
  function openComments(){
    setOpen(true);
    if(!fullLoaded)void loadFull(sort);
  }
  function changeSort(next:SortMode){
    if(next===sort)return;
    setSort(next);
    setPreviewLoaded(false);
    setFullLoaded(false);
    setCursor(null);
    void loadPreview(next);
    if(open)void loadFull(next);
  }
  function updateComment(commentId:string,updater:(comment:CommentItem)=>CommentItem){
    const apply=(items:CommentItem[])=>sortComments(items.map((comment)=>comment.id===commentId?updater(comment):comment),sort);
    setPreview(apply);
    setFull(apply);
  }
  async function toggleLike(comment:CommentItem){
    const nextLiked=!comment.likedByViewer;
    const optimisticCount=Math.max(0,comment.likeCount+(nextLiked?1:-1));
    setInteractionError("");
    updateComment(comment.id,(current)=>({...current,likedByViewer:nextLiked,likeCount:optimisticCount}));
    try{
      const response=await fetch(`/api/outfits/${postId}/comments`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:comment.id,liked:nextLiked})});
      const payload=await response.json() as {liked?:boolean;likeCount?:number;error?:string};
      if(!response.ok||typeof payload.likeCount!=="number")throw new Error(payload.error||"Could not update comment Like.");
      updateComment(comment.id,(current)=>({...current,likedByViewer:Boolean(payload.liked),likeCount:payload.likeCount!}));
    }catch(cause){
      updateComment(comment.id,(current)=>({...current,likedByViewer:comment.likedByViewer,likeCount:comment.likeCount}));
      setInteractionError(cause instanceof Error?cause.message:"Could not update comment Like.");
    }
  }
  function commentAdded(comment:CommentItem){
    setCount((value)=>value+1);
    setPreview((current)=>sortComments([comment,...current.filter((row)=>row.id!==comment.id)],sort).slice(0,3));
    setPreviewLoaded(true);
    if(fullLoaded)setFull((current)=>sortComments([comment,...current.filter((row)=>row.id!==comment.id)],sort));
    window.dispatchEvent(new CustomEvent("likesized:comment-count",{detail:{count:count+1}}));
  }

  useEffect(()=>{void loadPreview("top");if(open)void loadFull("top");},[postId]);

  function SortButtons(){return <div style={{display:"flex",gap:4,alignItems:"center"}} aria-label="Sort comments">
    <button className={styles.viewCommentsButton} type="button" aria-pressed={sort==="top"} onClick={()=>changeSort("top")}>Top</button>
    <button className={styles.viewCommentsButton} type="button" aria-pressed={sort==="newest"} onClick={()=>changeSort("newest")}>Newest</button>
  </div>;}

  function renderComment(comment:CommentItem){
    const authorName=comment.displayName?.trim()||comment.username||"LikeSized member";
    return <article className={styles.comment} key={comment.id}>
      {comment.avatarUrl?<img className={styles.commentAvatar} src={comment.avatarUrl} alt=""/>:<div className={styles.commentAvatarFallback}>{authorName.slice(0,1).toUpperCase()}</div>}
      <div className={styles.commentBody}>
        <div className={styles.commentIdentity}><Link href={`/people/${comment.username}`}><strong>{authorName}</strong><span>@{comment.username}</span></Link><small>{formatDate(comment.createdAt)}</small></div>
        <div className={styles.commentTextRow}><p>{comment.body}</p><div className={styles.commentActions}>
          {signedIn?<button type="button" aria-label={comment.likedByViewer?"Unlike comment":"Like comment"} onClick={()=>void toggleLike(comment)}>{comment.likedByViewer?"♥":"♡"}{comment.likeCount?` ${comment.likeCount}`:""}</button>:<span>♡{comment.likeCount?` ${comment.likeCount}`:""}</span>}
          {signedIn?<details className="reportFlagControl"><summary title="Report comment" aria-label="Report comment">⚑</summary><form action={reportContent}><input type="hidden" name="target_type" value="outfit_comment"/><input type="hidden" name="target_id" value={comment.id}/><input type="hidden" name="return_to" value={returnTo}/><label>Reason<select name="reason" defaultValue="" required><option value="" disabled>Select a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="inappropriate_content">Inappropriate content</option><option value="scam_misleading">Scam / misleading</option><option value="other">Other</option></select></label><label>Details (optional)<textarea name="details" maxLength={500}/></label><button type="submit">Send report</button></form></details>:null}
          {comment.canDelete?<form action={deleteOutfitComment}><input type="hidden" name="comment_id" value={comment.id}/><input type="hidden" name="post_id" value={postId}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit">Delete</button></form>:null}
        </div></div>
      </div>
    </article>;
  }

  return <div className={styles.commentsPreview}>
    <SortButtons/>
    {!previewLoaded?<p className="muted">Loading comments…</p>:preview.length?<div className={styles.commentPreviewList}>{preview.map(renderComment)}</div>:<p className="muted">No comments yet.</p>}
    <button className={styles.viewCommentsButton} type="button" onClick={openComments}>{count?`View all ${count} comment${count===1?"":"s"}`:"Add a comment"}</button>
    {open?<div className={styles.commentsOverlay} role="dialog" aria-modal="true" aria-label="Outfit comments" onClick={()=>setOpen(false)}>
      <section className={styles.commentsSheet} onClick={(event)=>event.stopPropagation()}>
        <header className={styles.commentsSheetHeader}><strong>Comments</strong><span>{count}</span><SortButtons/><button type="button" aria-label="Close comments" onClick={()=>setOpen(false)}>×</button></header>
        <div className={styles.commentsSheetBody}>
          {!fullLoaded?<p className="muted">Loading comments…</p>:full.length?<div className={styles.commentList}>{full.map(renderComment)}</div>:<p className="muted">No comments yet.</p>}
          {cursor?<button className={styles.loadEarlierButton} type="button" disabled={loadingEarlier} onClick={()=>void loadEarlier()}>{loadingEarlier?"Loading…":"Load more comments"}</button>:null}
        </div>
        {interactionError?<div className="authMessage error">{interactionError}</div>:null}
        {error}
        <footer className={styles.commentsSheetFooter}>{signedIn?<CommentComposer postId={postId} onAdded={commentAdded}/>:signIn}</footer>
      </section>
    </div>:null}
  </div>;
}
