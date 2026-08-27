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
  const [stageHeight,setStageHeight]=useState<number|null>(null);
  const [stageViewportWidth,setStageViewportWidth]=useState(0);
  const [loadedPhotoId,setLoadedPhotoId]=useState<string|null>(null);
  const [lightboxDragX,setLightboxDragX]=useState(0);
  const [lightboxDragY,setLightboxDragY]=useState(0);
  const [lightboxDragging,setLightboxDragging]=useState(false);
  const [lightboxAnimating,setLightboxAnimating]=useState(false);

  const stageStart=useRef<Point|null>(null);
  const stagePointerId=useRef<number|null>(null);
  const stageWidth=useRef(0);
  const stageElement=useRef<HTMLDivElement|null>(null);
  const activeImageElement=useRef<HTMLImageElement|null>(null);
  const preloadedFull=useRef(new Set<string>());
  const lightboxStart=useRef<Point|null>(null);
  const lightboxPointerId=useRef<number|null>(null);
  const lightboxWidth=useRef(0);
  const suppressClick=useRef(false);
  const suppressLightboxClick=useRef(false);
  const stageTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const lightboxTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const current=photos[index]??null;
  const previous=photos.length>1?photos[(index-1+photos.length)%photos.length]:null;
  const next=photos.length>1?photos[(index+1)%photos.length]:null;
  const garmentById=new Map(garments.map((garment)=>[garment.id,garment]));

  function move(delta:number){
    if(photos.length<2)return;
    setShowCaption(false);
    setIndex((currentIndex)=>(currentIndex+delta+photos.length)%photos.length);
  }
  function clearStageTimer(){if(stageTimer.current){clearTimeout(stageTimer.current);stageTimer.current=null;}}
  function clearLightboxTimer(){if(lightboxTimer.current){clearTimeout(lightboxTimer.current);lightboxTimer.current=null;}}
  function openTaggedItem(closetItemId:string){window.dispatchEvent(new CustomEvent("likesized:open-tagged-item",{detail:{closetItemId}}));}
  function syncStageHeight(image:HTMLImageElement|null,photoId:string|null){
    if(!image||!photoId)return;
    const height=Math.ceil(image.getBoundingClientRect().height);
    if(height<=0)return;
    const nextHeight=Math.max(220,height);
    setLoadedPhotoId(photoId);
    setStageHeight((currentHeight)=>currentHeight===nextHeight?currentHeight:nextHeight);
  }
  function preloadFullPhoto(url:string){
    if(!url||preloadedFull.current.has(url))return;
    preloadedFull.current.add(url);
    const image=new Image();
    image.decoding="async";
    image.src=url;
  }
  function primeFullPhotos(){
    if(!current)return;
    preloadFullPhoto(current.url);
    if(previous)preloadFullPhoto(previous.url);
    if(next)preloadFullPhoto(next.url);
  }
  function finishStageMove(delta:number,width:number){
    clearStageTimer();
    setStageAnimating(true);
    setStageDragX(delta>0?-width:width);
    stageTimer.current=setTimeout(()=>{
      move(delta);
      setStageAnimating(false);
      setStageDragX(0);
    },170);
  }
  function animateStageMove(delta:number){
    if(photos.length<2||stageAnimating)return;
    primeFullPhotos();
    const width=Math.max(stageViewportWidth||stageElement.current?.getBoundingClientRect().width||0,240);
    finishStageMove(delta,width);
  }
  function animateLightboxMove(delta:number){
    if(photos.length<2||lightboxAnimating)return;
    primeFullPhotos();
    clearLightboxTimer();
    const width=Math.max(lightboxWidth.current||window.innerWidth,320);
    setLightboxAnimating(true);
    setLightboxDragX(delta>0?-width:width);
    setLightboxDragY(0);
    lightboxTimer.current=setTimeout(()=>{
      move(delta);
      setLightboxAnimating(false);
      setLightboxDragX(0);
      setLightboxDragY(0);
    },170);
  }

  function pointerDown(event:React.PointerEvent<HTMLDivElement>){
    if(!event.isPrimary||stageAnimating)return;
    primeFullPhotos();
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
  function pointerUp(event:React.PointerEvent<HTMLDivElement>){
    const start=stageStart.current;
    if(!start||!event.isPrimary||stagePointerId.current!==event.pointerId)return;
    const dx=event.clientX-start.x;
    const dy=event.clientY-start.y;
    stageStart.current=null;
    stagePointerId.current=null;
    setStageDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const width=Math.max(stageWidth.current,240);
    const commit=photos.length>1&&Math.abs(dx)>=Math.min(90,width*.18)&&Math.abs(dx)>Math.abs(dy);
    if(!commit){setStageAnimating(true);setStageDragX(0);stageTimer.current=setTimeout(()=>setStageAnimating(false),180);return;}
    finishStageMove(dx<0?1:-1,width);
  }
  function cancelStagePointer(event:React.PointerEvent<HTMLDivElement>){
    if(stagePointerId.current!==event.pointerId)return;
    stageStart.current=null;
    stagePointerId.current=null;
    setStageDragging(false);
    setStageAnimating(true);
    setStageDragX(0);
    stageTimer.current=setTimeout(()=>setStageAnimating(false),180);
  }

  function lightboxPointerDown(event:React.PointerEvent<HTMLDivElement>){
    if(!event.isPrimary||lightboxAnimating)return;
    primeFullPhotos();
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
      clearLightboxTimer();
      setLightboxAnimating(true);
      setLightboxDragX(dx<0?-width:width);
      lightboxTimer.current=setTimeout(()=>{move(dx<0?1:-1);setLightboxAnimating(false);setLightboxDragX(0);setLightboxDragY(0);},170);
      return;
    }
    setLightboxAnimating(true);
    setLightboxDragX(0);
    setLightboxDragY(0);
    lightboxTimer.current=setTimeout(()=>setLightboxAnimating(false),180);
  }

  useEffect(()=>{
    if(!lightboxOpen)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    function keydown(event:KeyboardEvent){if(event.key==="Escape")setLightboxOpen(false);else if(event.key==="ArrowRight")animateLightboxMove(1);else if(event.key==="ArrowLeft")animateLightboxMove(-1);}
    window.addEventListener("keydown",keydown);
    return()=>{window.removeEventListener("keydown",keydown);document.body.style.overflow=previousOverflow;};
  },[lightboxOpen,photos.length,index,lightboxAnimating]);
  useEffect(()=>{if(current)setLoadedPhotoId(null);},[current?.id]);
  useEffect(()=>{
    const element=stageElement.current;
    if(!element)return;
    const updateWidth=()=>setStageViewportWidth(Math.ceil(element.getBoundingClientRect().width));
    updateWidth();
    if(typeof ResizeObserver==="undefined"){window.addEventListener("resize",updateWidth);return()=>window.removeEventListener("resize",updateWidth);}
    const observer=new ResizeObserver(updateWidth);
    observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const image=activeImageElement.current;
    if(!image||!current)return;
    const photoId=current.id;
    const measure=()=>syncStageHeight(image,photoId);
    if(image.complete)measure();
    const frame=requestAnimationFrame(measure);
    if(typeof ResizeObserver==="undefined"){
      window.addEventListener("resize",measure);
      return()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",measure);};
    }
    const observer=new ResizeObserver(()=>measure());
    observer.observe(image);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[current?.id,stageViewportWidth]);
  useEffect(()=>{
    const element=stageElement.current;
    if(!element||!current)return;
    if(typeof IntersectionObserver==="undefined"){preloadFullPhoto(current.url);return;}
    const observer=new IntersectionObserver((entries)=>{
      if(entries.some((entry)=>entry.isIntersecting)){
        primeFullPhotos();
        observer.disconnect();
      }
    },{rootMargin:"600px 0px"});
    observer.observe(element);
    return()=>observer.disconnect();
  },[current?.id,photos.length]);
  useEffect(()=>()=>{clearStageTimer();clearLightboxTimer();},[]);

  if(!current)return <div className={styles.galleryEmpty}>No Outfit photo available.</div>;
  const stageTransition=stageDragging||!stageAnimating?"none":"transform 170ms cubic-bezier(.22,.8,.3,1), opacity 170ms ease";
  const lightboxTransition=lightboxDragging||!lightboxAnimating?"none":"transform 170ms cubic-bezier(.22,.8,.3,1), opacity 170ms ease";
  const dismissProgress=Math.min(1,lightboxDragY/240);
  const stageOffset=Math.max(stageViewportWidth,stageWidth.current,1);
  const slideStyle=(position:-1|0|1):React.CSSProperties=>({position:"absolute",inset:0,display:"flex",justifyContent:"center",alignItems:"flex-start",transform:`translate3d(${position*stageOffset+stageDragX}px,0,0)`,transition:stageTransition,opacity:position===0?Math.max(.72,1-Math.abs(stageDragX)/Math.max(stageOffset,600)*.28):1,willChange:stageDragging||stageAnimating?"transform, opacity":undefined,pointerEvents:position===0?"auto":"none"});
  const lightboxSlideStyle=(position:-1|0|1):React.CSSProperties=>({gridArea:"1 / 1",maxWidth:"calc(100vw - 32px)",maxHeight:"calc(100dvh - 32px)",width:"auto",height:"auto",objectFit:"contain",transform:`translate3d(calc(${position*100}vw + ${lightboxDragX}px),${lightboxDragY}px,0) scale(${1-dismissProgress*.06})`,opacity:position===0?1-dismissProgress*.32:1,transition:lightboxTransition,touchAction:"none",willChange:lightboxDragging||lightboxAnimating?"transform, opacity":undefined,pointerEvents:position===0?"auto":"none"});

  return <section className={styles.gallery} aria-label="Outfit photo gallery">
    <div ref={stageElement} className={styles.galleryStage} style={{minHeight:stageHeight?`${stageHeight}px`:"clamp(260px,72vw,520px)",background:loadedPhotoId===current.id?"transparent":"var(--panel)",transition:"min-height 140ms ease, background 140ms ease",overflow:"hidden"}} role="button" tabIndex={0} aria-label={photos.length>1?`Outfit photo ${index+1} of ${photos.length}. Open full-size photo or use Previous and Next to change photos.`:"Open full-size Outfit photo"} onPointerEnter={primeFullPhotos} onFocus={primeFullPhotos} onPointerDown={pointerDown} onPointerMove={stagePointerMove} onPointerUp={pointerUp} onPointerCancel={cancelStagePointer} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}primeFullPhotos();setLightboxOpen(true);}} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();primeFullPhotos();setLightboxOpen(true);}else if(event.key==="ArrowRight"){event.preventDefault();animateStageMove(1);}else if(event.key==="ArrowLeft"){event.preventDefault();animateStageMove(-1);}}}>
      <div className={styles.galleryMedia} style={{position:"relative",width:"100%",minHeight:stageHeight?`${stageHeight}px`:"clamp(260px,72vw,520px)"}}>
        {previous&&stageViewportWidth?<div style={slideStyle(-1)} aria-hidden="true"><img className={styles.galleryMain} src={previous.url} alt="" draggable={false}/></div>:null}
        <div style={slideStyle(0)}><div style={{position:"relative",display:"inline-block",maxWidth:"100%",lineHeight:0}}><img ref={activeImageElement} className={styles.galleryMain} src={current.url} alt={`Outfit photo ${index+1}`} draggable={false} onLoad={(event)=>{syncStageHeight(event.currentTarget,current.id);requestAnimationFrame(()=>syncStageHeight(event.currentTarget,current.id));}}/>{showTags?current.tags.map((tag,tagIndex)=>{const garment=garmentById.get(tag.closetItemId);if(!garment)return null;return <button key={`${tag.closetItemId}-${tagIndex}`} className={styles.hotspot} style={{left:`${tag.x*100}%`,top:`${tag.y*100}%`}} type="button" aria-label={`Open ${garment.label}`} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();openTaggedItem(tag.closetItemId);}}>+</button>;}):null}{current.caption&&showCaption?<div className={styles.galleryCaptionPanel} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>event.stopPropagation()}>{current.caption}</div>:null}{current.caption?<button className={styles.galleryCaptionToggle} type="button" aria-expanded={showCaption} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setShowCaption((value)=>!value);}}>Caption</button>:null}</div></div>
        {next&&stageViewportWidth?<div style={slideStyle(1)} aria-hidden="true"><img className={styles.galleryMain} src={next.url} alt="" draggable={false}/></div>:null}
      </div>
      {photos.length>1?<><button className={`${styles.galleryNav} ${styles.galleryPrev}`} type="button" aria-label="Previous Outfit photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();animateStageMove(-1);}}>‹</button><button className={`${styles.galleryNav} ${styles.galleryNext}`} type="button" aria-label="Next Outfit photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();animateStageMove(1);}}>›</button><span className={styles.galleryCounter}>{index+1} / {photos.length}</span></>:null}{current.tags.length?<button className={styles.galleryTagToggle} type="button" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setShowTags((value)=>!value);}}>{showTags?"Hide tags":"Show tags"}</button>:null}
    </div>
    {lightboxOpen?<div className={styles.lightbox} style={{touchAction:"none",background:`rgba(18,18,18,${Math.max(.28,.92-dismissProgress*.62)})`,overflow:"hidden"}} role="dialog" aria-modal="true" aria-label={`Full-size Outfit photo ${index+1}`} onClick={()=>{if(suppressLightboxClick.current){suppressLightboxClick.current=false;return;}setLightboxOpen(false);}} onPointerDown={lightboxPointerDown} onPointerMove={lightboxPointerMove} onPointerUp={(event)=>finishLightboxPointer(event)} onPointerCancel={(event)=>finishLightboxPointer(event,true)}>
      <button className={styles.lightboxClose} type="button" aria-label="Close full-size photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setLightboxOpen(false);}}>×</button>
      <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center"}}>
        {previous?<img src={previous.url} alt="" draggable={false} aria-hidden="true" style={lightboxSlideStyle(-1)}/>:null}
        <img src={current.url} alt={`Outfit photo ${index+1} full size`} draggable={false} style={lightboxSlideStyle(0)} onClick={(event)=>event.stopPropagation()}/>
        {next?<img src={next.url} alt="" draggable={false} aria-hidden="true" style={lightboxSlideStyle(1)}/>:null}
      </div>
      {photos.length>1?<button className={`${styles.lightboxNav} ${styles.lightboxPrev}`} type="button" aria-label="Previous photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();animateLightboxMove(-1);}}>‹</button>:null}{photos.length>1?<button className={`${styles.lightboxNav} ${styles.lightboxNext}`} type="button" aria-label="Next photo" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();animateLightboxMove(1);}}>›</button>:null}{photos.length>1?<span className={styles.lightboxCount}>{index+1} / {photos.length}</span>:null}
    </div>:null}
  </section>;
}
