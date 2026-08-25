"use client";

import { useEffect, useRef } from "react";
import styles from "./SwipeDismissImageLightbox.module.css";

export function SwipeDismissImageLightbox({ src, alt, label = "Image preview", onClose }: { src: string; alt: string; label?: string; onClose: () => void }) {
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function touchStart(event: React.TouchEvent) {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function touchEnd(event: React.TouchEvent) {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientY ?? start;
    const dy = end - start;
    if (dy >= 70) onClose();
  }

  return <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={label} onClick={onClose} onTouchStart={touchStart} onTouchEnd={touchEnd}>
    <div className={styles.card} onClick={(event) => event.stopPropagation()}>
      <button className={styles.close} type="button" aria-label="Close image preview" onClick={onClose}>×</button>
      <img src={src} alt={alt}/>
    </div>
  </div>;
}
