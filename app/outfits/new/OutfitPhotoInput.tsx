"use client";

import { useRef, useState } from "react";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const DISPLAY_MAX_BYTES = 600 * 1024;
const FEED_MAX_BYTES = 220 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("WebP conversion failed.")), "image/webp", quality);
  });
}

async function optimize(source: Drawable, maxWidth: number, maxHeight: number, maxBytes: number) {
  const original = dimensions(source);
  const baseScale = Math.min(1, maxWidth / original.width, maxHeight / original.height);
  const scaleSteps = [1, 0.85, 0.7, 0.55];
  const qualities = [0.78, 0.68, 0.58, 0.48];

  for (const scaleStep of scaleSteps) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(original.width * baseScale * scaleStep));
    canvas.height = Math.max(1, Math.round(original.height * baseScale * scaleStep));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Photo processing is unavailable.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of qualities) {
      const blob = await webpBlob(canvas, quality);
      if (blob.size <= maxBytes) return blob;
    }
  }
  throw new Error("This photo could not be reduced enough. Try a different photo.");
}

function assign(input: HTMLInputElement | null, blob: Blob, name: string) {
  if (!input) return;
  const transfer = new DataTransfer();
  transfer.items.add(new File([blob], name, { type: "image/webp" }));
  input.files = transfer.files;
}

export default function OutfitPhotoInput() {
  const displayRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("JPEG, PNG, or WebP · 8 MB max · optimized automatically · visible to signed-in members");
  const [busy, setBusy] = useState(false);

  async function prepare(file: File | undefined, form: HTMLFormElement | null) {
    if (displayRef.current) displayRef.current.value = "";
    if (feedRef.current) feedRef.current.value = "";
    if (!file) return;

    const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]') ?? null;
    setBusy(true);
    if (submit) submit.disabled = true;
    try {
      if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_INPUT_BYTES) throw new Error("Choose a JPEG, PNG, or WebP photo no larger than 8 MB.");
      setStatus("Optimizing photo…");
      const source = await loadImage(file);
      try {
        const [display, feed] = await Promise.all([
          optimize(source, 1600, 2000, DISPLAY_MAX_BYTES),
          optimize(source, 800, 1000, FEED_MAX_BYTES),
        ]);
        assign(displayRef.current, display, "display.webp");
        assign(feedRef.current, feed, "feed.webp");
        setStatus(`Ready · display ${Math.ceil(display.size / 1024)} KB · feed ${Math.ceil(feed.size / 1024)} KB`);
      } finally {
        if (source instanceof ImageBitmap) source.close();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Photo optimization failed.");
    } finally {
      setBusy(false);
      if (submit) submit.disabled = false;
    }
  }

  return <label>
    Outfit photo
    <input type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy}
      onChange={(event) => prepare(event.currentTarget.files?.[0], event.currentTarget.form)} />
    <input ref={displayRef} name="photo_display" type="file" accept="image/webp" hidden readOnly />
    <input ref={feedRef} name="photo_feed" type="file" accept="image/webp" hidden readOnly />
    <span className="fieldHelp" aria-live="polite">{status}</span>
  </label>;
}
