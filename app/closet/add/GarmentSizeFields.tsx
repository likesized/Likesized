"use client";

import { useMemo, useState } from "react";
import { SIZE_KINDS, type GarmentSizeKind } from "@/lib/domain";

const ALPHA_SIZES = ["XXXS","XXS","XS","S","M","L","XL","XXL","XXXL"];
const BRA_CUPS = ["AA","A","B","C","D","DD","DDD","F","G","H","I","J","K"];
const BRA_SYSTEMS = ["US","UK","EU"];
const SHOE_SYSTEMS = ["US","UK","EU","JP"];
const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "regular", label: "Regular" },
  { value: "long", label: "Long" },
  { value: "petite", label: "Petite" },
  { value: "tall", label: "Tall" },
];

function cleanNumber(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return String(number);
}

export function GarmentSizeFields() {
  const [kind, setKind] = useState<GarmentSizeKind | "">("");
  const [alpha, setAlpha] = useState("");
  const [numeric, setNumeric] = useState("");
  const [waist, setWaist] = useState("");
  const [inseam, setInseam] = useState("");
  const [collar, setCollar] = useState("");
  const [sleeveMin, setSleeveMin] = useState("");
  const [sleeveMax, setSleeveMax] = useState("");
  const [jacket, setJacket] = useState("");
  const [jacketLength, setJacketLength] = useState("");
  const [braBand, setBraBand] = useState("");
  const [braCup, setBraCup] = useState("");
  const [braSystem, setBraSystem] = useState("");
  const [shoe, setShoe] = useState("");
  const [shoeSystem, setShoeSystem] = useState("");
  const [length, setLength] = useState("");
  const [freeform, setFreeform] = useState("");

  const normalizedLabel = useMemo(() => {
    switch (kind) {
      case "alpha": return alpha;
      case "numeric": return numeric ? cleanNumber(numeric) : "";
      case "waist_inseam": return waist && inseam ? `${cleanNumber(waist)}×${cleanNumber(inseam)}` : "";
      case "dress_shirt": {
        if (!collar || !sleeveMin) return "";
        const max = sleeveMax || sleeveMin;
        return `${cleanNumber(collar)} / ${cleanNumber(sleeveMin)}${max !== sleeveMin ? `-${cleanNumber(max)}` : ""}`;
      }
      case "jacket": {
        if (!jacket || !jacketLength) return "";
        const code = jacketLength === "short" ? "S" : jacketLength === "long" ? "L" : "R";
        return `${cleanNumber(jacket)}${code}`;
      }
      case "bra": return braBand && braCup && braSystem ? `${cleanNumber(braBand)}${braCup}` : "";
      case "shoe": return shoe && shoeSystem ? cleanNumber(shoe) : "";
      case "length_designation": return length;
      case "freeform": return freeform.trim();
      default: return "";
    }
  }, [kind, alpha, numeric, waist, inseam, collar, sleeveMin, sleeveMax, jacket, jacketLength, braBand, braCup, braSystem, shoe, shoeSystem, length, freeform]);

  const sizingSystem = kind === "bra" ? braSystem : kind === "shoe" ? shoeSystem : "";

  return <fieldset className="garmentSizeFields">
    <legend>Size</legend>
    <div className="fieldPair">
      <label>Size system
        <select name="size_kind" value={kind} onChange={(event) => setKind(event.target.value as GarmentSizeKind)} required>
          <option value="" disabled>Choose your measurement system</option>
          {SIZE_KINDS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
      </label>
      {kind === "alpha" ? <label>Letter size<select value={alpha} onChange={(event) => setAlpha(event.target.value)} required><option value="" disabled>Select size</option>{ALPHA_SIZES.map((value) => <option value={value} key={value}>{value}</option>)}</select></label> : null}
      {kind === "numeric" ? <label>Numeric size<input type="number" inputMode="decimal" min="0" max="100" step="0.5" value={numeric} onChange={(event) => setNumeric(event.target.value)} required /></label> : null}
      {kind === "waist_inseam" ? <><label>Waist size<input type="number" inputMode="numeric" min="18" max="80" step="1" value={waist} onChange={(event) => setWaist(event.target.value)} required /></label><label>Inseam size<input type="number" inputMode="numeric" min="18" max="50" step="1" value={inseam} onChange={(event) => setInseam(event.target.value)} required /></label></> : null}
      {kind === "dress_shirt" ? <><label>Collar / neck size<input type="number" inputMode="decimal" min="10" max="30" step="0.25" value={collar} onChange={(event) => setCollar(event.target.value)} required /></label><label>Sleeve start<input type="number" inputMode="numeric" min="20" max="50" step="1" value={sleeveMin} onChange={(event) => setSleeveMin(event.target.value)} required /></label><label>Sleeve end <span className="muted inlineMuted">optional range</span><input type="number" inputMode="numeric" min="20" max="50" step="1" value={sleeveMax} onChange={(event) => setSleeveMax(event.target.value)} /></label></> : null}
      {kind === "jacket" ? <><label>Jacket / chest size<input type="number" inputMode="numeric" min="20" max="80" step="1" value={jacket} onChange={(event) => setJacket(event.target.value)} required /></label><label>Length<select value={jacketLength} onChange={(event) => setJacketLength(event.target.value)} required><option value="" disabled>Select length</option><option value="short">Short (S)</option><option value="regular">Regular (R)</option><option value="long">Long (L)</option></select></label></> : null}
      {kind === "bra" ? <><label>Band<input type="number" inputMode="numeric" min="20" max="70" step="2" value={braBand} onChange={(event) => setBraBand(event.target.value)} required /></label><label>Cup<select value={braCup} onChange={(event) => setBraCup(event.target.value)} required><option value="" disabled>Select cup</option>{BRA_CUPS.map((value) => <option value={value} key={value}>{value}</option>)}</select></label><label>Sizing system<select value={braSystem} onChange={(event) => setBraSystem(event.target.value)} required><option value="" disabled>Select system</option>{BRA_SYSTEMS.map((value) => <option value={value} key={value}>{value}</option>)}</select></label></> : null}
      {kind === "shoe" ? <><label>Shoe size<input type="number" inputMode="decimal" min="0" max="30" step="0.5" value={shoe} onChange={(event) => setShoe(event.target.value)} required /></label><label>Sizing system<select value={shoeSystem} onChange={(event) => setShoeSystem(event.target.value)} required><option value="" disabled>Select system</option>{SHOE_SYSTEMS.map((value) => <option value={value} key={value}>{value}</option>)}</select></label></> : null}
      {kind === "length_designation" ? <label>Length designation<select value={length} onChange={(event) => setLength(event.target.value)} required><option value="" disabled>Select length</option>{LENGTHS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label> : null}
      {kind === "freeform" ? <label>Manufacturer size<input value={freeform} onChange={(event) => setFreeform(event.target.value)} maxLength={60} placeholder="Unusual manufacturer size" required /></label> : null}
    </div>
    <input type="hidden" name="size_normalized_label" value={normalizedLabel} />
    <input type="hidden" name="sizing_system" value={sizingSystem} />
  </fieldset>;
}
