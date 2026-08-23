"use client";

import { useRef, useState } from "react";
import { removeProfilePhoto, saveProfilePhoto } from "@/app/settings/actions";
import styles from "@/app/settings/settings.module.css";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 400 * 1024;
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
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Photo conversion failed.")),
      "image/webp",
      quality,
    );
  });
}

async function optimizeProfilePhoto(source: Drawable) {
  const original = dimensions(source);
  const side = Math.min(original.width, original.height);
  const sourceX = Math.max(0, Math.round((original.width - side) / 2));
  const sourceY = Math.max(0, Math.round((original.height - side) / 2));
  const sizes = [512, 448, 384];
  const qualities = [0.82, 0.72, 0.62, 0.52];

  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Photo processing is unavailable.");
    context.drawImage(source, sourceX, sourceY, side, side, 0, 0, size, size);
    for (const quality of qualities) {
      const blob = await webpBlob(canvas, quality);
      if (blob.size <= MAX_OUTPUT_BYTES) return blob;
    }
  }

  throw new Error("This photo could not be reduced enough. Try a different photo.");
}

function assign(input: HTMLInputElement | null, blob: Blob) {
  if (!input) return;
  const transfer = new DataTransfer();
  transfer.items.add(new File([blob], "profile.webp", { type: "image/webp" }));
  input.files = transfer.files;
}

export function ProfilePhotoForm({ currentPhotoUrl, fallbackInitial }: { currentPhotoUrl: string | null; fallbackInitial: string }) {
  const optimizedRef = useRef<HTMLInputElement>(null);
  const previewObjectUrl = useRef<string | null>(null);
  const [preview, setPreview] = useState(currentPhotoUrl);
  const [status, setStatus] = useState("JPEG, PNG, or WebP · 8 MB max · cropped square and optimized automatically");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  async function prepare(file: File | undefined) {
    if (optimizedRef.current) optimizedRef.current.value = "";
    setReady(false);
    if (!file) return;

    setBusy(true);
    try {
      if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_INPUT_BYTES) {
        throw new Error("Choose a JPEG, PNG, or WebP photo no larger than 8 MB.");
      }
      setStatus("Optimizing profile photo…");
      const source = await loadImage(file);
      try {
        const blob = await optimizeProfilePhoto(source);
        assign(optimizedRef.current, blob);
        if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
        previewObjectUrl.current = URL.createObjectURL(blob);
        setPreview(previewObjectUrl.current);
        setStatus(`Ready · ${Math.ceil(blob.size / 1024)} KB`);
        setReady(true);
      } finally {
        if (source instanceof ImageBitmap) source.close();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Photo optimization failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.profilePhotoBlock}>
      <div className={styles.profilePhotoPreview}>
        {preview ? <img src={preview} alt="Your profile" /> : <span>{fallbackInitial}</span>}
      </div>
      <div className={styles.profilePhotoControls}>
        <strong>Profile photo <span className="muted inlineMuted">optional</span></strong>
        <span className="fieldHelp">Visible to signed-in LikeSized members as part of your profile identity.</span>
        <form action={saveProfilePhoto} className={styles.photoUploadForm}>
          <label className={styles.photoPicker}>
            Choose photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(event) => prepare(event.currentTarget.files?.[0])}
            />
          </label>
          <input ref={optimizedRef} name="profile_photo" type="file" accept="image/webp" hidden readOnly />
          <span className="fieldHelp" aria-live="polite">{status}</span>
          <button type="submit" className="primaryButton" disabled={!ready || busy}>Upload profile photo</button>
        </form>
        {currentPhotoUrl ? (
          <form action={removeProfilePhoto}>
            <button type="submit" className="secondaryButton">Remove profile photo</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
