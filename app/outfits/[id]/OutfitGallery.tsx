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
  const [stageDragX,setStageDragX]=useState(0);
  const [stageDragging,setStageDragging]=useState(false);
  const [stageAnimating,setStageAnimating]=useState(false);
  const [lightboxDragX,setLightboxDragX]=useState(0);
  const [lightboxDragY,setLightboxDragY]=useState(0);
  const [lightboxDragging,setLightboxDragging]=useState(false);
  const [lightboxAnimating,setLightboxAnimating]=useState(false);

  const stageStart=useRef<Point|null>(null);
  const stagePointerId=useRef<number|null>(null);
  const stageWidth=useRef(0);
  const lightboxStart=useRef<Point|null>(null);
  const lightboxPointerId=useRef<number|null>(null);
  const lightboxWidth=useRef(0);
  const suppressClick=useRef(false);
  const suppressLightboxClick=useRef(false);
  const stageTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const lightboxTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const current=photos[index]??null;
  const garmentById=new Map(garments.map((garment)=>[garment.id,garment]));

  function move(delta:number){
    if(photos.length<2)return;
    setShowCaption(false);
    setIndex((currentIndex)=>(currentIndex+delta+photos.length)%photos.length);
  }
  function clearStageTimer(){if(stageTimer.current){clearTimeout(stageTimer.current);stageTimer.current=null;}}
  function clearLightboxTimer(){if(lightboxTimer.current){clearTimeout(lightboxTimer.current);lightboxTimer.current=null;}}
  function openTaggedItem(closetItemId:string){window.dispatchEvent(new CustomEvent("likesized:open-tagged-item",{detail:{closetItemId}}));}

  function stagePointerDown(event:React.PointerEvent<HTMLDivElement>){
    if(!event.isPrimary||stageAnimating)return;
    clearStageTimer();
    stageStart.current={x:event.clientX,y:event.clientY};
    stagePointerId.current=event.pointerId;
    stageWidth.current=event.currentTarget.getBoundingClientRect().width;
    suppressClick.current=false;
    setStageDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function stagePointerMove(event:React.PointerEvent<HTMLDivElement>){
    const start=stageStart.current;
    if(!start||!event.isPrimary||stagePointerId.current!==event.pointerId)return;
    const dx=event.clientX-start.x;
    const dy=event.clientY-start.y;
    if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)){
      suppressClick.current=true;
      setStageDragX(dx);
    }
  }
  function finishStagePointer(event:React.PointerEvent<HTMLDivElement>,cancelled=false){
    const start=stageStart.current;
    if(!start||!event.isPrimary||stagePointerId.current!==event.pointerId)return;
    const dx=event.clientX-start.x;
    const dy=event.clientY-start.y;
    stageStart.current=null;
    stagePointerId.current=null;
    setStageDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const width=Math.max(stageWidth.current,240);
    const commit=!cancelled&&photos.length>1&&Math.abs(dx)>=Math.min(90,width*.18)&&Math.abs(dx)>Math.abs(dy);
    if(!commit){setStageAnimating(true);setStageDragX(0);stageTimer.current=setTimeout(()=>setStageAnimating(false),180);return;}
    const delta=dx<0?1:-1;
    const exitX=dx<0?-width:width;
    setStageAnimating(true);
    setStageDragX(exitX);
    stageTimer.current=setTimeout(()=>{
      move(delta);
      setStageAnimating(false);
      setStageDragX(0);
    },160);
  }

  function lightboxPointerDown(event:React.PointerEvent<HTMLDivElement>){
    if(!event.isPrimary||lightboxAnimating)return;
    clearLightboxTimer();
    lightboxStart.current={x:event.clientX,y:event.clientY};
    lightboxPointerId.current=event.pointerId;
    lightboxWidth.current=event.currentTarget.getBoundingClientRect().width;
    suppressLightboxClick.current=false;
    setLightboxDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function lightboxPointerMove(event:React.PointerEvent<HTMLDivElement>){
    const start=lightboxStart.current;
    if(!start||!event.isPrimary||lightboxPointerId.current!==event.pointerId)return;
    const dx=event.clientX-start.x;
    const dy=event.clientY-start.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))>6)suppressLightboxClick.current=true;
    if(Math.abs(dx)>Math.abs(dy)&&photos.length>1){setLightboxDragX(dx);setLightboxDragY(0);return;}
    setLightboxDragX(0);
    setLightboxDragY(Math.max(0,dy));
  }
  function finishLightboxPointer(event:React.PointerEvent<HTMLDivElement>,cancelled=false){
    const start=lightboxStart.current;
    if(!start||!event.isPrimary||lightboxPointerId.current!==event.pointerId)return;
    const dx=event.clientX-start.x;
    const rawDy=event.clientY-start.y;
    const dy=Math.max(0,rawDy);
    lightboxStart.current=null;
    lightboxPointerId.current=null;
    setLightboxDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const width=Math.max(lightboxWidth.current,320);
    if(!cancelled&&dy>=Math.min(110,window.innerHeight*.14)&&dy>Math.abs(dx)){
      setLightboxAnimating(true);
      setLightboxDragY(Math.max(window.innerHeight,700));
      lightboxTimer.current=setTimeout(()=>{setLightboxOpen(false);setLightboxAnimating(false);setLightboxDragX(0);setLightboxDragY(0);},170);
      return;
    }
    if(!cancelled&&photos.length>1&&Math.abs(dx)>=Math.min(100,width*.16)&&Math.abs(dx)>Math.abs(rawDy)){
      const delta=dx<0?1:-1;
      setLightboxAnimating(true);
      setLightboxDragX(dx<0?-width:width);
      lightboxTimer.current=setTimeout(()=>{move(delta);setLightboxAnimating(false);setLightboxDragX(0);setLightboxDragY(0);},160);
      return;
    }
    setLightboxAnimating(true);
    setLightboxDragX(0);
    setLightboxDragY(0);
    lightboxTimer.current=setTimeout(()=>setLightboxAnimating(false),180);
  }

  useEffect(()=>{
    if(!lightboxOpen)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    function keydown(event:KeyboardEvent){if(event.key==="Escape")setLightboxOpen(false);else if(event.key==="ArrowRight")move(1);else if(event.key==="ArrowLeft")move(-1);}
    window.addEventListener("keydown",keydown);
    return()=>{window.removeEventListener("keydown",keydown);document.body.style.overflow=previous;};
  },[lightboxOpen,photos.length]);
  useEffect(()=>()=>{clearStageTimer();clearLightboxTimer();},[]);

  if(!current)return <div className={styles.galleryEmpty}>No Outfit photo available.</div>;
  const stageTransition=stageDragging||!stageAnimating?"none":"transform 160ms cubic-bezier(.22,.8,.3,1), opacity 160ms ease";
  const lightboxTransition=lightboxDragging||!lightboxAnimating?"none":"transform 170ms cubic-bezier(.22,.8,.3,1), opacity 170ms ease";
  const dismissProgress=Math.min(1,lightboxDragY/240);

  return <section className={styles.gallery} aria-label="Outfit photo gallery">
    <div className={styles.galleryStage} role="button" tabIndex={0} aria-label={photos.length>1?`Outfit photo ${index+1} of ${photos.length}. Open full-size photo or use Previous and Next to change photos.`:"Open full-size Outfit photo"} onPointerDown={stagePointerDown} onPointerMove={stagePointerMove} onPointerUp={(event)=>finishStagePointer(event)} onPointerCancel={(event)=>finishStagePointer(event,true)} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setLightboxOpen(true);}} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setLightboxOpen(true);}else if(event.key==="ArrowRight"){event.preventDefault();move(1);}else if(event.key==="ArrowLeft"){event.preventDefault();move(-1);}}}>
      <div className={styles.galleryMedia} style={{transform:`translate3d(${stageDragX}px,0,0)`,transition:stageTransition,opacity:Math.max(.72,1-Math.abs(stageDragX)/Math.max(stageWidth.current||600,600)*.28),willChange:stageDragging||stageAnimating?"transform, opacity":undefined}}><img className={styles.galleryMain} src={current.previewUrl??current.url} alt={`Outfit photo ${index+1}`} draggable={false}/>{showTags?current.tags.map((tag,tagIndex)=>{const garment=garmentById.get(tag.closetItemId);if(!garment)return null;return <button key={`${tag.closetItemId}-${tagIndex}`} className={styles.hotspot} style={{left:`${tag.x*100}%`,top:`${tag.y*100}%`}} type="button" aria-label={`Open ${garment.label}`} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();openTaggedItem(tag.closetItemId);}}>+</button>;}):null}{current.caption&&showCaption?<div className={styles.galleryCaptionPanel} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>event.stopPropagation()}>{current.caption}</div>:null}</div>
      {photos.length>1?<><button className={`${styles.galleryNav} ${styles.galleryPrev}`} type="button" aria-label="Previous Outfit photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();move(-1);}}>‹</button><button className={`${styles.galleryNav} ${styles.galleryNext}`} type="button" aria-label="Next Outfit photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();move(1);}}>›</button><span className={styles.galleryCounter}>{index+1} / {photos.length}</span></>:null}{current.tags.length?<button className={styles.galleryTagToggle} type="button" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setShowTags((value)=>!value);}}>{showTags?"Hide tags":"Show tags"}</button>:null}{current.caption?<button className={styles.galleryCaptionToggle} type="button" aria-expanded={showCaption} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setShowCaption((value)=>!value);}}>Caption</button>:null}
    </div>
    {lightboxOpen?<div className={styles.lightbox} style={{touchAction:"none",background:`rgba(18,18,18,${Math.max(.28,.92-dismissProgress*.62)})`}} role="dialog" aria-modal="true" aria-label={`Full-size Outfit photo ${index+1}`} onClick={()=>{if(suppressLightboxClick.current){suppressLightboxClick.current=false;return;}setLightboxOpen(false);}} onPointerDown={lightboxPointerDown} onPointerMove={lightboxPointerMove} onPointerUp={(event)=>finishLightboxPointer(event)} onPointerCancel={(event)=>finishLightboxPointer(event,true)}>
      <button className={styles.lightboxClose} type="button" aria-label="Close full-size photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setLightboxOpen(false);}}>×</button>{photos.length>1?<button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} type="button" aria-label="Previous photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();move(-1);}}>‹</button>:null}<img className={styles.lightboxImage} src={current.url} alt={`Outfit photo ${index+1} full size`} draggable={false} style={{transform:`translate3d(${lightboxDragX}px,${lightboxDragY}px,0) scale(${1-dismissProgress*.06})`,opacity:1-dismissProgress*.32,transition:lightboxTransition,touchAction:"none",willChange:lightboxDragging||lightboxAnimating?"transform, opacity":undefined}} onClick={(event)=>event.stopPropagation()}/>{photos.length>1?<button className={`${styles.lightboxNav} ${styles.lightboxNext}`} type="button" aria-label="Next photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();move(1);}}>›</button>:null}{photos.length>1?<span className={styles.lightboxCount}>{index+1} / {photos.length}</span>:null}
    </div>:null}
  </section>;
}
