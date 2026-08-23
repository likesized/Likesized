"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COLOR_FAMILIES, GARMENT_CATEGORIES, GARMENT_TYPES, questionsForGarmentType, type GarmentCategoryKey } from "@/lib/garment-taxonomy";
import type { GarmentSizeKind } from "@/lib/domain";
import styles from "./fitReport.module.css";

type Brand = { id: string; name: string };
type ProductAttribute = { attribute_key: string; option_key: string; source_status: string };
type ProductMaterial = { material_key: string; percentage: number | null; source_status: string };
type ProductIdentifier = { identifier_type: string; original_value: string };
type ProductListing = { product_url: string | null };
export type CatalogProduct = {
  id: string;
  name: string;
  brand_name: string;
  garment_type_key: string | null;
  manufacturer_style_number: string | null;
  market_segment?: string | null;
  department_key?: string | null;
  default_size_kind?: GarmentSizeKind | null;
  image_url?: string | null;
  attributes?: ProductAttribute[];
  materials?: ProductMaterial[];
  identifiers?: ProductIdentifier[];
  listings?: ProductListing[];
};
export type CatalogOption = { key: string; label: string };
export type CatalogRetailerOption = { id: string; name: string; domain: string | null };

type PendingBarcodeMatch = {
  candidate_id: string;
  brand_name: string;
  product_name: string;
  garment_type_key: string | null;
  image_url: string | null;
  identity_confidence: string;
};
type BarcodeMatch =
  | { kind: "product"; product: CatalogProduct }
  | { kind: "candidate"; candidate: PendingBarcodeMatch };
type BarcodeLookupResponse = {
  local?: CatalogProduct[];
  barcode_match?: {
    match_kind: "product" | "candidate";
    product_id: string | null;
    candidate_id: string | null;
    brand_name: string;
    product_name: string;
    garment_type_key: string | null;
    image_url: string | null;
    identity_confidence: string;
  };
  error?: string;
};
type CandidateDefault = {
  candidate_id: string;
  default_size_kind: GarmentSizeKind | null;
  identity_confidence: string;
};

type CatalogContextValue = {
  product: CatalogProduct | null;
  candidateDefaultSizeKind: GarmentSizeKind | null;
  scannedBarcode: string;
};
const CatalogContext = createContext<CatalogContextValue>({ product: null, candidateDefaultSizeKind: null, scannedBarcode: "" });
const PERCENTAGES = Array.from({ length: 100 }, (_, index) => String(index + 1));
const PURCHASE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const PURCHASE_YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, index) => String(CURRENT_YEAR - index));

export function useCatalogGarment() {
  return useContext(CatalogContext);
}

function normalizeCatalogText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function applicableQuestions(typeKey: string, answers: Record<string, string>) {
  return questionsForGarmentType(typeKey).filter(
    (item) => item.key !== "neckline_height" || (answers.top_sleeve !== "strapless" && answers.swim_top !== "strapless"),
  );
}
function categoryForType(typeKey: string | null | undefined): GarmentCategoryKey | "" {
  return GARMENT_TYPES.find((item) => item.key === typeKey)?.category ?? "";
}

export function CatalogColorField() {
  const colors = [...COLOR_FAMILIES].sort((a, b) => a.label.localeCompare(b.label));
  return <label>Color<select name="color_family" defaultValue="" required data-review-label="Color"><option value="" disabled>Select a color</option>{colors.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>;
}

function CatalogDepartmentField({ departments }: { departments: CatalogOption[] }) {
  const { product } = useCatalogGarment();
  const sortedDepartments = useMemo(() => [...departments].sort((a, b) => a.label.localeCompare(b.label)), [departments]);
  const knownDepartment = product?.department_key ?? "";
  const [department, setDepartment] = useState("");

  useEffect(() => {
    setDepartment(knownDepartment);
  }, [product?.id, knownDepartment]);

  return <label>Department <span className="muted inlineMuted">optional</span>
    <select name="department" value={department} onChange={(event) => setDepartment(event.target.value)} data-review-label="Department">
      <option value="">Choose a department</option>
      {sortedDepartments.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}
      <option value="not_sure">Not sure</option>
    </select>
    {knownDepartment ? <span className="fieldHelp">Preselected from what LikeSized currently knows. Change it if your item says otherwise.</span> : null}
  </label>;
}

export function CatalogCommunityEnrichment({ materials, retailers }: { materials: CatalogOption[]; retailers: CatalogRetailerOption[] }) {
  const { product, scannedBarcode } = useCatalogGarment();
  const sortedMaterials = useMemo(() => [...materials]
    .filter((item) => item.key !== "other" && item.key !== "not_sure" && item.label.toLowerCase() !== "other")
    .sort((a, b) => a.label.localeCompare(b.label)), [materials]);
  const sortedRetailers = useMemo(() => [...retailers].sort((a, b) => a.name.localeCompare(b.name)), [retailers]);
  const knownMaterials = useMemo(() => (product?.materials ?? []).filter((row) => row.source_status !== "rejected"), [product]);
  const [materialRows, setMaterialRows] = useState<Array<{ material_key: string; percentage: string }>>([{ material_key: "", percentage: "" }]);
  const [purchaseMonth, setPurchaseMonth] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");

  useEffect(() => {
    setMaterialRows(knownMaterials.length
      ? knownMaterials.map((row) => ({ material_key: row.material_key === "other" ? "not_sure" : row.material_key, percentage: row.percentage == null ? "" : String(row.percentage) }))
      : [{ material_key: "", percentage: "" }]);
  }, [product?.id, knownMaterials]);

  const materialClaims = materialRows
    .filter((row) => row.material_key && row.material_key !== "not_sure")
    .map((row) => ({ material_key: row.material_key, percentage: row.percentage || null }));

  return <details className={styles.optionalDetails}>
    <summary className={styles.optionalSummary}>Optional Additional Information</summary>
    <div className={`fitDimensionFields ${styles.optionalDetailsBody}`}>
      <div className="privacyNote">
        <b>Help us learn more about this item</b>
        <div>Share any extra details you know. Every bit of information helps LikeSized build a better garment listing.</div>
      </div>

      <label>Purchased From <span className="muted inlineMuted">optional</span>
        <input name="purchased_from" list="retailer-options" maxLength={160} autoComplete="off" placeholder="Start typing a retailer" />
        <datalist id="retailer-options">{sortedRetailers.map((item) => <option value={item.name} key={item.id}>{item.domain ?? ""}</option>)}</datalist>
        <span className="fieldHelp">Choose a suggestion when it matches, or enter the retailer yourself.</span>
      </label>

      <label>Price Paid <span className="muted inlineMuted">optional</span>
        <input name="price_paid" type="number" inputMode="decimal" min="0" max="999999.99" step="0.01" placeholder="0.00" />
      </label>

      <label>Purchase Method <span className="muted inlineMuted">optional</span>
        <select name="purchase_method" defaultValue="">
          <option value="">Choose a method</option>
          <option value="online">Online</option>
          <option value="in_store">In Store</option>
          <option value="gift">Received as a Gift</option>
        </select>
      </label>

      <fieldset className="fitDimensionFields">
        <legend>Approx. Purchase Date <span className="muted inlineMuted">optional</span></legend>
        <div className="fieldPair">
          <label>Month
            <select name="purchase_month" value={purchaseMonth} required={Boolean(purchaseYear)} onChange={(event) => setPurchaseMonth(event.target.value)}>
              <option value="">Choose month</option>
              {PURCHASE_MONTHS.map((month, index) => <option value={String(index + 1)} key={month}>{month}</option>)}
            </select>
          </label>
          <label>Year
            <select name="purchase_year" value={purchaseYear} required={Boolean(purchaseMonth)} onChange={(event) => setPurchaseYear(event.target.value)}>
              <option value="">Choose year</option>
              {PURCHASE_YEARS.map((year) => <option value={year} key={year}>{year}</option>)}
            </select>
          </label>
        </div>
      </fieldset>

      {scannedBarcode
        ? <input type="hidden" name="scanned_barcode" value={scannedBarcode}/>
        : <label>UPC / barcode <span className="muted inlineMuted">optional</span>
            <input name="upc" inputMode="numeric" maxLength={32} placeholder="Enter the code if you have it" />
          </label>}

      <label>Manufacturer Style / Article Number <span className="muted inlineMuted">optional</span>
        <input name="style_number" maxLength={100} placeholder="Style, article, or model number" />
      </label>

      <fieldset className="fitDimensionFields">
        <legend>Material / Fabric Composition <span className="muted inlineMuted">optional</span></legend>
        {knownMaterials.length ? <p className="fieldHelp">Preselected from what LikeSized currently knows. Change any material or percentage if your item says otherwise.</p> : null}
        <div className="fitDimensionFields">
          {materialRows.map((row, index) => <div className="fieldPair" key={index}>
            <label>Material<select value={row.material_key} onChange={(event) => setMaterialRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, material_key: event.target.value, percentage: event.target.value === "not_sure" ? "" : item.percentage } : item))}>
              <option value="">Choose a material</option>
              {sortedMaterials.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}
              <option value="not_sure">Other / Not sure</option>
            </select></label>
            <label>Percentage <span className="muted inlineMuted">optional</span><select value={row.percentage} disabled={!row.material_key || row.material_key === "not_sure"} onChange={(event) => setMaterialRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, percentage: event.target.value } : item))}>
              <option value="">Leave blank if unknown</option>
              {PERCENTAGES.map((value) => <option value={value} key={value}>{value}%</option>)}
            </select></label>
            {materialRows.length > 1 ? <button className="catalogBackButton" type="button" onClick={() => setMaterialRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>Remove material</button> : null}
          </div>)}
        </div>
        <button className="catalogManualButton" type="button" onClick={() => setMaterialRows((current) => [...current, { material_key: "", percentage: "" }])}>Add another material</button>
        <input type="hidden" name="materials_json" value={JSON.stringify(materialClaims)} />
      </fieldset>

      <label>Product photo <span className="muted inlineMuted">optional</span>
        <input name="product_photo" type="file" accept="image/jpeg,image/png,image/webp" />
        <span className="fieldHelp">A clear photo of the item by itself helps LikeSized identify the exact product.</span>
      </label>
    </div>
  </details>;
}

export function CatalogGarmentFields({ brands, departments, fixtureProducts = [], children }: { brands: Brand[]; departments: CatalogOption[]; fixtureProducts?: CatalogProduct[]; children: ReactNode }) {
  const [step, setStep] = useState<"start" | "scan" | "confirm" | "details">("start");
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [candidateDefaultSizeKind, setCandidateDefaultSizeKind] = useState<GarmentSizeKind | null>(null);
  const [barcodeMatch, setBarcodeMatch] = useState<BarcodeMatch | null>(null);
  const [brand, setBrand] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<GarmentCategoryKey | "">("");
  const [type, setType] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [brandIssue, setBrandIssue] = useState(false);
  const [itemIssue, setItemIssue] = useState(false);
  const [typeIssue, setTypeIssue] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [itemSuggestions, setItemSuggestions] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const scannerVideo = useRef<HTMLVideoElement>(null);
  const scannerControls = useRef<{ stop: () => void } | null>(null);
  const barcodeBusy = useRef(false);

  const selectedType = GARMENT_TYPES.find((item) => item.key === type);
  const filteredTypes = category ? GARMENT_TYPES.filter((item) => item.category === category) : [];
  const questions = applicableQuestions(type, answers);
  const brandSuggestions = brand.trim()
    ? brands.filter((item) => normalizeCatalogText(item.name).includes(normalizeCatalogText(brand))).slice(0, 12)
    : [];

  function stopScanner() {
    scannerControls.current?.stop();
    scannerControls.current = null;
  }
  useEffect(() => () => stopScanner(), []);

  function resetDetails() {
    setProduct(null);
    setCandidateDefaultSizeKind(null);
    setBrand("");
    setItemName("");
    setCategory("");
    setType("");
    setAnswers({});
    setBrandIssue(false);
    setItemIssue(false);
    setTypeIssue(false);
    setItemSuggestions([]);
  }

  function chooseProduct(item: CatalogProduct, barcode = scannedBarcode) {
    stopScanner();
    setBarcodeMatch(null);
    setProduct(item);
    setCandidateDefaultSizeKind(null);
    setBrand(item.brand_name);
    setItemName(item.name);
    setCategory(categoryForType(item.garment_type_key));
    setType(item.garment_type_key ?? "");
    setAnswers({});
    setBrandIssue(false);
    setItemIssue(false);
    setTypeIssue(false);
    setScannedBarcode(barcode);
    setNotice("");
    setError("");
    setItemSuggestions([]);
    setStep("details");
  }

  function showBarcodeMatch(match: BarcodeMatch, barcode: string) {
    stopScanner();
    setBarcodeMatch(match);
    setScannedBarcode(barcode);
    setNotice("");
    setError("");
    setStep("confirm");
  }

  function enterManualAfterScan(message: string) {
    const barcode = scannedBarcode;
    stopScanner();
    resetDetails();
    setBarcodeMatch(null);
    setScannedBarcode(barcode);
    setNotice(message);
    setError("");
    setStep("details");
  }

  async function lookupBarcode(code: string) {
    const barcode = code.replace(/\D/g, "");
    if (!barcode || barcodeBusy.current) return;
    barcodeBusy.current = true;
    setLoadingBarcode(true);
    setError("");
    setScannedBarcode(barcode);
    try {
      const fixture = fixtureProducts.find((item) => (item.identifiers ?? []).some((identifier) => (identifier.identifier_type === "upc" || identifier.identifier_type === "barcode") && identifier.original_value.replace(/\D/g, "") === barcode));
      if (fixture) { showBarcodeMatch({ kind: "product", product: fixture }, barcode); return; }
      const response = await fetch(`/api/catalog/search?barcode=${encodeURIComponent(barcode)}`);
      const body = await response.json() as BarcodeLookupResponse;
      if (!response.ok) throw new Error(body.error ?? "Barcode lookup failed.");
      if (body.local?.[0]) { showBarcodeMatch({ kind: "product", product: body.local[0] }, barcode); return; }
      if (body.barcode_match?.match_kind === "candidate" && body.barcode_match.candidate_id) {
        showBarcodeMatch({ kind: "candidate", candidate: {
          candidate_id: body.barcode_match.candidate_id,
          brand_name: body.barcode_match.brand_name,
          product_name: body.barcode_match.product_name,
          garment_type_key: body.barcode_match.garment_type_key,
          image_url: body.barcode_match.image_url,
          identity_confidence: body.barcode_match.identity_confidence,
        } }, barcode);
        return;
      }
      stopScanner();
      resetDetails();
      setBarcodeMatch(null);
      setScannedBarcode(barcode);
      setNotice("We don’t have this item yet, but no problem — you can help us add it with just a few quick questions.");
      setStep("details");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Barcode lookup failed. Enter the item manually instead.");
    } finally {
      setLoadingBarcode(false);
      barcodeBusy.current = false;
    }
  }

  async function confirmBarcodeMatch() {
    if (!barcodeMatch || !scannedBarcode) return;
    setLoadingBarcode(true);
    setError("");
    try {
      const productId = barcodeMatch.kind === "product" ? barcodeMatch.product.id : null;
      const candidateId = barcodeMatch.kind === "candidate" ? barcodeMatch.candidate.candidate_id : null;
      const isFixture = productId ? fixtureProducts.some((item) => item.id === productId) : false;
      if (!isFixture) {
        const response = await fetch("/api/catalog/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: scannedBarcode, product_id: productId, candidate_id: candidateId }),
        });
        const body = await response.json() as { error?: string };
        if (!response.ok) throw new Error(body.error ?? "That barcode match could not be confirmed.");
      }

      if (barcodeMatch.kind === "product") {
        chooseProduct(barcodeMatch.product, scannedBarcode);
        return;
      }

      const candidate = barcodeMatch.candidate;
      const barcode = scannedBarcode;
      stopScanner();
      resetDetails();
      setBarcodeMatch(null);
      setBrand(candidate.brand_name);
      setItemName(candidate.product_name);
      setCategory(categoryForType(candidate.garment_type_key));
      setType(candidate.garment_type_key ?? "");
      setScannedBarcode(barcode);
      setNotice("We’ve seen this barcode before. You confirmed the item, so we filled in the identity LikeSized already knows. Finish the details for your copy.");
      setError("");
      setStep("details");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That barcode match could not be confirmed.");
    } finally {
      setLoadingBarcode(false);
    }
  }

  async function startScanner() {
    try {
      stopScanner();
      const video = scannerVideo.current;
      if (!video) throw new Error("Scanner is not ready");
      const { BrowserMultiFormatOneDReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatOneDReader(undefined, {
        delayBetweenScanAttempts: 50,
        delayBetweenScanSuccess: 250,
      });
      const videoConstraints: MediaTrackConstraints = {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };
      scannerControls.current = await reader.decodeFromConstraints({ video: videoConstraints }, video, (result) => {
        const code = result?.getText();
        if (code) { stopScanner(); void lookupBarcode(code); }
      });
    } catch {
      setError("Camera access was not available. Enter the item manually instead.");
    }
  }
  useEffect(() => {
    if (step !== "scan") return;
    const timer = window.setTimeout(() => void startScanner(), 50);
    return () => { clearTimeout(timer); stopScanner(); };
  }, [step]);

  useEffect(() => {
    if (step !== "details" || product || !brand.trim()) { setItemSuggestions([]); return; }
    setItemSuggestions([]);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog/search?brand=${encodeURIComponent(brand)}&q=${encodeURIComponent(itemName)}`, { signal: controller.signal });
        const body = await response.json() as { local?: CatalogProduct[] };
        const normalizedBrand = normalizeCatalogText(brand);
        const normalizedItem = normalizeCatalogText(itemName);
        const fixtures = fixtureProducts.filter((item) => normalizeCatalogText(item.brand_name) === normalizedBrand && normalizeCatalogText(item.name).includes(normalizedItem));
        const merged = [...fixtures, ...(body.local ?? [])]
          .filter((item) => normalizeCatalogText(item.brand_name) === normalizedBrand)
          .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);
        const exactMatch = normalizedItem ? merged.find((item) => normalizeCatalogText(item.name) === normalizedItem) : undefined;
        if (exactMatch) { chooseProduct(exactMatch); return; }
        setItemSuggestions(merged.slice(0, 12));
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setItemSuggestions([]);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [step, product, brand, itemName, fixtureProducts]);

  useEffect(() => {
    if (step !== "details" || product || !brand.trim() || !itemName.trim() || !type) {
      setCandidateDefaultSizeKind(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog/search?brand=${encodeURIComponent(brand)}&q=${encodeURIComponent(itemName)}&candidate_type=${encodeURIComponent(type)}`, { signal: controller.signal });
        const body = await response.json() as { candidate_default?: CandidateDefault | null };
        if (!response.ok) return;
        setCandidateDefaultSizeKind(body.candidate_default?.default_size_kind ?? null);
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setCandidateDefaultSizeKind(null);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [step, product, brand, itemName, type]);

  function beginManual() {
    stopScanner();
    resetDetails();
    setBarcodeMatch(null);
    setScannedBarcode("");
    setNotice("");
    setError("");
    setStep("details");
  }
  function reset() {
    stopScanner();
    resetDetails();
    setBarcodeMatch(null);
    setScannedBarcode("");
    setNotice("");
    setError("");
    setStep("start");
  }

  if (step === "start") return <section className={`fitDimensionFields ${styles.catalogStart}`}>
    <div className={styles.catalogStartActions}>
      <button className="catalogSearchButton" type="button" onClick={() => { setBarcodeMatch(null); setError(""); setStep("scan"); }}>Scan barcode</button>
      <span className="fieldHelp">or</span>
      <button className="catalogManualButton" type="button" onClick={beginManual}>Enter item manually</button>
    </div>
    <p className={styles.catalogStartCopy}>Have the item with you? Scan the barcode. Otherwise, enter it manually and we’ll take it from there.</p>
  </section>;

  if (step === "scan") return <section className={`fitDimensionFields ${styles.scanSection}`}>
    <button className="catalogBackButton" type="button" onClick={() => { stopScanner(); setBarcodeMatch(null); setError(""); setStep("start"); }}>← Back</button>
    <p className="fieldHelp">Scan the barcode and we’ll check the LikeSized catalog.</p>
    <video className="barcodeScanner" ref={scannerVideo} muted playsInline />
    {loadingBarcode ? <p className="fieldHelp" role="status">Checking LikeSized…</p> : null}
    {error ? <p className="fieldHelp" role="status">{error}</p> : null}
    <button className="catalogManualButton" type="button" onClick={beginManual}>Enter item manually instead</button>
  </section>;

  if (step === "confirm" && barcodeMatch) {
    const matchBrand = barcodeMatch.kind === "product" ? barcodeMatch.product.brand_name : barcodeMatch.candidate.brand_name;
    const matchName = barcodeMatch.kind === "product" ? barcodeMatch.product.name : barcodeMatch.candidate.product_name;
    const matchType = barcodeMatch.kind === "product" ? barcodeMatch.product.garment_type_key : barcodeMatch.candidate.garment_type_key;
    const matchImage = barcodeMatch.kind === "product" ? barcodeMatch.product.image_url : barcodeMatch.candidate.image_url;
    const typeLabel = GARMENT_TYPES.find((item) => item.key === matchType)?.label;
    return <section className={`fitDimensionFields ${styles.scanSection}`}>
      <button className="catalogBackButton" type="button" onClick={() => { setBarcodeMatch(null); setError(""); setStep("scan"); }}>← Scan again</button>
      <div className="privacyNote"><b>Is this the item?</b><div>{barcodeMatch.kind === "product" ? "LikeSized found this Product for the barcode you scanned." : "LikeSized has seen this barcode before, but the Product is still being confirmed."}</div></div>
      <div className="catalogSelectedItem">
        {matchImage ? <img src={matchImage} alt=""/> : <div className="garmentThumb" aria-hidden="true">{matchBrand.slice(0, 1).toUpperCase() || "LS"}</div>}
        <span><small>{barcodeMatch.kind === "product" ? "LikeSized catalog match" : "Previously submitted to LikeSized"}</small><b>{matchBrand} · {matchName}</b>{typeLabel ? <small>{typeLabel}</small> : null}<small>Barcode {scannedBarcode}</small></span>
      </div>
      {loadingBarcode ? <p className="fieldHelp" role="status">Confirming…</p> : null}
      {error ? <p className="fieldHelp" role="status">{error}</p> : null}
      <div className={styles.catalogStartActions}>
        <button className="catalogSearchButton" type="button" disabled={loadingBarcode} onClick={() => void confirmBarcodeMatch()}>Yes — this is the item</button>
        <button className="catalogManualButton" type="button" disabled={loadingBarcode} onClick={() => enterManualAfterScan("Enter the item details manually. We’ll keep the scanned barcode with your Fit Report as evidence.")}>No — enter manually</button>
      </div>
    </section>;
  }

  const guidance = product
    ? "We found this item. Answer the item details for your copy; learned size, Department, and material defaults can still be changed."
    : notice || "We don’t have this item yet, but no problem — you can help us add it with just a few quick questions.";
  const typeLocked = Boolean(product?.garment_type_key) && !typeIssue;

  return <>
    <input type="hidden" name="existing_product_id" value={product?.id ?? ""}/>
    <CatalogContext.Provider value={{ product, candidateDefaultSizeKind, scannedBarcode }}>
      <section className="fitDimensionFields">
        <button className="catalogBackButton" type="button" onClick={reset}>← Start over</button>
        <div className="privacyNote">{product ? <><b>Community-built product info</b><div>{guidance}</div></> : <b>{guidance}</b>}</div>
        {product?.image_url ? <div className="catalogSelectedItem"><img src={product.image_url} alt=""/><span><small>Selected item</small><b>{product.brand_name} · {product.name}</b></span></div> : null}

        <div className="fieldPair">
          <label>Brand / Make
            <input name="brand" list={brand.trim() && !product ? "brand-options" : undefined} maxLength={120} value={brand} readOnly={Boolean(product) && !brandIssue} onChange={(event) => { setBrand(event.target.value); setCandidateDefaultSizeKind(null); setItemSuggestions([]); }} required data-review-label="Brand" />
            <datalist id="brand-options">{brandSuggestions.map((item) => <option value={item.name} key={item.id}/>)}</datalist>
            {product && !brandIssue ? <button className="catalogBackButton" type="button" onClick={() => { setBrandIssue(true); setBrand(""); }}>Report an issue</button> : null}
          </label>
          <label>Item / Model
            <input name="product" maxLength={180} value={itemName} readOnly={Boolean(product) && !itemIssue} onChange={(event) => { setItemName(event.target.value); setCandidateDefaultSizeKind(null); setItemSuggestions([]); }} required placeholder="e.g. 501 Original" data-review-label="Item" />
            {product && !itemIssue ? <button className="catalogBackButton" type="button" onClick={() => { setItemIssue(true); setItemName(""); }}>Report an issue</button> : null}
          </label>
        </div>

        {!product && brand.trim() && itemSuggestions.length ? <div className="catalogSuggestionList">{itemSuggestions.map((item) => <button className="catalogSuggestion" type="button" onClick={() => chooseProduct(item)} key={item.id}><span><b>{item.brand_name} · {item.name}</b><small>Already in LikeSized</small></span></button>)}</div> : null}

        <label>Overall category
          <select name="garment_category" value={category} disabled={typeLocked} onChange={(event) => { setCategory(event.target.value as GarmentCategoryKey); setType(""); setCandidateDefaultSizeKind(null); setAnswers({}); }} required data-review-label="Overall category">
            <option value="" disabled>Select a category</option>
            {GARMENT_CATEGORIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
          {typeLocked ? <input type="hidden" name="garment_category" value={category}/> : null}
        </label>

        <label>Specific garment type
          <select name="garment_type" value={type} disabled={!category || typeLocked} onChange={(event) => { setType(event.target.value); setCandidateDefaultSizeKind(null); setAnswers({}); }} required data-review-label="Specific garment type">
            <option value="" disabled>{category ? "Select the specific garment" : "Choose a category first"}</option>
            {filteredTypes.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}
          </select>
          {typeLocked ? <><input type="hidden" name="garment_type" value={type}/><button className="catalogBackButton" type="button" onClick={() => { setTypeIssue(true); setCategory(""); setType(""); setCandidateDefaultSizeKind(null); setAnswers({}); }}>Report an issue</button></> : null}
          {selectedType && !typeLocked ? <span className="fieldHelp">Only {GARMENT_CATEGORIES.find((item) => item.value === selectedType.category)?.label} options are shown here.</span> : null}
        </label>

        <CatalogDepartmentField departments={departments} />

        {type ? <fieldset className="fitDimensionFields">
          <legend>Item details</legend>
          <p className="fieldHelp">Choose an answer for each simple item detail. If you truly can’t tell, Not sure is always the last choice.</p>
          <div className="fieldPair">{questions.map((item) => <label key={item.key}>{item.label}
            <select name={`product_attribute__${item.key}`} value={answers[item.key] ?? ""} required data-review-label={item.label} onChange={(event) => {
              const value = event.target.value;
              setAnswers((current) => {
                const next = { ...current, [item.key]: value };
                if ((item.key === "top_sleeve" || item.key === "swim_top") && value === "strapless") delete next.neckline_height;
                return next;
              });
            }}>
              <option value="" disabled>Select an answer</option>
              {item.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              <option value="not_sure">Not sure</option>
            </select>
          </label>)}</div>
        </fieldset> : null}
      </section>
      {children}
    </CatalogContext.Provider>
  </>;
}