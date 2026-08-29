"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./outfitDetail.module.css";

export type GalleryGarment={id:string;label:string;detail:string;href:string;imageUrl?:string|null};
export type GalleryPhoto={id:string;url:string;previewUrl?:string;caption:string|null;tags:{closetItemId:string;x:number;y:number}[]};
type Point={x:number;y:number};

export default function OutfitGallery({photos,garments}:{photos:GalleryPhoto[];garments:GalleryGarment[]}){
  const [index,setIndex]=useState(0);
  const [showTags,setShowTags]=useState(true);
  const [showCaption,setShowCaption]=useState(false);
  const [lightboxOpen,setLightboxOpen]=useState(false);
  const start=useRef<Point|null>(null);
  const suppressClick=useRef(false);
  const preloaded=useRef(new Set<string>());
  const current=photos[index]??null;
  const garmentById=new Map(garments.map((garment)=>[garment.id,garment]));

  function move(delta:number){if(photos.length<2)return;setShowCaption(false);setIndex((value)=>(value+delta+photos.length)%photos.length);}
  function animateStageMove(delta:number){move(delta);}
  function preload(url:string){if(!url||preloaded.current.has(url))return;preloaded.current.add(url);const image=new Image();image.decoding="async";image.src=url;}
  function warm(){if(!current)return;preload(current.url);if(photos.length>1){preload(photos[(index-1+photos.length)%photos.length].url);preload(photos[(index+1)%photos.length].url);}}
  function openTaggedItem(closetItemId:string){window.dispatchEvent(new CustomEvent("likesized:open-tagged-item",{detail:{closetItemId}}));}
  function pointerDown(event:React.PointerEvent<HTMLDivElement>){if(!event.isPrimary)return;start.current={x:event.clientX,y:event.clientY};suppressClick.current=false;event.currentTarget.setPointerCapture?.(event.pointerId);warm();}
  function pointerMove(event:React.PointerEvent<HTMLDivElement>){const origin=start.current;if(!origin)return;const dx=event.clientX-origin.x;const dy=event.clientY-origin.y;if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy))suppressClick.current=true;}
  function pointerUp(event:React.PointerEvent<HTMLDivElement>){const origin=start.current;if(!origin)return;const dx=event.clientX-origin.x;const dy=event.clientY-origin.y;start.current=null;event.currentTarget.releasePointerCapture?.(event.pointerId);if(photos.length>1&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))animateStageMove(dx<0?1:-1);}

  useEffect(()=>{if(!lightboxOpen)return;const old=document.body.style.overflow;document.body.style.overflow="hidden";const keydown=(event:KeyboardEvent)=>{if(event.key==="Escape")setLightboxOpen(false);if(event.key==="ArrowRight")move(1);if(event.key==="ArrowLeft")move(-1);};window.addEventListener("keydown",keydown);return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",keydown);};},[lightboxOpen,photos.length]);

  if(!current)return <div className={styles.galleryEmpty}>No Outfit photo available.</div>;
  return <section className={styles.gallery} aria-label="Outfit photo gallery">
    <div className={styles.galleryStage} role="button" tabIndex={0} aria-label={photos.length>1?`Outfit photo ${index+1} of ${photos.length}. Open full-size photo or use Previous and Next to change photos.`:"Open full-size Outfit photo"} onPointerEnter={warm} onFocus={warm} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{start.current=null;}} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}warm();setLightboxOpen(true);}} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setLightboxOpen(true);}else if(event.key==="ArrowRight"){event.preventDefault();animateStageMove(1);}else if(event.key==="ArrowLeft"){event.preventDefault();animateStageMove(-1);}}}>
      <div className={styles.galleryMedia}>
        <img className={styles.galleryMain} src={current.url} alt={`Outfit photo ${index+1}`} draggable={false}/>
        {showTags?current.tags.map((tag,tagIndex)=>{const garment=garmentById.get(tag.closetItemId);if(!garment)return null;return <button key={`${tag.closetItemId}-${tagIndex}`} className={styles.hotspot} style={{left:`${tag.x*100}%`,top:`${tag.y*100}%`}} type="button" aria-label={`Open ${garment.label}`} onClick={(event)=>{event.stopPropagation();openTaggedItem(tag.closetItemId);}}>+</button>;}):null}
        {current.caption&&showCaption?<div className={styles.galleryCaptionPanel} onClick={(event)=>event.stopPropagation()}>{current.caption}</div>:null}
        {current.caption?<button className={styles.galleryCaptionToggle} type="button" aria-expanded={showCaption} onClick={(event)=>{event.stopPropagation();setShowCaption((value)=>!value);}}>Caption</button>:null}
      </div>
      {photos.length>1?<><button className={`${styles.galleryNav} ${styles.galleryPrev}`} type="button" aria-label="Previous Outfit photo" onClick={(event)=>{event.stopPropagation();animateStageMove(-1);}}>‹</button><button className={`${styles.galleryNav} ${styles.galleryNext}`} type="button" aria-label="Next Outfit photo" onClick={(event)=>{event.stopPropagation();animateStageMove(1);}}>›</button><span className={styles.galleryCounter}>{index+1} / {photos.length}</span></>:null}
      {current.tags.length?<button className={styles.galleryTagToggle} type="button" onClick={(event)=>{event.stopPropagation();setShowTags((value)=>!value);}}>{showTags?"Hide tags":"Show tags"}</button>:null}
    </div>
    {lightboxOpen?<div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={`Full-size Outfit photo ${index+1}`} onClick={()=>setLightboxOpen(false)}>
      <button className={styles.lightboxClose} type="button" aria-label="Close full-size photo" onClick={(event)=>{event.stopPropagation();setLightboxOpen(false);}}>×</button>
      <div style={{maxWidth:"100%",maxHeight:"100%",overflow:"auto",display:"grid",placeItems:"start center"}} onClick={(event)=>event.stopPropagation()}><img src={current.url} alt={`Outfit photo ${index+1} full size`} draggable={false} style={{display:"block",maxWidth:"calc(100vw - 32px)",width:"auto",height:"auto"}}/></div>
      {photos.length>1?<button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} type="button" aria-label="Previous photo" onClick={(event)=>{event.stopPropagation();move(-1);}}>‹</button>:null}
      {photos.length>1?<button className={`${styles.lightboxNav} ${styles.lightboxNext}`} type="button" aria-label="Next photo" onClick={(event)=>{event.stopPropagation();move(1);}}>›</button>:null}
      {photos.length>1?<span className={styles.lightboxCount}>{index+1} / {photos.length}</span>:null}
    </div>:null}
  </section>;
}
