"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CommentThread from "@/app/outfits/[id]/CommentThread";
import OutfitGallery, { type GalleryPhoto } from "@/app/outfits/[id]/OutfitGallery";
import { MatchPercentageBadge } from "@/components/MatchPercentageBadge";
import StyleFeedGarments from "./StyleFeedGarments";
import { StyleFeedLikeButton } from "./StyleFeedLikeButton";
import { StyleFeedShareButton } from "./StyleFeedShareButton";
import styles from "./StyleFeedBoard.module.css";

export type StyleFeedBoardItem={id:string;headline:string;note:string|null;photos:GalleryPhoto[];creator:{username:string;displayName:string;avatarUrl:string|null};twinLabel:string|null;topsMatch:number|null;bottomsMatch:number|null;dateLabel:string;occasionLinks:{label:string;href:string}[];styleLinks:{label:string;href:string}[];liked:boolean;likeCount:number;commentCount:number;commentsEnabled:boolean};

function MatchStat({label,value,onExplain}:{label:string;value:number|null;onExplain:()=>void}){return <div className={styles.matchStat}><strong>{typeof value==="number"?<MatchPercentageBadge score={value} compact/>:<span className={styles.unavailable}>Not enough information <button type="button" onClick={onExplain}>?</button></span>}</strong><span>{label}</span></div>;}

export default function StyleFeedBoard({items}:{items:StyleFeedBoardItem[]}){
  const [activeId,setActiveId]=useState<string|null>(null);const [showMatchHelp,setShowMatchHelp]=useState(false);const active=items.find((item)=>item.id===activeId)??null;
  useEffect(()=>{setShowMatchHelp(false);if(!active)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";const keydown=(event:KeyboardEvent)=>{if(event.key==="Escape")setActiveId(null);};window.addEventListener("keydown",keydown);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",keydown);};},[active]);
  return <>
    <section className={styles.board} aria-label="Outfits from people you follow">{items.map((item)=>{const lead=item.photos[0];return <button className={styles.tile} type="button" key={item.id} onClick={()=>setActiveId(item.id)} aria-label={`Open ${item.headline}`}>{lead?<img src={lead.previewUrl||lead.url} alt={item.headline} loading="lazy"/>:<span>OUTFIT</span>}{item.photos.length>1?<span className={styles.multiBadge}>1 / {item.photos.length}</span>:null}</button>;})}</section>
    {active?<div className={styles.modal} role="dialog" aria-modal="true" aria-label={`${active.headline} Outfit`} onClick={()=>setActiveId(null)}><article className={styles.modalCard} onClick={(event)=>event.stopPropagation()}><button className={styles.close} type="button" aria-label="Close Outfit" onClick={()=>setActiveId(null)}>×</button><div className={styles.mediaPane}>{active.photos.length?<OutfitGallery photos={active.photos} garments={[]}/>:<span>OUTFIT</span>}</div><div className={styles.detailsPane}>
      <Link prefetch={false} className={styles.creator} href={`/people/${encodeURIComponent(active.creator.username)}`}>{active.creator.avatarUrl?<img className={styles.avatar} src={active.creator.avatarUrl} alt=""/>:<span className={styles.avatarFallback}>{active.creator.displayName.slice(0,1).toUpperCase()}</span>}<span className={styles.identity}><strong>{active.creator.displayName}</strong><span>@{active.creator.username}</span></span></Link>
      <div className={styles.meta}>{active.twinLabel?<span className={styles.badge}>{active.twinLabel}</span>:null}<span className={styles.date}>{active.dateLabel}</span></div>
      <div className={styles.matchRow}><MatchStat label="Tops Match" value={active.topsMatch} onExplain={()=>setShowMatchHelp(true)}/><MatchStat label="Bottoms Match" value={active.bottomsMatch} onExplain={()=>setShowMatchHelp(true)}/></div>
      {showMatchHelp?<div className={styles.matchHelp}><strong>Not enough information</strong><span>There aren't enough matching measurements between your profiles to calculate a reliable match. Additional measurements from either person may be needed.</span><button type="button" onClick={()=>setShowMatchHelp(false)}>Close</button></div>:null}
      <h2 className={styles.title}>{active.headline}</h2>{active.note?<p className={styles.note}>{active.note}</p>:null}
      {active.occasionLinks.length||active.styleLinks.length?<div className={styles.tags}>{active.occasionLinks.map((tag)=><Link key={tag.href} href={tag.href}>{tag.label}</Link>)}{active.styleLinks.map((tag)=><Link key={tag.href} href={tag.href}>#{tag.label}</Link>)}</div>:null}
      <div className={styles.actions}><StyleFeedLikeButton postId={active.id} initialLiked={active.liked} initialCount={active.likeCount}/>{active.commentsEnabled?<CommentThread postId={active.id} commentCount={active.commentCount} signedIn signIn={null} triggerOnly triggerLabel={`Comments${active.commentCount?` ${active.commentCount}`:""}`}/>:<span className={styles.disabled}>Comments off</span>}<StyleFeedShareButton postId={active.id} headline={active.headline}/></div>
      <div className={styles.garments}><StyleFeedGarments postId={active.id}/></div><Link className={styles.fullOutfit} prefetch={false} href={`/outfits/${active.id}`}>View Full Outfit →</Link>
    </div></article></div>:null}
  </>;
}
