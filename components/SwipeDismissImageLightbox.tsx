"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SwipeDismissImageLightbox.module.css";

export function SwipeDismissImageLightbox({ src, alt, label = "Image preview", onClose }: { src: string; alt: string; label?: string; onClose: () => void }) {
  const dragStartY = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    dragStartY.current = event.clientY;
    pointerId.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || pointerId.current !== event.pointerId || dragStartY.current == null) return;
    setDragY(Math.max(0, event.clientY - dragStartY.current));
  }

  function finishPointer(event: React.PointerEvent<HTMLDivElement>, cancelled = false) {
    if (!event.isPrimary || pointerId.current !== event.pointerId || dragStartY.current == null) return;
    const dy = Math.max(0, event.clientY - dragStartY.current);
    dragStartY.current = null;
    pointerId.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!cancelled && dy >= 70) {
      onClose();
      return;
    }
    setDragY(0);
  }

  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
    <div
      className={styles.card}
      style={{ transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform 180ms ease", touchAction: "pan-x pinch-zoom" }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={(event) => finishPointer(event)}
      onPointerCancel={(event) => finishPointer(event, true)}
    >
      <button className={styles.close} type="button" aria-label="Close image preview" onClick={onClose}>×</button>
      <img src={src} alt={alt} draggable={false}/>
    </div>
  </div>;
}
