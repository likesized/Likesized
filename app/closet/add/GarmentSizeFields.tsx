"use client";

import { useEffect, useMemo, useState } from "react";
import { SIZE_KINDS, type GarmentSizeKind } from "@/lib/domain";
import { useCatalogGarment } from "./CatalogGarmentFields";
import styles from "./fitReport.module.css";

const NOT_SURE = "not_sure";
const ALPHA_SIZES = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const BRA_CUPS = ["AA", "A", "B", "C", "D", "DD", "DDD", "F", "G", "H", "I", "J", "K"];
const BRA_SYSTEMS = ["US", "UK", "EU"];
const SHOE_SYSTEMS = ["US", "UK", "EU", "JP"];
const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "regular", label: "Regular" },
  { value: "long", label: "Long" },
  { value: "petite", label: "Petite" },
  { value: "tall", label: "Tall" },
];

function numberRange(start: number, end: number, step = 1) {
  const values: string[] = [];
  for (let value = start; value <= end + 0.0001; value += step) {
    const rounded = Math.round(value * 100) / 100;
    values.push(Number.isInteger(rounded) ? String(rounded) : String(rounded));
  }
  return values;
}

const NUMERIC_SIZES = ["00", ...numberRange(0, 40)];
const WAIST_SIZES = numberRange(18, 80);
const INSEAM_SIZES = numberRange(18, 50);
const COLLAR_SIZES = numberRange(12, 24, 0.5);
const SLEEVE_LENGTHS = ["28-29", "30-31", "32-33", "34-35", "36-37", "38-39", "40-41", "42-43", "44-45", "46-47"];
const JACKET_SIZES = numberRange(30, 70);
const US_UK_BRA_BANDS = numberRange(24, 60, 2);
const EU_BRA_BANDS = numberRange(55, 135, 5);
const GENERIC_BRA_BANDS = [...new Set([...US_UK_BRA_BANDS, ...EU_BRA_BANDS])].sort((a, b) => Number(a) - Number(b));
const SHOE_SIZES: Record<string, string[]> = {
  US: numberRange(3, 18, 0.5),
  UK: numberRange(2, 17, 0.5),
  EU: numberRange(34, 52, 0.5),
  JP: numberRange(21, 32, 0.5),
  [NOT_SURE]: numberRange(1, 52, 0.5),
};

function token(value: string) {
  return value === NOT_SURE ? "?" : value;
}

function FixedOptions({ values }: { values: string[] }) {
  return <>{values.map((value) => <option value={value} key={value}>{value}</option>)}<option value={NOT_SURE}>Not sure</option></>;
}

export function GarmentSizeFields() {
  const { product, candidateDefaultSizeKind } = useCatalogGarment();
  const learnedDefault = product?.default_size_kind ?? candidateDefaultSizeKind ?? "";
  const [kind, setKind] = useState<GarmentSizeKind | "">("");
  const [alpha, setAlpha] = useState("");
  const [numeric, setNumeric] = useState("");
  const [waist, setWaist] = useState("");
  const [inseam, setInseam] = useState("");
  const [collar, setCollar] = useState("");
  const [sleeve, setSleeve] = useState("");
  const [jacket, setJacket] = useState("");
  const [jacketLength, setJacketLength] = useState("");
  const [braBand, setBraBand] = useState("");
  const [braCup, setBraCup] = useState("");
  const [braSystem, setBraSystem] = useState("");
  const [shoe, setShoe] = useState("");
  const [shoeSystem, setShoeSystem] = useState("");
  const [length, setLength] = useState("");
  const [freeform, setFreeform] = useState("");

  function resetSizingValues() {
    setAlpha("");
    setNumeric("");
    setWaist("");
    setInseam("");
    setCollar("");
    setSleeve("");
    setJacket("");
    setJacketLength("");
    setBraBand("");
    setBraCup("");
    setBraSystem("");
    setShoe("");
    setShoeSystem("");
    setLength("");
    setFreeform("");
  }

  useEffect(() => {
    setKind(learnedDefault);
    setAlpha("");
    setNumeric("");
    setWaist("");
    setInseam("");
    setCollar("");
    setSleeve("");
    setJacket("");
    setJacketLength("");
    setBraBand("");
    setBraCup("");
    setBraSystem("");
    setShoe("");
    setShoeSystem("");
    setLength("");
    setFreeform("");
  }, [product?.id, learnedDefault]);

  const normalizedLabel = useMemo(() => {
    switch (kind) {
      case "not_sure": return "Not sure";
      case "alpha": return alpha ? token(alpha) : "";
      case "numeric": return numeric ? token(numeric) : "";
      case "waist_inseam": return waist && inseam ? `${token(waist)}×${token(inseam)}` : "";
      case "dress_shirt": return collar && sleeve ? `${token(collar)} / ${token(sleeve)}` : "";
      case "jacket": {
        if (!jacket || !jacketLength) return "";
        const code = jacketLength === NOT_SURE ? "?" : jacketLength === "short" ? "S" : jacketLength === "long" ? "L" : "R";
        return `${token(jacket)}${code}`;
      }
      case "bra": return braBand && braCup && braSystem ? `${token(braBand)}${token(braCup)}` : "";
      case "shoe": return shoe && shoeSystem ? token(shoe) : "";
      case "length_designation": return length ? token(length) : "";
      case "freeform": return freeform.trim();
      default: return "";
    }
  }, [kind, alpha, numeric, waist, inseam, collar, sleeve, jacket, jacketLength, braBand, braCup, braSystem, shoe, shoeSystem, length, freeform]);

  const sizingSystem = kind === "bra"
    ? (braSystem === NOT_SURE ? "?" : braSystem)
    : kind === "shoe"
      ? (shoeSystem === NOT_SURE ? "?" : shoeSystem)
      : "";
  const braBands = braSystem === "EU" ? EU_BRA_BANDS : braSystem === "US" || braSystem === "UK" ? US_UK_BRA_BANDS : GENERIC_BRA_BANDS;
  const shoeSizes = SHOE_SIZES[shoeSystem] ?? SHOE_SIZES[NOT_SURE];

  return <fieldset className="garmentSizeFields">
    <legend>Size</legend>
    <div className={styles.sizeFields}>
      <label>Size system
        <select name="size_kind" value={kind} onChange={(event) => { resetSizingValues(); setKind(event.target.value as GarmentSizeKind); }} required>
          <option value="" disabled>Choose your measurement system</option>
          {SIZE_KINDS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        {learnedDefault ? <span className="fieldHelp">Preselected from prior Fit Reports. Change it if your item uses a different size system.</span> : null}
      </label>

      {kind === "alpha" ? <label>Letter size
        <select value={alpha} onChange={(event) => setAlpha(event.target.value)} required>
          <option value="" disabled>Select size</option>
          <FixedOptions values={ALPHA_SIZES} />
        </select>
      </label> : null}

      {kind === "numeric" ? <label>Numeric size
        <select value={numeric} onChange={(event) => setNumeric(event.target.value)} required>
          <option value="" disabled>Select size</option>
          <FixedOptions values={NUMERIC_SIZES} />
        </select>
      </label> : null}

      {kind === "waist_inseam" ? <div className={styles.sizeEquation}>
        <label>Waist
          <select value={waist} onChange={(event) => setWaist(event.target.value)} required>
            <option value="" disabled>e.g. 32</option>
            <FixedOptions values={WAIST_SIZES} />
          </select>
        </label>
        <span className={styles.sizeEquationMark} aria-hidden="true">×</span>
        <label>Inseam
          <select value={inseam} onChange={(event) => setInseam(event.target.value)} required>
            <option value="" disabled>e.g. 30</option>
            <FixedOptions values={INSEAM_SIZES} />
          </select>
        </label>
      </div> : null}

      {kind === "dress_shirt" ? <div className={styles.sizePair}>
        <label>Collar / neck size
          <select value={collar} onChange={(event) => setCollar(event.target.value)} required>
            <option value="" disabled>Select collar size</option>
            <FixedOptions values={COLLAR_SIZES} />
          </select>
        </label>
        <label>Sleeve length
          <select value={sleeve} onChange={(event) => setSleeve(event.target.value)} required>
            <option value="" disabled>Select sleeve length</option>
            {SLEEVE_LENGTHS.map((value) => <option value={value} key={value}>{value.replace("-", "/")}</option>)}
            <option value={NOT_SURE}>Not sure</option>
          </select>
        </label>
      </div> : null}

      {kind === "jacket" ? <div className={styles.sizePair}>
        <label>Jacket / chest size
          <select value={jacket} onChange={(event) => setJacket(event.target.value)} required>
            <option value="" disabled>Select jacket size</option>
            <FixedOptions values={JACKET_SIZES} />
          </select>
        </label>
        <label>Length
          <select value={jacketLength} onChange={(event) => setJacketLength(event.target.value)} required>
            <option value="" disabled>Select length</option>
            <option value="short">Short (S)</option>
            <option value="regular">Regular (R)</option>
            <option value="long">Long (L)</option>
            <option value={NOT_SURE}>Not sure</option>
          </select>
        </label>
      </div> : null}

      {kind === "bra" ? <div className={styles.sizeTriple}>
        <label>Sizing system
          <select value={braSystem} onChange={(event) => { setBraSystem(event.target.value); setBraBand(""); }} required>
            <option value="" disabled>Select system</option>
            {BRA_SYSTEMS.map((value) => <option value={value} key={value}>{value}</option>)}
            <option value={NOT_SURE}>Not sure</option>
          </select>
        </label>
        <label>Band
          <select value={braBand} onChange={(event) => setBraBand(event.target.value)} required>
            <option value="" disabled>Select band</option>
            <FixedOptions values={braBands} />
          </select>
        </label>
        <label>Cup
          <select value={braCup} onChange={(event) => setBraCup(event.target.value)} required>
            <option value="" disabled>Select cup</option>
            <FixedOptions values={BRA_CUPS} />
          </select>
        </label>
      </div> : null}

      {kind === "shoe" ? <div className={styles.sizePair}>
        <label>Sizing system
          <select value={shoeSystem} onChange={(event) => { setShoeSystem(event.target.value); setShoe(""); }} required>
            <option value="" disabled>Select system</option>
            {SHOE_SYSTEMS.map((value) => <option value={value} key={value}>{value}</option>)}
            <option value={NOT_SURE}>Not sure</option>
          </select>
        </label>
        <label>Shoe size
          <select value={shoe} onChange={(event) => setShoe(event.target.value)} required>
            <option value="" disabled>Select shoe size</option>
            <FixedOptions values={shoeSizes} />
          </select>
        </label>
      </div> : null}

      {kind === "length_designation" ? <label>Length designation
        <select value={length} onChange={(event) => setLength(event.target.value)} required>
          <option value="" disabled>Select length</option>
          {LENGTHS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          <option value={NOT_SURE}>Not sure</option>
        </select>
      </label> : null}

      {kind === "freeform" ? <label>Other size
        <input value={freeform} onChange={(event) => setFreeform(event.target.value)} maxLength={60} placeholder="Enter the size exactly as shown" required />
        <span className="fieldHelp">We keep Other entries so repeated sizing formats can be reviewed for future size-system additions.</span>
      </label> : null}

      {kind === "not_sure" ? <p className="fieldHelp">That’s okay. We’ll save the size as Not sure so the Fit Report can still be completed.</p> : null}
    </div>
    <input type="hidden" name="size_normalized_label" value={normalizedLabel} />
    <input type="hidden" name="sizing_system" value={sizingSystem} />
  </fieldset>;
}
