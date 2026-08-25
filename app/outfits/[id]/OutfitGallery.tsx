"use client";

import { useRef, useState } from "react";
import styles from "./outfitDetail.module.css";
import polishStyles from "./outfitPolish.module.css";

export type GalleryGarment = { id: string; label: string; detail: string; href: string; imageUrl?: string | null };
export type GalleryPhoto = { id: string; url: string; caption:string|null; tags: { closetItemId: string; x: number; y: number }[] };

export default function OutfitGallery({ photos, garments, canViewTags }: { photos: GalleryPhoto[]; garments: GalleryGarment[]; canViewTags: boolean }) {
  const [index, setIndex] = useState(0);
  const [showTags, setShowTags] = useState(true);
  const [showCaption,setShowCaption]=useState(false);
  const pointerStart = useRef<{x:number;y:number}|null>(null);
  const suppressClick = useRef(false);
  const current = photos[index] ?? null;
  const garmentById = new Map(garments.map((garment) => [garment.id, garment]));

  function move(delta:number){
    if(photos.length<2)return;
    setShowCaption(false);
    setIndex((currentIndex)=>(currentIndex+delta+photos.length)%photos.length);
  }
  function openTaggedItem(closetItemId:string){
    window.dispatchEvent(new CustomEvent("likesized:open-tagged-item",{detail:{closetItemId}}));
  }
  function pointerDown(event:React.PointerEvent<HTMLDivElement>){
    pointerStart.current={x:event.clientX,y:event.clientY};
    suppressClick.current=false;
  }
  function pointerUp(event:React.PointerEvent<HTMLDivElement>){
    const start=pointerStart.current;
    pointerStart.current=null;
    if(!start)return;
    const dx=event.clientX-start.x;
    const dy=event.clientY-start.y;
    if(Math.abs(dx)>=38&&Math.abs(dx)>Math.abs(dy)){
      suppressClick.current=true;
      move(dx<0?1:-1);
    }
  }

  if (!current) return <div className={styles.galleryEmpty}>No Outfit photo available.</div>;
  return <section className={styles.gallery} aria-label="Outfit photo gallery">
    <div
      className={styles.galleryStage}
      role="button"
      tabIndex={0}
      aria-label={photos.length>1?`Outfit photo ${index+1} of ${photos.length}. Click or swipe for the next photo.`:"Outfit photo"}
      onPointerDown={pointerDown}
      onPointerUp={pointerUp}
      onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}move(1);}}
      onKeyDown={(event)=>{if(event.key==="ArrowRight"||event.key==="Enter"||event.key===" "){event.preventDefault();move(1);}else if(event.key==="ArrowLeft"){event.preventDefault();move(-1);}}}
    >
      <div className={styles.galleryMedia}>
        <img className={styles.galleryMain} src={current.url} alt={`Outfit photo ${index+1}`} draggable={false}/>
        {canViewTags && showTags ? current.tags.map((tag, tagIndex) => {
          const garment = garmentById.get(tag.closetItemId);
          if (!garment) return null;
          return <button
            key={`${tag.closetItemId}-${tagIndex}`}
            className={styles.hotspot}
            style={{ left: `${tag.x*100}%`, top: `${tag.y*100}%` }}
            type="button"
            aria-label={`Open ${garment.label}`}
            onPointerDown={(event)=>event.stopPropagation()}
            onPointerUp={(event)=>event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); openTaggedItem(tag.closetItemId); }}
          >+</button>;
        }) : null}
        {current.caption&&showCaption?<div className={polishStyles.galleryCaptionPanel} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>event.stopPropagation()}>{current.caption}</div>:null}
      </div>
      {photos.length>1?<span className={styles.galleryCounter}>{index+1} / {photos.length}</span>:null}
      {canViewTags && current.tags.length ? <button className={styles.galleryTagToggle} type="button" onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event) => {event.stopPropagation();setShowTags((value) => !value);}}>{showTags ? "Hide tags" : "Show tags"}</button> : null}
      {current.caption?<button className={polishStyles.galleryCaptionToggle} type="button" aria-expanded={showCaption} onPointerDown={(event)=>event.stopPropagation()} onPointerUp={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();setShowCaption((value)=>!value);}}>Caption</button>:null}
    </div>
  </section>;
}
