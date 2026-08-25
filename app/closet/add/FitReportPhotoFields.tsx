"use client";

import { useRef, useState } from "react";
import { useCatalogGarment } from "./CatalogGarmentFields";
import styles from "./fitReport.module.css";

function FitPhotoCard({ label, name, fileName, setFileName }: { label: string; name: "photo_front" | "photo_back"; fileName: string; setFileName: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className={styles.photoEvidenceCard}>
    <strong>{label}</strong>
    <input ref={inputRef} className={styles.hiddenFileInput} name={name} type="file" accept="image/jpeg,image/png,image/webp" data-review-label={label} onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
    <button className="catalogManualButton" type="button" onClick={() => inputRef.current?.click()}>{fileName ? "Replace Photo" : "Choose Photo"}</button>
    <small>{fileName || "No file chosen"}</small>
  </div>;
}

export default function FitReportPhotoFields() {
  const { productPhotoName, chooseProductPhoto } = useCatalogGarment();
  const [frontName, setFrontName] = useState("");
  const [backName, setBackName] = useState("");

  return <fieldset className={styles.itemDetailsFieldset} data-photo-requirement>
    <legend>Photos <span className="muted inlineMuted">at least one required</span></legend>
    <p className="fieldHelp">Add at least one photo. Choose a Front Fit Photo, Back Fit Photo, or Product Photo so others can clearly identify the item.</p>
    <div className={styles.photoEvidenceGrid}>
      <FitPhotoCard label="Front Fit Photo" name="photo_front" fileName={frontName} setFileName={setFrontName}/>
      <FitPhotoCard label="Back Fit Photo" name="photo_back" fileName={backName} setFileName={setBackName}/>
      <div className={styles.photoEvidenceCard}>
        <strong>Product Photo (not being worn)</strong>
        <button className="catalogManualButton" type="button" onClick={chooseProductPhoto}>{productPhotoName ? "Replace Photo" : "Choose Photo"}</button>
        <small>{productPhotoName || "No file chosen"}</small>
      </div>
    </div>
    <span className="fieldHelp"><b>Front and Back Fit Photos are visible to the LikeSized community. Only upload photos you’re comfortable sharing publicly.</b></span>
  </fieldset>;
}
