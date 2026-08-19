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
  const [kind, setKind] = useState<GarmentSizeKind>("alpha");
  const [alpha, setAlpha] = useState("M");
  const [numeric, setNumeric] = useState("8");
  const [waist, setWaist] = useState("30");
  const [inseam, setInseam] = useState("30");
  const [collar, setCollar] = useState("16.5");
  const [sleeveMin, setSleeveMin] = useState("34");
  const [sleeveMax, setSleeveMax] = useState("35");
  const [jacket, setJacket] = useState("42");
  const [jacketLength, setJacketLength] = useState("regular");
  const [braBand, setBraBand] = useState("36");
  const [braCup, setBraCup] = useState("D");
  const [braSystem, setBraSystem] = useState("US");
  const [shoe, setShoe] = useState("9");
  const [shoeSystem, setShoeSystem] = useState("US");
  const [length, setLength] = useState("regular");
  const [freeform, setFreeform] = useState("");

  const normalizedLabel = useMemo(() => {
    switch (kind) {
      case "alpha": return alpha;
      case "numeric": return cleanNumber(numeric);
      case "waist_inseam": return waist && inseam ? `${cleanNumber(waist)}×${cleanNumber(inseam)}` : "";
      case "dress_shirt": {
        if (!collar || !sleeveMin) return "";
        const max = sleeveMax || sleeveMin;
        return `${cleanNumber(collar)} / ${cleanNumber(sleeveMin)}${max !== sleeveMin ? `-${cleanNumber(max)}` : ""}`;
      }
      case "jacket": {
        const code = jacketLength === "short" ? "S" : jacketLength === "long" ? "L" : "R";
        return jacket ? `${cleanNumber(jacket)}${code}` : "";
      }
      case "bra": return braBand && braCup ? `${cleanNumber(braBand)}${braCup}` : "";
      case "shoe": return cleanNumber(shoe);
      case "length_designation": return length;
      case "freeform": return freeform.trim();
    }
  }, [kind, alpha, numeric, waist, inseam, collar, sleeveMin, sleeveMax, jacket, jacketLength, braBand, braCup, shoe, length, freeform]);

  const sizingSystem = kind === "bra" ? braSystem : kind === "shoe" ? shoeSystem : "";

  return <fieldset className="garmentSizeFields">
    <legend>Garment size</legend>
    <div className="fieldPair">
      <label>Size system
        <select name="size_kind" value={kind} onChange={(event)=>setKind(event.target.value as GarmentSizeKind)}>
          {SIZE_KINDS.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
      </label>
      {kind === "alpha" ? <label>Letter size<select value={alpha} onChange={(e)=>setAlpha(e.target.value)}>{ALPHA_SIZES.map((value)=><option value={value} key={value}>{value}</option>)}</select></label> : null}
      {kind === "numeric" ? <label>Numeric size<input type="number" inputMode="decimal" min="0" max="100" step="0.5" value={numeric} onChange={(e)=>setNumeric(e.target.value)} required /></label> : null}
      {kind === "waist_inseam" ? <><label>Waist size<input type="number" inputMode="numeric" min="18" max="80" step="1" value={waist} onChange={(e)=>setWaist(e.target.value)} required /></label><label>Inseam size<input type="number" inputMode="numeric" min="18" max="50" step="1" value={inseam} onChange={(e)=>setInseam(e.target.value)} required /></label></> : null}
      {kind === "dress_shirt" ? <><label>Collar / neck size<input type="number" inputMode="decimal" min="10" max="30" step="0.25" value={collar} onChange={(e)=>setCollar(e.target.value)} required /></label><label>Sleeve start<input type="number" inputMode="numeric" min="20" max="50" step="1" value={sleeveMin} onChange={(e)=>setSleeveMin(e.target.value)} required /></label><label>Sleeve end <span className="muted inlineMuted">optional range</span><input type="number" inputMode="numeric" min="20" max="50" step="1" value={sleeveMax} onChange={(e)=>setSleeveMax(e.target.value)} /></label></> : null}
      {kind === "jacket" ? <><label>Jacket / chest size<input type="number" inputMode="numeric" min="20" max="80" step="1" value={jacket} onChange={(e)=>setJacket(e.target.value)} required /></label><label>Length<select value={jacketLength} onChange={(e)=>setJacketLength(e.target.value)}><option value="short">Short (S)</option><option value="regular">Regular (R)</option><option value="long">Long (L)</option></select></label></> : null}
      {kind === "bra" ? <><label>Band<input type="number" inputMode="numeric" min="20" max="70" step="2" value={braBand} onChange={(e)=>setBraBand(e.target.value)} required /></label><label>Cup<select value={braCup} onChange={(e)=>setBraCup(e.target.value)}>{BRA_CUPS.map((value)=><option value={value} key={value}>{value}</option>)}</select></label><label>Sizing system<select value={braSystem} onChange={(e)=>setBraSystem(e.target.value)}>{BRA_SYSTEMS.map((value)=><option value={value} key={value}>{value}</option>)}</select></label></> : null}
      {kind === "shoe" ? <><label>Shoe size<input type="number" inputMode="decimal" min="0" max="30" step="0.5" value={shoe} onChange={(e)=>setShoe(e.target.value)} required /></label><label>Sizing system<select value={shoeSystem} onChange={(e)=>setShoeSystem(e.target.value)}>{SHOE_SYSTEMS.map((value)=><option value={value} key={value}>{value}</option>)}</select></label></> : null}
      {kind === "length_designation" ? <label>Length designation<select value={length} onChange={(e)=>setLength(e.target.value)}>{LENGTHS.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}</select></label> : null}
      {kind === "freeform" ? <label>Manufacturer size<input value={freeform} onChange={(e)=>setFreeform(e.target.value)} maxLength={60} placeholder="Unusual manufacturer size" required /></label> : null}
    </div>
    <input type="hidden" name="size_normalized_label" value={normalizedLabel} />
    <input type="hidden" name="sizing_system" value={sizingSystem} />
    <label>Original label exactly as printed <span className="muted inlineMuted">optional</span>
      <input name="original_size_label" maxLength={60} placeholder={normalizedLabel || "Enter only if the tag prints it differently"} />
      <span className="fieldHelp">Matching uses the structured size above. If the tag prints a different format, LikeSized preserves that exact label here without turning it into a separate logical size.</span>
    </label>
    {normalizedLabel ? <div className="privacyNote"><b>Normalized size:</b> {normalizedLabel}</div> : null}
  </fieldset>;
}
