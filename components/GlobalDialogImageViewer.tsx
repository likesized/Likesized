"use client";

import { useEffect, useState } from "react";
import { SwipeDismissImageLightbox } from "@/components/SwipeDismissImageLightbox";

type ViewerState={src:string;alt:string;objectUrl?:string};

function svgPreview(svg:SVGSVGElement):ViewerState{
  const clone=svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
  clone.querySelectorAll("image").forEach((image)=>{
    const href=image.getAttribute("href")||image.getAttribute("xlink:href");
    if(href){
      const absolute=new URL(href,window.location.origin).toString();
      image.setAttribute("href",absolute);
      image.removeAttribute("xlink:href");
    }
  });
  const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml"});
  const objectUrl=URL.createObjectURL(blob);
  return{src:objectUrl,alt:svg.getAttribute("aria-label")||"Expanded diagram",objectUrl};
}

export function GlobalDialogImageViewer(){
  const [viewer,setViewer]=useState<ViewerState|null>(null);

  useEffect(()=>{
    function open(event:MouseEvent){
      if(viewer)return;
      const target=event.target;
      if(!(target instanceof Element))return;
      if(target.closest("button,a"))return;
      const media=target.closest("img,svg");
      if(!(media instanceof HTMLImageElement||media instanceof SVGSVGElement))return;
      if(!media.closest("dialog,[role='dialog']"))return;
      if(media instanceof HTMLImageElement){
        const src=media.currentSrc||media.src;
        if(!src)return;
        setViewer({src,alt:media.alt||"Expanded image"});
        return;
      }
      setViewer(svgPreview(media));
    }
    document.addEventListener("click",open);
    return()=>document.removeEventListener("click",open);
  },[viewer]);

  function close(){
    setViewer((current)=>{
      if(current?.objectUrl)URL.revokeObjectURL(current.objectUrl);
      return null;
    });
  }

  useEffect(()=>()=>{if(viewer?.objectUrl)URL.revokeObjectURL(viewer.objectUrl);},[viewer]);

  return viewer?<SwipeDismissImageLightbox src={viewer.src} alt={viewer.alt} label="Full-size image" onClose={close}/>:null;
}
