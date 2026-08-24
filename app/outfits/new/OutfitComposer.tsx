"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishOutfit, saveOutfitDraft, savePublishedOutfit, type OutfitSaveResult } from "@/app/outfits/actions";
import styles from "../outfits.module.css";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const DISPLAY_MAX_BYTES = 600 * 1024;
const FEED_MAX_BYTES = 220 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const OCCASIONS = [
  ["everyday", "Everyday"], ["work", "Work"], ["business_casual", "Business Casual"], ["business_formal", "Business Formal"],
  ["school_campus", "School/Campus"], ["brunch", "Brunch"], ["date_night", "Date Night"], ["dinner", "Dinner"],
  ["night_out", "Night Out"], ["party", "Party"], ["wedding_guest", "Wedding Guest"], ["formal_event", "Formal Event"],
  ["concert", "Concert"], ["festival", "Festival"], ["beach", "Beach"], ["poolside", "Poolside"],
  ["vacation_resort", "Vacation/Resort"], ["travel", "Travel"], ["gym_workout", "Gym/Workout"], ["golf", "Golf"],
  ["outdoors", "Outdoors"], ["lounge_home", "Lounge/Home"], ["running_errands", "Running Errands"], ["holiday_special_occasion", "Holiday/Special Occasion"],
] as const;

export type ClosetOption = {
  id: string;
  label: string;
  detail: string;
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

async function loadImage(file: File): Promise<Drawable> {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally { URL.revokeObjectURL(url); }
}
function dimensions(source: Drawable) { return source instanceof ImageBitmap ? { width: source.width, height: source.height } : { width: source.naturalWidth, height: source.naturalHeight }; }
function webpBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Photo conversion failed.")), "image/webp", quality));
}
async function optimize(source: Drawable, maxWidth: number, maxHeight: number, maxBytes: number) {
  const original = dimensions(source);
  const baseScale = Math.min(1, maxWidth / original.width, maxHeight / original.height);
  for (const scaleStep of [1, .85, .7, .55]) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(original.width * baseScale * scaleStep));
    canvas.height = Math.max(1, Math.round(original.height * baseScale * scaleStep));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Photo processing is unavailable.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [.78, .68, .58, .48]) {
      const blob = await webpBlob(canvas, quality);
      if (blob.size <= maxBytes) return blob;
    }
  }
  throw new Error("This photo could not be reduced enough. Try a different photo.");
}
async function optimizeFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_INPUT_BYTES) throw new Error("Choose a JPEG, PNG, or WebP photo no larger than 8 MB.");
  const source = await loadImage(file);
  try {
    const [display, feed] = await Promise.all([
      optimize(source, 1600, 2000, DISPLAY_MAX_BYTES),
      optimize(source, 800, 1000, FEED_MAX_BYTES),
    ]);
    return { display, feed };
  } finally { if (source instanceof ImageBitmap) source.close(); }
}
function normalizedStyle(value: string) { return value.replace(/^#+/, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function newKey() { return crypto.randomUUID().replaceAll("-", ""); }

export default function OutfitComposer({ closet, initial }: { closet: ClosetOption[]; initial?: InitialOutfit | null }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [postId, setPostId] = useState(initial?.id ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [story, setStory] = useState(initial?.story ?? "");
  const [commentsEnabled, setCommentsEnabled] = useState(initial?.commentsEnabled ?? true);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.closetItemIds ?? []));
  const [occasions, setOccasions] = useState<string[]>(initial?.occasions ?? []);
  const [styleTags, setStyleTags] = useState<string[]>(initial?.styleTags ?? []);
  const [styleDraft, setStyleDraft] = useState("");
  const [photos, setPhotos] = useState<PhotoState[]>(() => (initial?.photos ?? []).sort((a,b) => a.sortOrder-b.sortOrder).map((photo) => ({ key: `existing_${photo.id}`, existingId: photo.id, previewUrl: photo.url, isMain: photo.isMain, tags: photo.tags })));
  const [photoStatus, setPhotoStatus] = useState("JPEG, PNG, or WebP · 8 MB max each · optimized automatically");
  const [tagEditorKey, setTagEditorKey] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<{ photoKey: string; closetItemId: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [garmentModal, setGarmentModal] = useState(false);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [busyPhotos, setBusyPhotos] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isPublished = initial?.status === "published";

  const closetById = useMemo(() => new Map(closet.map((item) => [item.id, item])), [closet]);
  const selectedOptions = [...selected].map((id) => closetById.get(id)).filter((item): item is ClosetOption => Boolean(item));
  const mainPhoto = photos.find((photo) => photo.isMain) ?? photos[0];

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    const intercept = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      setLeaveHref(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", intercept, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", intercept, true); };
  }, [dirty]);

  useEffect(() => () => {
    for (const photo of photos) if (!photo.existingId && photo.previewUrl.startsWith("blob:")) URL.revokeObjectURL(photo.previewUrl);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function mark() { setDirty(true); setMessage(null); }
  function updateSelected(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) { if (next.size >= 6) return current; next.add(id); }
      else next.delete(id);
      return next;
    });
    if (!checked) setPhotos((current) => current.map((photo) => ({ ...photo, tags: photo.tags.filter((tag) => tag.closetItemId !== id) })));
    mark();
  }
  function toggleOccasion(value: string) {
    setOccasions((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length < 2 ? [...current, value] : current);
    mark();
  }
  function addStyleTag() {
    const display = styleDraft.replace(/^#+/, "").trim().slice(0, 30);
    const normalized = normalizedStyle(display);
    if (!display || !normalized || styleTags.length >= 3 || styleTags.some((tag) => normalizedStyle(tag) === normalized)) return;
    setStyleTags((current) => [...current, display]); setStyleDraft(""); mark();
  }
  function removeStyleTag(value: string) { setStyleTags((current) => current.filter((tag) => tag !== value)); mark(); }

  async function makePhoto(file: File, isMain: boolean): Promise<PhotoState> {
    const { display, feed } = await optimizeFile(file);
    return { key: newKey(), previewUrl: URL.createObjectURL(display), displayBlob: display, feedBlob: feed, isMain, tags: [] };
  }
  async function chooseMain(file?: File) {
    if (!file) return;
    setBusyPhotos(true); setPhotoStatus("Optimizing main photo…");
    try {
      const next = await makePhoto(file, true);
      setPhotos((current) => {
        const mainIndex = current.findIndex((photo) => photo.isMain);
        if (mainIndex < 0) return [next, ...current.map((photo) => ({ ...photo, isMain: false }))].slice(0, 6);
        const old = current[mainIndex];
        if (!old.existingId && old.previewUrl.startsWith("blob:")) URL.revokeObjectURL(old.previewUrl);
        const copy = [...current]; copy.splice(mainIndex, 1); return [next, ...copy.map((photo) => ({ ...photo, isMain: false }))];
      });
      setPhotoStatus("Main photo ready."); mark();
    } catch (error) { setPhotoStatus(error instanceof Error ? error.message : "Photo optimization failed."); }
    finally { setBusyPhotos(false); }
  }
  async function chooseAdditional(files: FileList | null) {
    if (!files?.length) return;
    setBusyPhotos(true); setPhotoStatus("Optimizing additional photos…");
    try {
      const available = Math.max(0, 6 - photos.length);
      const chosen = [...files].slice(0, available);
      const next: PhotoState[] = [];
      for (const file of chosen) next.push(await makePhoto(file, photos.length === 0 && next.length === 0));
      setPhotos((current) => [...current, ...next].slice(0,6));
      setPhotoStatus(`${next.length} additional ${next.length===1?"photo":"photos"} ready.`); mark();
    } catch (error) { setPhotoStatus(error instanceof Error ? error.message : "Photo optimization failed."); }
    finally { setBusyPhotos(false); }
  }
  function removePhoto(key: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.key === key);
      if (removed && !removed.existingId && removed.previewUrl.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
      const next = current.filter((photo) => photo.key !== key);
      if (removed?.isMain && next.length) next[0] = { ...next[0], isMain: true };
      return next;
    });
    if (tagEditorKey === key) setTagEditorKey(null); mark();
  }
  function setMain(key: string) {
    setPhotos((current) => {
      const selectedPhoto = current.find((photo) => photo.key === key); if (!selectedPhoto) return current;
      return [{ ...selectedPhoto, isMain: true }, ...current.filter((photo) => photo.key !== key).map((photo) => ({ ...photo, isMain: false }))];
    }); mark();
  }
  function movePhoto(index: number, direction: -1 | 1) {
    if (index === 0) return;
    const target = index + direction;
    if (target < 1 || target >= photos.length) return;
    setPhotos((current) => { const next=[...current]; [next[index],next[target]]=[next[target],next[index]]; return next; }); mark();
  }
  function removeHotspot(photoKey: string, closetItemId: string) {
    setPhotos((current) => current.map((photo) => photo.key === photoKey ? { ...photo, tags: photo.tags.filter((tag) => tag.closetItemId !== closetItemId) } : photo));
    mark();
  }
  function imageClick(photoKey: string, event: React.MouseEvent<HTMLDivElement>) {
    if (!activeTag || activeTag.photoKey !== photoKey) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    setPhotos((current) => current.map((photo) => photo.key === photoKey ? { ...photo, tags: [...photo.tags.filter((tag) => tag.closetItemId !== activeTag.closetItemId), { closetItemId: activeTag.closetItemId, x, y }] } : photo));
    setActiveTag(null); mark();
  }
  function copyMainTags(photoKey: string) {
    const source = photos.find((photo) => photo.isMain); if (!source) return;
    setPhotos((current) => current.map((photo) => photo.key === photoKey ? { ...photo, tags: source.tags.map((tag) => ({ ...tag })) } : photo)); mark();
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
    formData.set("photo_manifest", JSON.stringify(photos.map((photo) => ({ key: photo.key, existingId: photo.existingId, isMain: photo.isMain, tags: photo.tags }))));
    for (const photo of photos) if (!photo.existingId && photo.displayBlob && photo.feedBlob) {
      formData.append(`photo_display__${photo.key}`, new File([photo.displayBlob], "display.webp", { type: "image/webp" }));
      formData.append(`photo_feed__${photo.key}`, new File([photo.feedBlob], "feed.webp", { type: "image/webp" }));
    }
    return formData;
  }

  async function runSave(kind: "draft" | "publish" | "update", destination?: string) {
    setMessage(null);
    const action = kind === "draft" ? saveOutfitDraft : kind === "publish" ? publishOutfit : savePublishedOutfit;
    const result: OutfitSaveResult = await action(buildFormData());
    if (!result.ok || !result.postId) { setMessage(result.error ?? "That Outfit could not be saved."); return false; }
    setPostId(result.postId); setDirty(false);
    if (destination) { window.location.assign(destination); return true; }
    if (kind === "draft") window.location.assign(`/outfits/new?draft=${result.postId}&saved=1`);
    else window.location.assign(`/outfits/${result.postId}?${kind === "publish" ? "published" : "updated"}=1`);
    return true;
  }
  function save(kind: "draft" | "publish" | "update", destination?: string) { startTransition(() => { void runSave(kind, destination); }); }

  const readyToPreview = Boolean(headline.trim() && photos.length >= 1 && selected.size >= 1 && selected.size <= 6 && occasions.length >= 1 && occasions.length <= 2 && !busyPhotos);
  function requestPreview() {
    if (!readyToPreview) { setMessage("Add a headline, main photo, 1–6 Closet garments, and at least one Occasion before previewing."); return; }
    setPreview(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleIframeLoad() {
    const frame = iframeRef.current;
    if (!frame) return;
    try {
      const url = new URL(frame.contentWindow?.location.href ?? "");
      if (url.pathname === "/closet/add") {
        const added = url.searchParams.get("added") || url.searchParams.get("updated");
        if (added) {
          setGarmentModal(false);
          setSelected((current) => new Set([...current, added]));
          mark();
          router.refresh();
        }
      }
    } catch { /* same-origin page may still be navigating */ }
  }

  if (preview) return <section className={styles.previewShell}>
    <div className={styles.previewTop}><div><span className="eyebrow">PREVIEW OUTFIT</span><h1>{headline}</h1></div><span className={styles.previewBadge}>Preview · not live yet</span></div>
    <div className={styles.detailLayout}>
      <div>
        {mainPhoto ? <div className={styles.previewMain}><img src={mainPhoto.previewUrl} alt="Outfit preview" />{mainPhoto.tags.map((tag) => <span key={tag.closetItemId} className={styles.previewDot} style={{ left: `${tag.x*100}%`, top: `${tag.y*100}%` }} />)}</div> : null}
        {photos.length > 1 ? <div className={styles.previewThumbs}>{photos.map((photo) => <img key={photo.key} src={photo.previewUrl} alt="Outfit angle preview" />)}</div> : null}
      </div>
      <article className={styles.storyCard}>
        <div className={styles.pills}>{occasions.map((key) => <span key={key}>{OCCASIONS.find(([value]) => value===key)?.[1] ?? key}</span>)}</div>
        {styleTags.length ? <div className={styles.styleLine}>{styleTags.map((tag) => <span key={tag}>#{tag}</span>)}</div> : null}
        {story ? <p className={styles.storyText}>{story}</p> : null}
        <h3>Explore This Look</h3>
        <div className={styles.tags}>{selectedOptions.map((item) => <div className={styles.tag} key={item.id}><strong>{item.label}</strong><span>{item.detail}</span></div>)}</div>
      </article>
    </div>
    {message ? <div className="authMessage error">{message}</div> : null}
    <div className={styles.publishBar}><button type="button" className="secondaryButton" onClick={() => setPreview(false)}>← Back to Edit</button><button type="button" className="secondaryButton" disabled={isPending} onClick={() => save("draft")}>Save Draft</button><button type="button" className="primaryButton" disabled={isPending} onClick={() => save("publish")}>{isPending ? "Publishing…" : "Publish Outfit →"}</button></div>
  </section>;

  return <>
    <section className={styles.composer}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">1 · PHOTOS</span><h2>Show the full look.</h2></div><span className="muted">1 required + up to 5 additional</span></div>
        <div className={styles.uploadGrid}>
          <label className={styles.uploadBox}><strong>Main / front photo</strong><span>This becomes the cover photo.</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busyPhotos} onChange={(event) => { void chooseMain(event.currentTarget.files?.[0]); event.currentTarget.value=""; }} /></label>
          <label className={styles.uploadBox}><strong>Additional photos</strong><span>Bulk upload angles, layers, or with/without accessories.</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busyPhotos || photos.length>=6} onChange={(event) => { void chooseAdditional(event.currentTarget.files); event.currentTarget.value=""; }} /></label>
        </div>
        <span className="fieldHelp" aria-live="polite">{photoStatus}</span>
        {photos.length ? <div className={styles.photoEditorList}>{photos.map((photo,index) => <article className={styles.photoEditorCard} key={photo.key}>
          <div className={styles.photoEditorImage} onClick={(event) => imageClick(photo.key,event)} role={activeTag?.photoKey===photo.key?"button":undefined} tabIndex={activeTag?.photoKey===photo.key?0:undefined}>
            <img src={photo.previewUrl} alt={photo.isMain ? "Main Outfit photo" : `Outfit photo ${index+1}`} />
            {photo.tags.map((tag) => <button type="button" className={styles.hotspotDot} style={{ left:`${tag.x*100}%`,top:`${tag.y*100}%` }} key={tag.closetItemId} title={closetById.get(tag.closetItemId)?.label ?? "Tagged garment"} onClick={(event)=>{event.stopPropagation();removeHotspot(photo.key,tag.closetItemId);}} />)}
          </div>
          <div className={styles.photoEditorControls}>
            <strong>{photo.isMain ? "Main photo" : `Additional photo ${index}`}</strong>
            <div className={styles.miniActions}>{!photo.isMain?<button type="button" onClick={()=>setMain(photo.key)}>Set as Main</button>:null}{index>1?<button type="button" onClick={()=>movePhoto(index,-1)}>↑</button>:null}{index>0&&index<photos.length-1?<button type="button" onClick={()=>movePhoto(index,1)}>↓</button>:null}<button type="button" onClick={()=>removePhoto(photo.key)}>Remove</button></div>
            <button type="button" className={styles.tagItemsButton} onClick={()=>{setTagEditorKey(tagEditorKey===photo.key?null:photo.key);setActiveTag(null);}}>{tagEditorKey===photo.key?"Done tagging":"Tag items in this photo"}</button>
            {tagEditorKey===photo.key?<div className={styles.hotspotEditor}><p>Choose a garment, then tap where it appears in the photo. Tags stay hidden from viewers until they choose <b>View tagged items</b>.</p>{!photo.isMain&&mainPhoto?.tags.length?<button type="button" onClick={()=>copyMainTags(photo.key)}>Copy tags from main photo</button>:null}<div className={styles.hotspotChoices}>{selectedOptions.map((item)=>{const placed=photo.tags.some((tag)=>tag.closetItemId===item.id);const active=activeTag?.photoKey===photo.key&&activeTag.closetItemId===item.id;return <button type="button" className={active?styles.hotspotActive:placed?styles.hotspotPlaced:undefined} key={item.id} onClick={()=>setActiveTag({photoKey:photo.key,closetItemId:item.id})}>{placed?"✓ ":"+ "}{item.label}</button>;})}</div>{activeTag?.photoKey===photo.key?<strong className={styles.tapPrompt}>Tap the photo to place this tag.</strong>:null}</div>:null}
          </div>
        </article>)}</div> : null}
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">2 · THE POST</span><h2>Give the Outfit a point of view.</h2></div></div>
        <label>Headline <span className={styles.counter}>{headline.length}/100</span><input value={headline} maxLength={100} required placeholder="A short headline for the Style Feed" onChange={(event)=>{setHeadline(event.target.value);mark();}} /></label>
        <label>Outfit Story <span className="muted inlineMuted">optional</span> <span className={styles.counter}>{story.length}/5,000</span><textarea value={story} rows={9} maxLength={5000} placeholder="Tell people about the look, layers, accessories, why you styled it this way, or anything else worth knowing." onChange={(event)=>{setStory(event.target.value);mark();}} /></label>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">3 · OCCASION & STYLE</span><h2>Make the look discoverable.</h2></div><span className="muted">Occasion required · choose 1–2</span></div>
        <div className={styles.occasionGrid}>{OCCASIONS.map(([value,label])=><button type="button" aria-pressed={occasions.includes(value)} className={occasions.includes(value)?styles.occasionSelected:styles.occasion} key={value} onClick={()=>toggleOccasion(value)}>{label}</button>)}</div>
        <div className={styles.styleTagEditor}><label>Style tags <span className="muted inlineMuted">optional · up to 3</span><div className={styles.styleInputRow}><input value={styleDraft} maxLength={30} placeholder="oldmoney" onChange={(event)=>setStyleDraft(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"){event.preventDefault();addStyleTag();}}}/><button type="button" onClick={addStyleTag} disabled={styleTags.length>=3}>Add</button></div><span className="fieldHelp">Use your own words. We’ll make them searchable over time. {styleDraft.length}/30</span></label>{styleTags.length?<div className={styles.styleTags}>{styleTags.map((tag)=><button type="button" key={tag} onClick={()=>removeStyleTag(tag)}>#{tag} ×</button>)}</div>:null}</div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><span className="eyebrow">4 · GARMENTS</span><h2>Tag what you’re actually wearing.</h2></div><span className="muted">1–6 required to publish</span></div>
        {closet.length?<div className={styles.choices}>{closet.map((item)=><label className={styles.choice} key={item.id}><input type="checkbox" checked={selected.has(item.id)} disabled={!selected.has(item.id)&&selected.size>=6} onChange={(event)=>updateSelected(item.id,event.target.checked)}/><span><strong>{item.label}</strong><small>{item.detail}</small></span></label>)}</div>:<div className="emptyState"><strong>Your Closet is empty.</strong><span>Add a Fit Report without leaving this Outfit.</span></div>}
        <button type="button" className="secondaryButton" onClick={()=>setGarmentModal(true)}>+ Add a missing garment</button>
        <p className="fieldHelp">Accessories do not need separate garment records in V1—mention them in your Outfit Story.</p>
      </div>

      <div className={styles.sectionCard}>
        <label className={styles.commentToggle}><input type="checkbox" checked={commentsEnabled} onChange={(event)=>{setCommentsEnabled(event.target.checked);mark();}}/><span><strong>Allow comments</strong><small>Comments are on by default. You can turn them off or back on later.</small></span></label>
      </div>

      {message ? <div className="authMessage error">{message}</div> : null}
      <div className={styles.composerActions}>{isPublished?<button type="button" className="primaryButton" disabled={isPending||busyPhotos} onClick={()=>save("update")}>{isPending?"Saving…":"Save Changes"}</button>:<><button type="button" className="secondaryButton" disabled={isPending||busyPhotos} onClick={()=>save("draft")}>{isPending?"Saving…":"Save Draft"}</button><button type="button" className="primaryButton" disabled={isPending||busyPhotos} onClick={requestPreview}>Preview Outfit →</button></>}</div>
    </section>

    {garmentModal?<div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Add a missing Closet garment"><div className={styles.garmentModal}><div className={styles.modalHeader}><div><span className="eyebrow">ADD A GARMENT</span><strong>Your Outfit stays right where you left it.</strong></div><button type="button" onClick={()=>setGarmentModal(false)}>×</button></div><iframe ref={iframeRef} src="/closet/add" title="Add a Fit Report" onLoad={handleIframeLoad}/></div></div>:null}

    {leaveHref?<div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Unsaved Outfit"><div className={styles.leaveModal}><h2>Save your work?</h2><p>You have unsaved changes to this Outfit.</p><div className={styles.leaveActions}><button type="button" className="primaryButton" disabled={isPending} onClick={()=>save(isPublished?"update":"draft",leaveHref)}>{isPublished?"Save Changes":"Save Draft"}</button><button type="button" className="secondaryButton" onClick={()=>{setDirty(false);window.location.assign(leaveHref);}}>Leave Without Saving</button><button type="button" className="textLink" onClick={()=>setLeaveHref(null)}>Keep Editing</button></div></div></div>:null}
  </>;
}
