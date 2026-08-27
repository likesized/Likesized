"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { reportContent } from "@/app/moderation/actions";
import { PersonQuickView } from "@/components/PersonQuickView";
import CommentComposer, { type SubmittedComment } from "./CommentComposer";
import styles from "./CommentThread.module.css";

const PAGE_SIZE=20;
type SortMode="top"|"newest";
type CommentItem=SubmittedComment;
type Cursor={createdAt:string;id:string;likeCount:number};
type PagePayload={comments:CommentItem[];nextCursor:Cursor|null};

function formatDate(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}
function sortComments(items:CommentItem[],sort:SortMode){return [...items].sort((a,b)=>sort==="top"?b.likeCount-a.likeCount||Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id.localeCompare(a.id):Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id.localeCompare(a.id));}

export default function CommentThread({postId,commentCount,signedIn,signIn,initialOpen=false,error,triggerOnly=false,triggerClassName,triggerLabel}:{postId:string;commentCount:number;signedIn:boolean;signIn:ReactNode;initialOpen?:boolean;error?:ReactNode;triggerOnly?:boolean;triggerClassName?:string;triggerLabel?:ReactNode}){
  const triggerRef=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(initialOpen);
  const [sort,setSort]=useState<SortMode>("top");
  const [count,setCount]=useState(commentCount);
  const [preview,setPreview]=useState<CommentItem[]>([]);
  const [full,setFull]=useState<CommentItem[]>([]);
  const [cursor,setCursor]=useState<Cursor|null>(null);
  const [previewLoaded,setPreviewLoaded]=useState(false);
  const [fullLoaded,setFullLoaded]=useState(commentCount===0);
  const [loadingEarlier,setLoadingEarlier]=useState(false);
  const [interactionError,setInteractionError]=useState("");
  const prefetching=useRef(false);
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
    if(count===0){setFull([]);setCursor(null);setFullLoaded(true);return;}
    const payload=await requestPage(PAGE_SIZE,sortMode);
    setFull(payload?.comments??[]);
    setCursor(payload?.nextCursor??null);
    setFullLoaded(true);
  }

  function primeFull(){
    if(fullLoaded||prefetching.current)return;
    if(count===0){setFull([]);setCursor(null);setFullLoaded(true);return;}
    prefetching.current=true;
    void loadFull(sort).finally(()=>{prefetching.current=false;});
  }

  async function loadEarlier(){
    if(!cursor||loadingEarlier)return;
    setLoadingEarlier(true);
    const payload=await requestPage(PAGE_SIZE,sort,cursor);
    if(payload){setFull((current)=>[...current,...payload.comments]);setCursor(payload.nextCursor);}
    setLoadingEarlier(false);
  }

  function openComments(){
    setInteractionError("");
    setOpen(true);
    if(count===0){setFull([]);setCursor(null);setFullLoaded(true);return;}
    if(!fullLoaded&&!prefetching.current)primeFull();
  }

  function closeComments(){
    setOpen(false);
    setInteractionError("");
    if(!triggerOnly){
      setPreviewLoaded(false);
      void loadPreview(sort);
    }
  }

  function changeSort(next:SortMode){
    if(next===sort)return;
    setSort(next);
    setCursor(null);
    setInteractionError("");
    setFullLoaded(count===0);
    prefetching.current=false;
    if(count===0)return;
    if(open){void loadFull(next);}
    else if(!triggerOnly){setPreviewLoaded(false);void loadPreview(next);}
  }

  function updateActiveComment(commentId:string,updater:(comment:CommentItem)=>CommentItem){
    const apply=(items:CommentItem[])=>sortComments(items.map((comment)=>comment.id===commentId?updater(comment):comment),sort);
    if(open)setFull(apply);
    else setPreview(apply);
  }

  async function toggleLike(comment:CommentItem){
    const nextLiked=!comment.likedByViewer;
    const optimisticCount=Math.max(0,comment.likeCount+(nextLiked?1:-1));
    setInteractionError("");
    updateActiveComment(comment.id,(current)=>({...current,likedByViewer:nextLiked,likeCount:optimisticCount}));
    try{
      const response=await fetch(`/api/outfits/${postId}/comments`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:comment.id,liked:nextLiked})});
      const payload=await response.json() as {liked?:boolean;likeCount?:number;error?:string};
      if(!response.ok||typeof payload.likeCount!=="number")throw new Error(payload.error||"Could not update comment Like.");
      updateActiveComment(comment.id,(current)=>({...current,likedByViewer:Boolean(payload.liked),likeCount:payload.likeCount!}));
    }catch(cause){
      updateActiveComment(comment.id,(current)=>({...current,likedByViewer:comment.likedByViewer,likeCount:comment.likeCount}));
      setInteractionError(cause instanceof Error?cause.message:"Could not update comment Like.");
    }
  }

  async function deleteComment(comment:CommentItem){
    setInteractionError("");
    const activeBefore=open?full:preview;
    if(open)setFull((current)=>current.filter((row)=>row.id!==comment.id));
    else setPreview((current)=>current.filter((row)=>row.id!==comment.id));
    setCount((current)=>Math.max(0,current-1));
    try{
      const response=await fetch(`/api/outfits/${postId}/comments`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({commentId:comment.id})});
      const payload=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok||!payload.ok)throw new Error(payload.error||"Could not delete comment.");
      window.dispatchEvent(new CustomEvent("likesized:comment-count",{detail:{count:Math.max(0,count-1)}}));
    }catch(cause){
      if(open)setFull(activeBefore);
      else setPreview(activeBefore);
      setCount((current)=>current+1);
      setInteractionError(cause instanceof Error?cause.message:"Could not delete comment.");
    }
  }

  function commentAdded(comment:CommentItem){
    setCount((current)=>{
      const next=current+1;
      window.dispatchEvent(new CustomEvent("likesized:comment-count",{detail:{count:next}}));
      return next;
    });
    if(open){
      setFull((current)=>sortComments([comment,...current.filter((row)=>row.id!==comment.id)],sort));
      setFullLoaded(true);
    }else if(!triggerOnly){
      setPreview((current)=>sortComments([comment,...current.filter((row)=>row.id!==comment.id)],sort).slice(0,3));
      setPreviewLoaded(true);
    }
  }

  useEffect(()=>{
    setCount(commentCount);
    setSort("top");
    prefetching.current=false;
    if(initialOpen){setOpen(true);setFullLoaded(commentCount===0);if(commentCount>0)void loadFull("top");}
    else if(triggerOnly){setOpen(false);setFull([]);setFullLoaded(commentCount===0);setPreview([]);setPreviewLoaded(true);}
    else{setOpen(false);setPreviewLoaded(false);void loadPreview("top");}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[postId,triggerOnly]);

  useEffect(()=>{
    if(!triggerOnly||fullLoaded||count===0)return;
    const node=triggerRef.current;
    if(!node)return;
    const observer=new IntersectionObserver((entries)=>{
      if(entries.some((entry)=>entry.isIntersecting)){primeFull();observer.disconnect();}
    },{rootMargin:"350px 0px"});
    observer.observe(node);
    return()=>observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[postId,triggerOnly,fullLoaded,count,sort]);

  function SortButtons(){return <div className={styles.sortRow} aria-label="Sort comments">
    <button className={styles.sortButton} type="button" aria-pressed={sort==="top"} onClick={()=>changeSort("top")}>Top</button>
    <button className={styles.sortButton} type="button" aria-pressed={sort==="newest"} onClick={()=>changeSort("newest")}>Newest</button>
  </div>;}

  function renderComment(comment:CommentItem){
    const authorName=comment.displayName?.trim()||comment.username||"LikeSized member";
    return <article className={styles.comment} key={comment.id}>
      {comment.avatarUrl?<img className={styles.avatar} src={comment.avatarUrl} alt=""/>:<div className={styles.avatarFallback}>{authorName.slice(0,1).toUpperCase()}</div>}
      <div className={styles.commentBody}>
        <div className={styles.identityRow}>
          <PersonQuickView username={comment.username} displayName={comment.displayName} avatarUrl={comment.avatarUrl} inline>
            <span className={styles.identityTrigger}><strong>{authorName}</strong><span>@{comment.username}</span></span>
          </PersonQuickView>
          <small className={styles.date}>{formatDate(comment.createdAt)}</small>
        </div>
        <div className={styles.textRow}><p>{comment.body}</p><div className={styles.actions}>
          {signedIn?<button type="button" aria-label={comment.likedByViewer?"Unlike comment":"Like comment"} onClick={()=>void toggleLike(comment)}>{comment.likedByViewer?"♥":"♡"}{comment.likeCount?` ${comment.likeCount}`:""}</button>:<span>♡{comment.likeCount?` ${comment.likeCount}`:""}</span>}
          {signedIn?<details className="reportFlagControl"><summary aria-label="Report comment">Report</summary><form action={reportContent}><input type="hidden" name="target_type" value="outfit_comment"/><input type="hidden" name="target_id" value={comment.id}/><input type="hidden" name="return_to" value={returnTo}/><label>Reason<select name="reason" defaultValue="" required><option value="" disabled>Select a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="inappropriate_content">Inappropriate content</option><option value="scam_misleading">Scam / misleading</option><option value="other">Other</option></select></label><label>Details (optional)<textarea name="details" maxLength={500}/></label><button type="submit">Send report</button></form></details>:null}
          {comment.canDelete?<button type="button" onClick={()=>void deleteComment(comment)}>Delete</button>:null}
        </div></div>
      </div>
    </article>;
  }

  return <div className={styles.host}>
    {!open&&triggerOnly?<button ref={triggerRef} className={triggerClassName??styles.openButton} type="button" onPointerEnter={primeFull} onPointerDown={primeFull} onFocus={primeFull} onClick={openComments}>{triggerLabel??(count?`Comments ${count}`:"Comments")}</button>:null}
    {!open&&!triggerOnly?<div className={styles.preview}>
      <SortButtons/>
      {!previewLoaded?<p className="muted">Loading comments…</p>:preview.length?<div className={styles.commentList}>{preview.map(renderComment)}</div>:<p className="muted">No comments yet.</p>}
      <button className={styles.openButton} type="button" onPointerEnter={primeFull} onPointerDown={primeFull} onFocus={primeFull} onClick={openComments}>{count?`View all ${count} comment${count===1?"":"s"}`:"Add a comment"}</button>
    </div>:null}
    {open?<div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Outfit comments" onClick={closeComments}>
      <section className={styles.sheet} onClick={(event)=>event.stopPropagation()}>
        <header className={styles.header}><strong>Comments</strong><span className={styles.count}>· {count}</span><button className={styles.close} type="button" aria-label="Close comments" onClick={closeComments}>×</button></header>
        <div className={styles.sheetSort}><SortButtons/></div>
        <div className={styles.body}>
          {!fullLoaded?<p className="muted">Loading comments…</p>:full.length?<div className={styles.commentList}>{full.map(renderComment)}</div>:<p className="muted">No comments yet.</p>}
          {cursor?<button className={styles.loadButton} type="button" disabled={loadingEarlier} onClick={()=>void loadEarlier()}>{loadingEarlier?"Loading…":"Load more comments"}</button>:null}
        </div>
        {interactionError?<div className={`authMessage error ${styles.error}`}>{interactionError}</div>:null}
        {error}
        <footer className={styles.footer}>{signedIn?<CommentComposer postId={postId} onAdded={commentAdded}/>:signIn}</footer>
      </section>
    </div>:null}
  </div>;
}
