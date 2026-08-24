"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../outfits.module.css";

export type GalleryGarment = { id: string; label: string; detail: string; href: string };
export type GalleryPhoto = { id: string; url: string; tags: { closetItemId: string; x: number; y: number }[] };

export default function OutfitGallery({ photos, garments, canViewTags }: { photos: GalleryPhoto[]; garments: GalleryGarment[]; canViewTags: boolean }) {
  const [index, setIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [activeGarmentId, setActiveGarmentId] = useState<string | null>(null);
  const photo = photos[index];
  const garmentById = new Map(garments.map((garment) => [garment.id, garment]));
  const tags = canViewTags ? photo?.tags ?? [] : [];
  return <div className={styles.gallery}>
    {photo ? <div className={styles.galleryMain}>
      <img src={photo.url} alt={`Outfit photo ${index + 1}`} />
      {showTags ? tags.map((tag) => <button type="button" key={tag.closetItemId} className={styles.viewerHotspot} style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }} aria-label={`View ${garmentById.get(tag.closetItemId)?.label ?? "tagged garment"}`} onClick={() => setActiveGarmentId(activeGarmentId === tag.closetItemId ? null : tag.closetItemId)} />) : null}
      {showTags && activeGarmentId && garmentById.get(activeGarmentId) ? <div className={styles.hotspotCard}>
        <strong>{garmentById.get(activeGarmentId)!.label}</strong>
        <span>{garmentById.get(activeGarmentId)!.detail}</span>
        <Link href={garmentById.get(activeGarmentId)!.href}>View Product →</Link>
      </div> : null}
    </div> : <div className={styles.photoFallback}>Photo unavailable</div>}
    <div className={styles.galleryToolbar}>
      {canViewTags && tags.length ? <button type="button" onClick={() => { setShowTags((value) => !value); setActiveGarmentId(null); }}>{showTags ? "Hide tagged items" : "View tagged items"}</button> : null}
      {photos.length > 1 ? <span>{index + 1} / {photos.length}</span> : null}
    </div>
    {photos.length > 1 ? <div className={styles.galleryThumbs}>{photos.map((item, photoIndex) => <button type="button" className={photoIndex === index ? styles.activeThumb : styles.thumb} key={item.id} onClick={() => { setIndex(photoIndex); setShowTags(false); setActiveGarmentId(null); }}><img src={item.url} alt={`View Outfit photo ${photoIndex + 1}`} /></button>)}</div> : null}
  </div>;
}
