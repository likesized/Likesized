"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishOutfit, saveOutfitDraft, savePublishedOutfit, type OutfitSaveResult } from "@/app/outfits/actions";
import { OUTFIT_OCCASIONS } from "@/lib/outfit-taxonomy";
import styles from "../outfits.module.css";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const DISPLAY_MAX_BYTES = 600 * 1024;
const FEED_MAX_BYTES = 220 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CLOSET_PAGE_SIZE = 12;

export type ClosetOption = {
  id: string;
  label: string;
  detail: string;
  brand: string;
  itemName: string;
  garmentType: string;
  garmentTypeLabel: string;
  category: string;
  categoryLabel: string;
  createdAt: string;
};

type Hotspot = { closetItemId: string; x: number; y: number };
type InitialPhoto = { id: string; url: string; isMain: boolean; sortOrder: number; tags: Hotspot[] };
export type InitialOutfit = {
  id: string;
  status: "draft" | "published";
  headline: string;
  story: string;
  commentsEnabled: boolean;
  closetItemIds: string[];
  occasions: string[];
  styleTags: string[];
  photos: InitialPhoto[];
};
type PhotoState = {
  key: string;
  existingId?: string;
  previewUrl: string;
  displayBlob?: Blob;
  feedBlob?: Blob;
  isMain: boolean;
  tags: Hotspot[];
};
type Drawable = ImageBitmap | HTMLImageElement;

type SaveKind = "draft" | "publish" | "update";

async function loadImage(file: File): Promise<Drawable> {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function dimensions(source: Drawable) {
  return source instanceof ImageBitmap
    ? { width: source.width, height: source.height }
    : { width: source.naturalWidth, height: source.naturalHeight };
}

function webpBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Photo conversion failed.")),
      "image/webp",
      quality,
    );
  });
}

async function optimize(source: Drawable, maxWidth: number, maxHeight: number, maxBytes: number) {
  const original = dimensions(source);
  const baseScale = Math.min(1, maxWidth / original.width, maxHeight / original.height);
  for (const scaleStep of [1, 0.85, 0.7, 0.55]) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(original.width * baseScale * scaleStep));
    canvas.height = Math.max(1, Math.round(original.height * baseScale * scaleStep));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Photo processing is unavailable.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.78, 0.68, 0.58, 0.48]) {
      const blob = await webpBlob(canvas, quality);
      if (blob.size <= maxBytes) return blob;
    }
  }
  throw new Error("This photo could not be reduced enough. Try a different photo.");
}

async function optimizeFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_INPUT_BYTES) {
    throw new Error("Choose a JPEG, PNG, or WebP photo no larger than 8 MB.");
  }
  const source = await loadImage(file);
  try {
    const [display, feed] = await Promise.all([
      optimize(source, 1600, 2000, DISPLAY_MAX_BYTES),
      optimize(source, 800, 1000, FEED_MAX_BYTES),
    ]);
    return { display, feed };
  } finally {
    if (source instanceof ImageBitmap) source.close();
  }
}

function normalizedStyle(value: string) {
  return value.replace(/^#+/, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function newKey() {
  return crypto.randomUUID().replaceAll("-", "");
}

export default function OutfitComposer({
  closet,
  initial,
  styleSuggestions = [],
}: {
  closet: ClosetOption[];
  initial?: InitialOutfit | null;
  styleSuggestions?: string[];
}) {
  const router = useRouter();
  const garmentSectionRef = useRef<HTMLDivElement>(null);
  const [postId, setPostId] = useState(initial?.id ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [story, setStory] = useState(initial?.story ?? "");
  const [commentsEnabled, setCommentsEnabled] = useState(initial?.commentsEnabled ?? true);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.closetItemIds ?? []));
  const [occasions, setOccasions] = useState<string[]>(initial?.occasions ?? []);
  const [styleTags, setStyleTags] = useState<string[]>(initial?.styleTags ?? []);
  const [styleDraft, setStyleDraft] = useState("");
  const [photos, setPhotos] = useState<PhotoState[]>(() =>
    (initial?.photos ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        key: `existing_${photo.id}`,
        existingId: photo.id,
        previewUrl: photo.url,
        isMain: photo.isMain,
        tags: photo.tags,
      })),
  );
  const [photoStatus, setPhotoStatus] = useState("");
  const [busyPhotos, setBusyPhotos] = useState(false);
  const [draggingPhotoKey, setDraggingPhotoKey] = useState<string | null>(null);
  const [tagPhotoKey, setTagPhotoKey] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<{ photoKey: string; closetItemId: string } | null>(null);
  const [dragHotspot, setDragHotspot] = useState<{ photoKey: string; closetItemId: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [garmentModal, setGarmentModal] = useState(false);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [savingKind, setSavingKind] = useState<SaveKind | null>(null);
  const [occasionSecondOpen, setOccasionSecondOpen] = useState((initial?.occasions.length ?? 0) > 1);
  const [closetSearch, setClosetSearch] = useState("");
  const [closetCategory, setClosetCategory] = useState("");
  const [closetType, setClosetType] = useState("");
  const [closetBrand, setClosetBrand] = useState("");
  const [closetSort, setClosetSort] = useState<"recent" | "brand" | "type">("recent");
  const [closetVisibleCount, setClosetVisibleCount] = useState(CLOSET_PAGE_SIZE);
  const [isPending, startTransition] = useTransition();

  const isPublished = initial?.status === "published";
  const closetById = useMemo(() => new Map(closet.map((item) => [item.id, item])), [closet]);
  const selectedOptions = useMemo(
    () => [...selected].map((id) => closetById.get(id)).filter((item): item is ClosetOption => Boolean(item)),
    [selected, closetById],
  );
  const mainPhoto = photos.find((photo) => photo.isMain) ?? photos[0];
  const tagPhoto = photos.find((photo) => photo.key === tagPhotoKey) ?? photos[0] ?? null;
  const previewPhoto = photos[previewIndex] ?? photos[0] ?? null;

  const categoryOptions = useMemo(() => [...new Map(closet.map((item) => [item.category, item.categoryLabel])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [closet]);
  const typeOptions = useMemo(() => [...new Map(closet.filter((item) => !closetCategory || item.category === closetCategory).map((item) => [item.garmentType, item.garmentTypeLabel])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [closet, closetCategory]);
  const brandOptions = useMemo(() => [...new Set(closet.map((item) => item.brand))].sort((a, b) => a.localeCompare(b)), [closet]);

  const filteredCloset = useMemo(() => {
    const query = closetSearch.trim().toLowerCase();
    const next = closet.filter((item) => {
      if (closetCategory && item.category !== closetCategory) return false;
      if (closetType && item.garmentType !== closetType) return false;
      if (closetBrand && item.brand !== closetBrand) return false;
      if (query && !`${item.brand} ${item.itemName} ${item.garmentTypeLabel} ${item.detail}`.toLowerCase().includes(query)) return false;
      return true;
    });
    next.sort((a, b) => {
      if (closetSort === "brand") return a.brand.localeCompare(b.brand) || a.itemName.localeCompare(b.itemName);
      if (closetSort === "type") return a.garmentTypeLabel.localeCompare(b.garmentTypeLabel) || a.brand.localeCompare(b.brand);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return next;
  }, [closet, closetBrand, closetCategory, closetSearch, closetSort, closetType]);

  const suggestedStyles = useMemo(() => {
    const query = normalizedStyle(styleDraft);
    if (!query) return [];
    return styleSuggestions
      .filter((tag) => !styleTags.some((chosen) => normalizedStyle(chosen) === normalizedStyle(tag)) && normalizedStyle(tag).startsWith(query))
      .slice(0, 6);
  }, [styleDraft, styleSuggestions, styleTags]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptLinks = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      setLeaveHref(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", interceptLinks, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", interceptLinks, true);
    };
  }, [dirty]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; closetItemId?: string } | null;
      if (!payload || payload.type !== "likesized:outfit-garment-saved" || !payload.closetItemId) return;
      setGarmentModal(false);
      router.refresh();
      setSelected((current) => {
        if (current.has(payload.closetItemId!)) return current;
        if (current.size >= 6) {
          setMessage("Garment added to your Closet. This Outfit already has 6 items—remove one before adding it.");
          return current;
        }
        const next = new Set(current);
        next.add(payload.closetItemId!);
        setMessage("Garment added to this Outfit.");
        setDirty(true);
        return next;
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  useEffect(() => {
    if (photos.length === 0) {
      setTagPhotoKey(null);
      setPreviewIndex(0);
      return;
    }
    if (!tagPhotoKey || !photos.some((photo) => photo.key === tagPhotoKey)) setTagPhotoKey(photos[0].key);
    if (previewIndex >= photos.length) setPreviewIndex(0);
  }, [photos, previewIndex, tagPhotoKey]);

  function mark() {
    setDirty(true);
    setMessage(null);
  }

  function updateSelected(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) {
        if (next.size >= 6) {
          setMessage("You can add up to 6 items to an Outfit.");
          return current;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
    if (!checked) {
      setPhotos((current) => current.map((photo) => ({
        ...photo,
        tags: photo.tags.filter((tag) => tag.closetItemId !== id),
      })));
    }
    mark();
  }

  function setPrimaryOccasion(value: string) {
    if (!value) {
      setOccasions([]);
      setOccasionSecondOpen(false);
    } else {
      setOccasions((current) => [value, ...current.slice(1).filter((item) => item !== value)]);
    }
    mark();
  }

  function setSecondOccasion(value: string) {
    if (!value) {
      setOccasions((current) => current.slice(0, 1));
      setOccasionSecondOpen(false);
    } else {
      setOccasions((current) => [current[0], value].filter(Boolean));
    }
    mark();
  }

  function addStyleTag(value = styleDraft) {
    const display = value.replace(/^#+/, "").trim().slice(0, 30);
    const normalized = normalizedStyle(display);
    if (!display || !normalized || styleTags.length >= 3 || styleTags.some((tag) => normalizedStyle(tag) === normalized)) return;
    setStyleTags((current) => [...current, display]);
    setStyleDraft("");
    mark();
  }

  function removeStyleTag(value: string) {
    setStyleTags((current) => current.filter((tag) => tag !== value));
    mark();
  }

  async function makePhoto(file: File, isMain: boolean): Promise<PhotoState> {
    const { display, feed } = await optimizeFile(file);
    return {
      key: newKey(),
      previewUrl: URL.createObjectURL(display),
      displayBlob: display,
      feedBlob: feed,
      isMain,
      tags: [],
    };
  }

  async function chooseCover(file?: File) {
    if (!file) return;
    setBusyPhotos(true);
    setPhotoStatus("Preparing cover photo…");
    try {
      const next = await makePhoto(file, true);
      setPhotos((current) => {
        const old = current.find((photo) => photo.isMain);
        if (old && !old.existingId && old.previewUrl.startsWith("blob:")) URL.revokeObjectURL(old.previewUrl);
        return [next, ...current.filter((photo) => !photo.isMain).map((photo) => ({ ...photo, isMain: false }))].slice(0, 6);
      });
      setPhotoStatus("Cover photo ready.");
      mark();
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "Photo preparation failed.");
    } finally {
      setBusyPhotos(false);
    }
  }

  async function chooseAdditional(files: FileList | null) {
    if (!files?.length) return;
    setBusyPhotos(true);
    setPhotoStatus("Preparing additional photos…");
    try {
      const available = Math.max(0, 6 - photos.length);
      const chosen = [...files].slice(0, available);
      const next = await Promise.all(chosen.map((file, index) => makePhoto(file, photos.length === 0 && index === 0)));
      setPhotos((current) => [...current, ...next].slice(0, 6));
      setPhotoStatus(`${next.length} additional ${next.length === 1 ? "photo" : "photos"} ready.`);
      mark();
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "Photo preparation failed.");
    } finally {
      setBusyPhotos(false);
    }
  }

  function removePhoto(key: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.key === key);
      if (removed && !removed.existingId && removed.previewUrl.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
      const next = current.filter((photo) => photo.key !== key);
      if (removed?.isMain && next.length) next[0] = { ...next[0], isMain: true };
      return next;
    });
    mark();
  }

  function setCover(key: string) {
    setPhotos((current) => {
      const chosen = current.find((photo) => photo.key === key);
      if (!chosen) return current;
      return [{ ...chosen, isMain: true }, ...current.filter((photo) => photo.key !== key).map((photo) => ({ ...photo, isMain: false }))];
    });
    mark();
  }

  function dropPhoto(targetKey: string) {
    if (!draggingPhotoKey || draggingPhotoKey === targetKey) return;
    setPhotos((current) => {
      const main = current.find((photo) => photo.isMain);
      const extras = current.filter((photo) => !photo.isMain);
      const from = extras.findIndex((photo) => photo.key === draggingPhotoKey);
      const to = extras.findIndex((photo) => photo.key === targetKey);
      if (from < 0 || to < 0) return current;
      const [moved] = extras.splice(from, 1);
      extras.splice(to, 0, moved);
      return main ? [main, ...extras] : extras;
    });
    setDraggingPhotoKey(null);
    mark();
  }

  function setHotspot(photoKey: string, closetItemId: string, x: number, y: number) {
    setPhotos((current) => current.map((photo) => photo.key === photoKey ? {
      ...photo,
      tags: [
        ...photo.tags.filter((tag) => tag.closetItemId !== closetItemId),
        { closetItemId, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) },
      ],
    } : photo));
  }

  function placeHotspot(photoKey: string, event: React.MouseEvent<HTMLDivElement>) {
    if (!activeTag || activeTag.photoKey !== photoKey) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHotspot(photoKey, activeTag.closetItemId, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
    setActiveTag(null);
    mark();
  }

  function dragDot(event: React.PointerEvent<HTMLButtonElement>, photoKey: string, closetItemId: string) {
    if (dragHotspot?.photoKey !== photoKey || dragHotspot.closetItemId !== closetItemId) return;
    const box = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!box) return;
    setHotspot(photoKey, closetItemId, (event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
  }

  function removeHotspot(photoKey: string, closetItemId: string) {
    setPhotos((current) => current.map((photo) => photo.key === photoKey ? {
      ...photo,
      tags: photo.tags.filter((tag) => tag.closetItemId !== closetItemId),
    } : photo));
    mark();
  }

  function copyCoverTags(photoKey: string) {
    const source = photos.find((photo) => photo.isMain);
    if (!source) return;
    setPhotos((current) => current.map((photo) => photo.key === photoKey ? {
      ...photo,
      tags: source.tags.map((tag) => ({ ...tag })),
    } : photo));
    mark();
  }

  function buildFormData() {
    const formData = new FormData();
    if (postId) formData.set("post_id", postId);
    formData.set("headline", headline);
    formData.set("story", story);
    formData.set("comments_enabled", String(commentsEnabled));
    for (const id of selected) formData.append("closet_item_id", id);
    for (const occasion of occasions) formData.append("occasion", occasion);
    for (const tag of styleTags) formData.append("style_tag", tag);
    formData.set("photo_manifest", JSON.stringify(photos.map((photo) => ({
      key: photo.key,
      existingId: photo.existingId,
      isMain: photo.isMain,
      tags: photo.tags,
    }))));
    for (const photo of photos) {
      if (!photo.existingId && photo.displayBlob && photo.feedBlob) {
        formData.append(`photo_display__${photo.key}`, new File([photo.displayBlob], "display.webp", { type: "image/webp" }));
        formData.append(`photo_feed__${photo.key}`, new File([photo.feedBlob], "feed.webp", { type: "image/webp" }));
      }
    }
    return formData;
  }

  async function runSave(kind: SaveKind, destination?: string) {
    setMessage(kind === "draft" ? "Saving draft…" : kind === "publish" ? "Publishing Outfit…" : "Saving changes…");
    setSavingKind(kind);
    const action = kind === "draft" ? saveOutfitDraft : kind === "publish" ? publishOutfit : savePublishedOutfit;
    const result: OutfitSaveResult = await action(buildFormData());
    if (!result.ok || !result.postId) {
      setSavingKind(null);
      setMessage(result.error ?? "That Outfit could not be saved.");
      return;
    }
    setPostId(result.postId);
    setDirty(false);
    if (destination) {
      window.location.assign(destination);
      return;
    }
    if (kind === "draft") window.location.assign(`/outfits/new?draft=${result.postId}&saved=1`);
    else window.location.assign(`/outfits/${result.postId}?${kind === "publish" ? "published" : "updated"}=1`);
  }

  function save(kind: SaveKind, destination?: string) {
    startTransition(() => { void runSave(kind, destination); });
  }

  const readyToPreview = Boolean(
    headline.trim()
    && photos.length >= 1
    && selected.size >= 1
    && selected.size <= 6
    && occasions.length >= 1
    && occasions.length <= 2
    && !busyPhotos,
  );

  function requestPreview() {
    if (!readyToPreview) {
      setMessage("Add a cover photo, headline, at least one item, and an Occasion before previewing.");
      return;
    }
    setPreviewIndex(0);
    setPreview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (preview) {
    const previewOccasions = occasions.map((key) => OUTFIT_OCCASIONS.find((item) => item.value === key)?.label ?? key);
    return <section className={styles.previewShell}>
      <div className={styles.previewTop}>
        <div><span className="eyebrow">PREVIEW OUTFIT</span><h1>{headline}</h1></div>
        <span className={styles.previewBadge}>Not live yet</span>
      </div>
      <div className={styles.previewLayout}>
        <div className={styles.previewGallery}>
          {previewPhoto ? <div className={styles.previewMain}>
            <img src={previewPhoto.previewUrl} alt={`Outfit preview photo ${previewIndex + 1}`} />
            {previewPhoto.tags.map((tag) => <span key={tag.closetItemId} className={styles.previewDot} style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }} />)}
            {photos.length > 1 ? <>
              <button className={`${styles.previewArrow} ${styles.previewArrowLeft}`} type="button" aria-label="Previous photo" onClick={() => setPreviewIndex((current) => (current - 1 + photos.length) % photos.length)}>‹</button>
              <button className={`${styles.previewArrow} ${styles.previewArrowRight}`} type="button" aria-label="Next photo" onClick={() => setPreviewIndex((current) => (current + 1) % photos.length)}>›</button>
            </> : null}
          </div> : null}
          {photos.length > 1 ? <div className={styles.previewThumbs}>{photos.map((photo, index) => <button type="button" className={index === previewIndex ? styles.previewThumbActive : styles.previewThumb} key={photo.key} onClick={() => setPreviewIndex(index)}><img src={photo.previewUrl} alt={`View preview photo ${index + 1}`} /></button>)}</div> : null}
        </div>
        <article className={styles.previewStory}>
          <div className={styles.pills}>{previewOccasions.map((label) => <span key={label}>{label}</span>)}</div>
          {styleTags.length ? <div className={styles.styleLine}>{styleTags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
          {story ? <p className={styles.storyText}>{story}</p> : null}
          <div><h3>Explore This Look</h3><div className={styles.previewItemList}>{selectedOptions.map((item) => <div className={styles.tag} key={item.id}><strong>{item.label}</strong><span>{item.detail}</span></div>)}</div></div>
        </article>
      </div>
      {message ? <div className={message.includes("…") ? "authMessage" : "authMessage error"}>{message}</div> : null}
      <div className={styles.publishBar}>
        <button type="button" className={styles.quietButton} onClick={() => setPreview(false)}>← Back to Edit</button>
        <button type="button" className={styles.compactSecondary} disabled={isPending} onClick={() => save("draft")}>{savingKind === "draft" ? "Saving…" : "Save Draft"}</button>
        <button type="button" className={styles.compactPrimary} disabled={isPending} onClick={() => save("publish")}>{savingKind === "publish" ? "Publishing…" : "Publish Outfit"}</button>
      </div>
    </section>;
  }

  return <>
    <section className={styles.composer}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">1 · PHOTOS</span><h2>Add your photos.</h2></div></div>
        <div className={styles.uploadGrid}>
          <label className={styles.uploadBox}>
            <strong>Cover photo (required)</strong>
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busyPhotos} onChange={(event) => { void chooseCover(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
          </label>
          <label className={styles.uploadBox}>
            <strong>Additional photos (optional)</strong>
            <span>Upload up to 5 additional photos.</span>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busyPhotos || photos.length >= 6} onChange={(event) => { void chooseAdditional(event.currentTarget.files); event.currentTarget.value = ""; }} />
          </label>
        </div>
        {photoStatus ? <span className="fieldHelp" aria-live="polite">{photoStatus}</span> : null}
        {photos.length ? <div className={styles.photoManager}>{photos.map((photo, index) => <article
          className={styles.photoManagerCard}
          key={photo.key}
          draggable={!photo.isMain}
          onDragStart={() => setDraggingPhotoKey(photo.key)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => dropPhoto(photo.key)}
          onDragEnd={() => setDraggingPhotoKey(null)}
        >
          <img src={photo.previewUrl} alt={photo.isMain ? "Cover photo" : `Additional photo ${index}`} />
          <div className={styles.photoManagerMeta}>
            <strong>{photo.isMain ? "Cover photo" : `Additional photo ${index}`}</strong>
            {!photo.isMain ? <span className={styles.dragHint}>↕ Drag to reorder</span> : null}
          </div>
          <div className={styles.photoManagerActions}>
            {!photo.isMain ? <button type="button" onClick={() => setCover(photo.key)}>Set as cover</button> : null}
            <button type="button" onClick={() => removePhoto(photo.key)}>Remove</button>
          </div>
        </article>)}</div> : null}
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">2 · THE POST</span><h2>Tell people about the look.</h2></div></div>
        <label>Headline <span className={styles.counter}>{headline.length}/100</span><input value={headline} maxLength={100} required placeholder="Give your outfit a title" onChange={(event) => { setHeadline(event.target.value); mark(); }} /></label>
        <label>Outfit Story <span className="muted inlineMuted">optional</span> <span className={styles.counter}>{story.length}/5,000</span><textarea value={story} rows={7} maxLength={5000} placeholder="Share the details, inspiration, styling choices, or anything else you want people to know about the look." onChange={(event) => { setStory(event.target.value); mark(); }} /></label>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">3 · OCCASION & STYLE</span></div></div>
        <div className={styles.simpleFields}>
          <label>Occasion (required)<select value={occasions[0] ?? ""} onChange={(event) => setPrimaryOccasion(event.target.value)}><option value="">Choose an occasion</option>{OUTFIT_OCCASIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
          {occasionSecondOpen || occasions.length > 1 ? <label>Second occasion <span className="muted inlineMuted">optional</span><select value={occasions[1] ?? ""} onChange={(event) => setSecondOccasion(event.target.value)}><option value="">None</option>{OUTFIT_OCCASIONS.filter((item) => item.value !== occasions[0]).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label> : occasions.length === 1 ? <button type="button" className={styles.quietAdd} onClick={() => setOccasionSecondOpen(true)}>+ Add another occasion</button> : null}
        </div>
        <div className={styles.styleTagEditor}>
          <label>Style tags <span className="muted inlineMuted">optional</span><input value={styleDraft} maxLength={30} placeholder="Add a style tag" disabled={styleTags.length >= 3} onChange={(event) => setStyleDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addStyleTag(); } }} /><span className="fieldHelp">Up to 3</span></label>
          {suggestedStyles.length ? <div className={styles.styleSuggestions}>{suggestedStyles.map((tag) => <button type="button" key={tag} onClick={() => addStyleTag(tag)}>#{tag}</button>)}</div> : null}
          {styleTags.length ? <div className={styles.styleTags}>{styleTags.map((tag) => <button type="button" key={tag} onClick={() => removeStyleTag(tag)}>#{tag} ×</button>)}</div> : null}
        </div>
      </div>

      <div className={styles.sectionCard} ref={garmentSectionRef}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">4 · ITEMS IN THIS OUTFIT</span><h2>Choose what you’re wearing.</h2></div></div>
        {selectedOptions.length ? <div className={styles.selectedCloset}><div className={styles.selectedClosetHeader}><strong>Selected for this Outfit</strong><span>{selectedOptions.length}/6</span></div><div className={styles.selectedClosetItems}>{selectedOptions.map((item) => <button type="button" key={item.id} onClick={() => updateSelected(item.id, false)}><span><strong>{item.label}</strong><small>{item.detail}</small></span><b>×</b></button>)}</div></div> : null}
        <div className={styles.closetToolbar}>
          <input aria-label="Search your Closet" placeholder="Search your Closet" value={closetSearch} onChange={(event) => { setClosetSearch(event.target.value); setClosetVisibleCount(CLOSET_PAGE_SIZE); }} />
          <select aria-label="Filter by category" value={closetCategory} onChange={(event) => { setClosetCategory(event.target.value); setClosetType(""); setClosetVisibleCount(CLOSET_PAGE_SIZE); }}><option value="">All categories</option>{categoryOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
          <select aria-label="Filter by garment type" value={closetType} onChange={(event) => { setClosetType(event.target.value); setClosetVisibleCount(CLOSET_PAGE_SIZE); }}><option value="">All garment types</option>{typeOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
          <select aria-label="Filter by brand" value={closetBrand} onChange={(event) => { setClosetBrand(event.target.value); setClosetVisibleCount(CLOSET_PAGE_SIZE); }}><option value="">All brands</option>{brandOptions.map((brand) => <option value={brand} key={brand}>{brand}</option>)}</select>
          <select aria-label="Sort Closet" value={closetSort} onChange={(event) => setClosetSort(event.target.value as "recent" | "brand" | "type")}><option value="recent">Recently added</option><option value="brand">Brand A–Z</option><option value="type">Garment type</option></select>
        </div>
        <div className={styles.closetPickerTopline}><span>{filteredCloset.length} {filteredCloset.length === 1 ? "item" : "items"}</span><button type="button" className={styles.quietAdd} onClick={() => setGarmentModal(true)}>+ Add a missing garment</button></div>
        {filteredCloset.length ? <div className={styles.choices}>{filteredCloset.slice(0, closetVisibleCount).map((item) => <label className={styles.choice} key={item.id}><input type="checkbox" checked={selected.has(item.id)} disabled={!selected.has(item.id) && selected.size >= 6} onChange={(event) => updateSelected(item.id, event.target.checked)} /><span><strong>{item.label}</strong><small>{item.detail} · {item.garmentTypeLabel}</small></span></label>)}</div> : <div className={styles.inlineEmpty}>No Closet items match those filters.</div>}
        {closetVisibleCount < filteredCloset.length ? <button type="button" className={styles.loadMore} onClick={() => setClosetVisibleCount((count) => count + CLOSET_PAGE_SIZE)}>Load more</button> : null}
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">5 · PHOTO TAGS</span><h2>Photo tags <span className="muted inlineMuted">optional</span></h2></div></div>
        {!photos.length ? <div className={styles.inlineEmpty}>Add photos first.</div> : !selectedOptions.length ? <div className={styles.taggingEmpty}><span>Select the items in this Outfit first.</span><button type="button" className={styles.quietAdd} onClick={() => garmentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Select items</button></div> : <>
          <div className={styles.tagPhotoRail}>{photos.map((photo, index) => <button type="button" className={tagPhoto?.key === photo.key ? styles.tagPhotoThumbActive : styles.tagPhotoThumb} key={photo.key} onClick={() => { setTagPhotoKey(photo.key); setActiveTag(null); }}><img src={photo.previewUrl} alt={photo.isMain ? "Cover photo" : `Additional photo ${index}`} /><span>{photo.isMain ? "Cover" : `${index}`}</span></button>)}</div>
          {tagPhoto ? <div className={styles.tagWorkspace}>
            <div className={styles.tagWorkspaceImage} onClick={(event) => placeHotspot(tagPhoto.key, event)} role={activeTag?.photoKey === tagPhoto.key ? "button" : undefined}>
              <img src={tagPhoto.previewUrl} alt="Photo being tagged" />
              {tagPhoto.tags.map((tag) => <button
                type="button"
                className={styles.hotspotDot}
                key={tag.closetItemId}
                style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }}
                title={`${closetById.get(tag.closetItemId)?.label ?? "Tagged item"} — drag to reposition`}
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragHotspot({ photoKey: tagPhoto.key, closetItemId: tag.closetItemId }); }}
                onPointerMove={(event) => dragDot(event, tagPhoto.key, tag.closetItemId)}
                onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); setDragHotspot(null); mark(); }}
              />)}
            </div>
            <div className={styles.tagWorkspaceControls}>
              <p>Choose an item, then click the photo where it appears. Drag a dot to move it.</p>
              {!tagPhoto.isMain && mainPhoto?.tags.length ? <button type="button" className={styles.quietAdd} onClick={() => copyCoverTags(tagPhoto.key)}>Use cover-photo tags</button> : null}
              <div className={styles.hotspotChoices}>{selectedOptions.map((item) => {
                const placed = tagPhoto.tags.some((tag) => tag.closetItemId === item.id);
                const active = activeTag?.photoKey === tagPhoto.key && activeTag.closetItemId === item.id;
                return <div className={styles.hotspotChoiceWrap} key={item.id}><button type="button" className={active ? styles.hotspotActive : placed ? styles.hotspotPlaced : undefined} onClick={() => setActiveTag({ photoKey: tagPhoto.key, closetItemId: item.id })}>{placed ? "✓ " : "+ "}{item.label}</button>{placed ? <button type="button" aria-label={`Remove ${item.label} tag`} onClick={() => removeHotspot(tagPhoto.key, item.id)}>×</button> : null}</div>;
              })}</div>
              {activeTag?.photoKey === tagPhoto.key ? <strong className={styles.tapPrompt}>Click the photo to place this item.</strong> : null}
            </div>
          </div> : null}
        </>}
      </div>

      <div className={styles.sectionCard}>
        <label className={styles.commentToggle}><input type="checkbox" checked={commentsEnabled} onChange={(event) => { setCommentsEnabled(event.target.checked); mark(); }} /><span><strong>Comments</strong><small>Allow people to comment on this Outfit</small></span></label>
      </div>

      {message ? <div className={savingKind ? "authMessage" : message.includes("saved") || message.includes("added") ? "authMessage" : "authMessage error"} aria-live="polite">{message}</div> : null}
      <div className={styles.composerActions}>
        {isPublished ? <button type="button" className={styles.compactPrimary} disabled={isPending || busyPhotos} onClick={() => save("update")}>{savingKind === "update" ? "Saving…" : "Save Changes"}</button> : <><button type="button" className={styles.compactSecondary} disabled={isPending || busyPhotos} onClick={() => save("draft")}>{savingKind === "draft" ? "Saving…" : "Save Draft"}</button><button type="button" className={styles.compactPrimary} disabled={isPending || busyPhotos} onClick={requestPreview}>Preview Outfit</button></>}
      </div>
    </section>

    {garmentModal ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Add a missing Closet garment"><div className={styles.garmentModal}><div className={styles.modalHeader}><div><span className="eyebrow">ADD A GARMENT</span><strong>Add it without leaving your Outfit.</strong></div><button type="button" aria-label="Close" onClick={() => setGarmentModal(false)}>×</button></div><iframe src="/closet/add?embed=outfit" title="Add a Fit Report" /></div></div> : null}

    {leaveHref ? <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Unsaved Outfit"><div className={styles.leaveModal}><h2>Save your work?</h2><p>You have unsaved changes to this Outfit.</p><div className={styles.leaveActions}><button type="button" className={styles.compactPrimary} disabled={isPending} onClick={() => save(isPublished ? "update" : "draft", leaveHref)}>{isPublished ? "Save Changes" : "Save Draft"}</button><button type="button" className={styles.compactSecondary} onClick={() => { setDirty(false); window.location.assign(leaveHref); }}>Leave Without Saving</button><button type="button" className={styles.quietButton} onClick={() => setLeaveHref(null)}>Keep Editing</button></div></div></div> : null}
  </>;
}
