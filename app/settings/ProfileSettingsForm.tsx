"use client";

import { useRef, useState } from "react";
import { saveUnifiedProfileSettings } from "@/app/settings/actions";
import styles from "@/app/settings/settings.module.css";
import { US_STATE_OPTIONS } from "@/lib/profile-location";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 400 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type Drawable = ImageBitmap | HTMLImageElement;
type FitCommunity = "men" | "women" | "both";

type Props = {
  username: string;
  displayName: string;
  bio: string;
  city: string;
  stateRegion: string;
  fitCommunity: FitCommunity;
  currentPhotoUrl: string | null;
  fallbackInitial: string;
};

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

export function ProfileSettingsForm({
  username,
  displayName,
  bio,
  city,
  stateRegion,
  fitCommunity,
  currentPhotoUrl,
  fallbackInitial,
}: Props) {
  const optimizedRef = useRef<HTMLInputElement>(null);
  const previewObjectUrl = useRef<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [displayNameValue, setDisplayNameValue] = useState(displayName);
  const [bioValue, setBioValue] = useState(bio);
  const [cityValue, setCityValue] = useState(city);
  const [stateValue, setStateValue] = useState(stateRegion);
  const [communityValue, setCommunityValue] = useState<FitCommunity>(fitCommunity);
  const [preview, setPreview] = useState(currentPhotoUrl);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  function clearPreparedPhoto() {
    if (optimizedRef.current) optimizedRef.current.value = "";
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
  }

  function cancelEditing() {
    clearPreparedPhoto();
    setDisplayNameValue(displayName);
    setBioValue(bio);
    setCityValue(city);
    setStateValue(stateRegion);
    setCommunityValue(fitCommunity);
    setPreview(currentPhotoUrl);
    setRemovePhoto(false);
    setPhotoStatus(null);
    setEditing(false);
  }

  async function preparePhoto(file: File | undefined) {
    clearPreparedPhoto();
    if (!file) {
      setPreview(removePhoto ? null : currentPhotoUrl);
      setPhotoStatus(null);
      return;
    }

    setPhotoBusy(true);
    try {
      if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_INPUT_BYTES) {
        throw new Error("Choose a JPEG, PNG, or WebP photo no larger than 8 MB.");
      }
      const source = await loadImage(file);
      try {
        const blob = await optimizeProfilePhoto(source);
        assign(optimizedRef.current, blob);
        previewObjectUrl.current = URL.createObjectURL(blob);
        setPreview(previewObjectUrl.current);
        setRemovePhoto(false);
        setPhotoStatus("New photo ready");
      } finally {
        if (source instanceof ImageBitmap) source.close();
      }
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "Photo could not be prepared.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function markPhotoForRemoval() {
    clearPreparedPhoto();
    setPreview(null);
    setRemovePhoto(true);
    setPhotoStatus("Photo will be removed when you save.");
  }

  return (
    <form className={styles.profileCard} action={saveUnifiedProfileSettings}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.sectionKicker}>PROFILE</span>
          <h2>Edit My Profile</h2>
        </div>
        {!editing ? (
          <button type="button" className={styles.editButton} onClick={() => setEditing(true)}>Edit Profile</button>
        ) : null}
      </div>

      <div className={styles.profileTop}>
        <div className={styles.avatar}>
          {preview ? <img src={preview} alt="Your profile" /> : <span>{fallbackInitial}</span>}
        </div>
        <div className={styles.photoArea}>
          <strong>Profile photo</strong>
          <span className={styles.helpText}>Visible on your LikeSized profile.</span>
          {editing ? (
            <div className={styles.photoActions}>
              <label className={styles.fileButton}>
                Change photo
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={(event) => preparePhoto(event.currentTarget.files?.[0])} />
              </label>
              {(currentPhotoUrl || preview) && !removePhoto ? <button type="button" className={styles.textButton} onClick={markPhotoForRemoval}>Remove</button> : null}
            </div>
          ) : null}
          {editing && photoStatus ? <span className={styles.photoStatus} aria-live="polite">{photoStatus}</span> : null}
          <input ref={optimizedRef} name="profile_photo" type="file" accept="image/webp" hidden readOnly />
          <input name="remove_profile_photo" type="hidden" value={removePhoto ? "1" : "0"} />
        </div>
      </div>

      <div className={styles.profileGrid}>
        <label className={styles.field}>
          <span>Username</span>
          <input value={`@${username}`} readOnly aria-readonly="true" tabIndex={-1} />
          <small>Locked</small>
        </label>

        <label className={styles.field}>
          <span>Display name</span>
          <input name="display_name" value={displayNameValue} onChange={(event) => setDisplayNameValue(event.target.value)} maxLength={80} readOnly={!editing} aria-readonly={!editing} />
        </label>

        <label className={`${styles.field} ${styles.fullField}`}>
          <span>Bio</span>
          <textarea name="bio" value={bioValue} onChange={(event) => setBioValue(event.target.value)} maxLength={300} rows={3} readOnly={!editing} aria-readonly={!editing} />
          {editing ? <small>{bioValue.length} / 300</small> : null}
        </label>

        <label className={styles.field}>
          <span>City</span>
          <input name="city" value={cityValue} onChange={(event) => setCityValue(event.target.value)} maxLength={80} autoComplete="address-level2" readOnly={!editing} aria-readonly={!editing} required />
        </label>

        <label className={styles.field}>
          <span>State</span>
          <select name="state_region" value={stateValue} onChange={(event) => setStateValue(event.target.value)} disabled={!editing} required>
            <option value="" disabled>Select state</option>
            {US_STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          {!editing ? <input type="hidden" name="state_region" value={stateValue} /> : null}
        </label>

        <div className={`${styles.helpText} ${styles.fullField}`}>City and state stay private.</div>

        <label className={styles.field}>
          <span>Fit Community</span>
          <select name="fit_community" value={communityValue} onChange={(event) => setCommunityValue(event.target.value as FitCommunity)} disabled={!editing} required>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="both">Both</option>
          </select>
          {!editing ? <input type="hidden" name="fit_community" value={communityValue} /> : null}
        </label>
      </div>

      {editing ? (
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveButton} disabled={photoBusy}>Save Changes</button>
          <button type="button" className={styles.cancelButton} onClick={cancelEditing}>Cancel</button>
        </div>
      ) : null}
    </form>
  );
}
