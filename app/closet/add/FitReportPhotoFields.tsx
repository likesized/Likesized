"use client";

import { useState } from "react";
import { useCatalogGarment } from "./CatalogGarmentFields";
import styles from "./fitReport.module.css";

export default function FitReportPhotoFields() {
  const { productPhotoName, chooseProductPhoto } = useCatalogGarment();
  const [frontName, setFrontName] = useState("");
  const [backName, setBackName] = useState("");

  return <fieldset className={styles.itemDetailsFieldset} data-photo-requirement>
    <legend>Photos <span className="muted inlineMuted">at least one required</span></legend>
    <p className="fieldHelp">Add at least one photo so others can identify the item. A Product Photo, Front Fit Photo, or Back Fit Photo satisfies this requirement.</p>
    <div className={styles.photoEvidenceGrid}>
      <div className={styles.photoEvidenceCard}>
        <strong>Product Photo</strong>
        <span className="fieldHelp">A clear photo of the garment itself. This is Product evidence, not a Fit Photo.</span>
        <button className="catalogManualButton" type="button" onClick={chooseProductPhoto}>{productPhotoName ? "Replace Product Photo" : "Add Product Photo"}</button>
        {productPhotoName ? <small>{productPhotoName}</small> : null}
      </div>
      <label>Front Fit Photo
        <input name="photo_front" type="file" accept="image/jpeg,image/png,image/webp" data-review-label="Front Fit Photo" onChange={(event)=>setFrontName(event.target.files?.[0]?.name??"")} />
        {frontName ? <small>{frontName}</small> : null}
      </label>
      <label>Back Fit Photo
        <input name="photo_back" type="file" accept="image/jpeg,image/png,image/webp" data-review-label="Back Fit Photo" onChange={(event)=>setBackName(event.target.files?.[0]?.name??"")} />
        {backName ? <small>{backName}</small> : null}
      </label>
    </div>
    <span className="fieldHelp"><b>Front and Back Fit Photos are shared with the LikeSized community. Don’t upload a Fit Photo you do not want other people to see.</b></span>
  </fieldset>;
}
