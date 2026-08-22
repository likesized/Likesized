"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { COLOR_FAMILIES, GARMENT_CATEGORIES, GARMENT_TYPES, questionsForGarmentType } from "@/lib/garment-taxonomy";
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
  image_url?: string | null;
  attributes?: ProductAttribute[];
  materials?: ProductMaterial[];
  identifiers?: ProductIdentifier[];
  listings?: ProductListing[];
};
export type CatalogOption = { key: string; label: string };

type CatalogContextValue = {
  product: CatalogProduct | null;
  scannedBarcode: string;
};
const CatalogContext = createContext<CatalogContextValue>({ product: null, scannedBarcode: "" });
const PERCENTAGES = Array.from({ length: 100 }, (_, index) => String(index + 1));

function normalizeCatalogText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function productAttributes(product: CatalogProduct | null) {
  void product;
  return {} as Record<string, string>;
}
function applicableQuestions(typeKey: string, answers: Record<string, string>) {
  return questionsForGarmentType(typeKey).filter(
    (item) => item.key !== "neckline_height" || (answers.top_sleeve !== "strapless" && answers.swim_top !== "strapless"),
  );
}

export function CatalogColorField() {
  const colors = [...COLOR_FAMILIES].sort((a, b) => a.label.localeCompare(b.label));
  return <label>Color<select name="color_family" defaultValue="" required><option value="" disabled>Select a color</option>{colors.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>;
}

export function CatalogCommunityEnrichment({ materials, departments }: { materials: CatalogOption[]; departments: CatalogOption[] }) {
  const { product, scannedBarcode } = useContext(CatalogContext);
  const sortedMaterials = useMemo(() => [...materials]
    .filter((item) => item.key !== "other" && item.key !== "not_sure" && item.label.toLowerCase() !== "other")
    .sort((a, b) => a.label.localeCompare(b.label)), [materials]);
  const sortedDepartments = useMemo(() => [...departments].sort((a, b) => a.label.localeCompare(b.label)), [departments]);
  const knownMaterials = useMemo(() => (product?.materials ?? []).filter((row) => row.source_status !== "rejected"), [product]);
  const knownDepartment = product?.department_key ?? "";
  const knownStyle = product?.manufacturer_style_number ?? "";
  const knownCodes = [...new Set((product?.identifiers ?? [])
    .filter((row) => row.identifier_type === "upc" || row.identifier_type === "barcode")
    .map((row) => row.original_value)
    .filter(Boolean))];
  const knownLinks = [...new Set((product?.listings ?? []).map((row) => row.product_url).filter((value): value is string => Boolean(value)))];
  const [styleIssue, setStyleIssue] = useState(false);
  const [barcodeIssue, setBarcodeIssue] = useState(false);
  const [departmentIssue, setDepartmentIssue] = useState(false);
  const [materialIssue, setMaterialIssue] = useState(false);
  const [materialRows, setMaterialRows] = useState<Array<{ material_key: string; percentage: string }>>([{ material_key: "", percentage: "" }]);

  useEffect(() => {
    setStyleIssue(false);
    setBarcodeIssue(false);
    setDepartmentIssue(false);
    setMaterialIssue(false);
    setMaterialRows(knownMaterials.length
      ? knownMaterials.map((row) => ({ material_key: row.material_key === "other" ? "not_sure" : row.material_key, percentage: row.percentage == null ? "" : String(row.percentage) }))
      : [{ material_key: "", percentage: "" }]);
  }, [product?.id, knownMaterials]);

  const materialsEditable = !knownMaterials.length || materialIssue;
  const materialClaims = materialRows
    .filter((row) => row.material_key && row.material_key !== "not_sure")
    .map((row) => ({ material_key: row.material_key, percentage: row.percentage || null }));

  return <section className="fitDimensionFields catalogOptionalSection">
    <div className="privacyNote">
      <b>Help us learn more about this item</b>
      <div>Share any extra details you know. Every bit of information helps us build a better garment listing.</div>
    </div>

    <label>Retail link <span className="muted inlineMuted">optional</span>
      <input name="product_url" type="url" maxLength={1000} placeholder="https://..." />
      {knownLinks.length ? <span className="fieldHelp">Already saved: {knownLinks.slice(0, 3).join(" · ")}</span> : null}
    </label>

    {scannedBarcode
      ? <input type="hidden" name="scanned_barcode" value={scannedBarcode}/>
      : product && knownCodes.length && !barcodeIssue
        ? <label>UPC / barcode <span className="muted inlineMuted">saved</span>
            <input value={knownCodes.join(" · ")} readOnly />
            <button className="catalogBackButton" type="button" onClick={() => setBarcodeIssue(true)}>Report an issue</button>
          </label>
        : product && knownCodes.length && barcodeIssue
          ? <label>UPC / barcode <span className="muted inlineMuted">report an issue</span>
              <input name="identity_issue_barcode" inputMode="numeric" maxLength={32} placeholder="Enter the code you believe is correct" />
            </label>
          : <label>UPC / barcode <span className="muted inlineMuted">optional</span>
              <input name="upc" inputMode="numeric" maxLength={32} placeholder="Enter the code if you have it" />
            </label>}

    {product && knownStyle && !styleIssue
      ? <label>Manufacturer Style / Article Number <span className="muted inlineMuted">saved</span><input value={knownStyle} readOnly /><button className="catalogBackButton" type="button" onClick={() => setStyleIssue(true)}>Report an issue</button></label>
      : <label>Manufacturer Style / Article Number <span className="muted inlineMuted">optional</span><input name={product && knownStyle ? "identity_issue_style" : "style_number"} maxLength={100} defaultValue={product && knownStyle ? "" : knownStyle} placeholder={product && knownStyle ? "Enter what you believe is correct" : "Style, article, or model number"} /></label>}

    {product && knownDepartment && !departmentIssue
      ? <label>Department <span className="muted inlineMuted">saved</span><input value={sortedDepartments.find((item) => item.key === knownDepartment)?.label ?? knownDepartment} readOnly /><button className="catalogBackButton" type="button" onClick={() => setDepartmentIssue(true)}>Report an issue</button></label>
      : <label>Department <span className="muted inlineMuted">optional</span><select name="department" defaultValue=""><option value="">Choose a department</option>{sortedDepartments.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}<option value="not_sure">Not sure</option></select></label>}

    <fieldset className="fitDimensionFields">
      <legend>Material / Fabric Composition <span className="muted inlineMuted">optional</span></legend>
      {knownMaterials.length && !materialIssue ? <>
        <p className="fieldHelp">Saved: {knownMaterials.map((row) => `${row.material_key === "other" ? "Other / Not sure" : (sortedMaterials.find((item) => item.key === row.material_key)?.label ?? row.material_key)}${row.percentage == null ? "" : ` ${row.percentage}%`}`).join(" · ")}</p>
        <button className="catalogBackButton" type="button" onClick={() => setMaterialIssue(true)}>Report an issue</button>
      </> : null}
      {materialsEditable ? <>
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
        {materialIssue ? <input type="hidden" name="material_issue" value="1" /> : null}
      </> : null}
    </fieldset>

    <label>Product photo <span className="muted inlineMuted">optional</span>
      <input name="product_photo" type="file" accept="image/jpeg,image/png,image/webp" />
      <span className="fieldHelp">A clear photo of the item by itself helps LikeSized identify the exact product.</span>
    </label>
  </section>;
}

export function CatalogGarmentFields({ brands, fixtureProducts = [], children }: { brands: Brand[]; fixtureProducts?: CatalogProduct[]; children: ReactNode }) {
  const [step, setStep] = useState<"start" | "scan" | "details">("start");
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [brand, setBrand] = useState("");
  const [itemName, setItemName] = useState("");
  const [type, setType] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attributeIssues, setAttributeIssues] = useState<Record<string, boolean>>({});
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
    setBrand("");
    setItemName("");
    setType("");
    setAnswers({});
    setAttributeIssues({});
    setBrandIssue(false);
    setItemIssue(false);
    setTypeIssue(false);
    setItemSuggestions([]);
  }

  function chooseProduct(item: CatalogProduct, barcode = scannedBarcode) {
    stopScanner();
    setProduct(item);
    setBrand(item.brand_name);
    setItemName(item.name);
    setType(item.garment_type_key ?? "");
    setAnswers(productAttributes(item));
    setAttributeIssues({});
    setBrandIssue(false);
    setItemIssue(false);
    setTypeIssue(false);
    setScannedBarcode(barcode);
    setNotice("");
    setError("");
    setItemSuggestions([]);
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
      if (fixture) { chooseProduct(fixture, barcode); return; }
      const response = await fetch(`/api/catalog/search?barcode=${encodeURIComponent(barcode)}`);
      const body = await response.json() as { local?: CatalogProduct[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Barcode lookup failed.");
      if (body.local?.[0]) { chooseProduct(body.local[0], barcode); return; }
      stopScanner();
      resetDetails();
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

  async function startScanner() {
    try {
      stopScanner();
      const video = scannerVideo.current;
      if (!video) throw new Error("Scanner is not ready");
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      scannerControls.current = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, video, (result) => {
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
    if (step !== "details" || product || !brand.trim() || !itemName.trim()) { setItemSuggestions([]); return; }
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
        const exactMatch = merged.find((item) => normalizeCatalogText(item.name) === normalizedItem);
        if (exactMatch) { chooseProduct(exactMatch); return; }
        setItemSuggestions(merged.slice(0, 12));
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setItemSuggestions([]);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [step, product, brand, itemName, fixtureProducts]);

  function beginManual() {
    stopScanner();
    resetDetails();
    setScannedBarcode("");
    setNotice("");
    setError("");
    setStep("details");
  }
  function reset() {
    stopScanner();
    resetDetails();
    setScannedBarcode("");
    setNotice("");
    setError("");
    setStep("start");
  }

  if (step === "start") return <section className={`fitDimensionFields ${styles.catalogStart}`}>
    <div className={styles.catalogStartActions}>
      <button className="catalogSearchButton" type="button" onClick={() => { setError(""); setStep("scan"); }}>Scan barcode</button>
      <span className="fieldHelp">or</span>
      <button className="catalogManualButton" type="button" onClick={beginManual}>Enter item manually</button>
    </div>
    <p className={styles.catalogStartCopy}>Have the item with you? Scan the barcode. Otherwise, enter it manually and we’ll take it from there.</p>
  </section>;

  if (step === "scan") return <section className={`fitDimensionFields ${styles.scanSection}`}>
    <button className="catalogBackButton" type="button" onClick={() => { stopScanner(); setError(""); setStep("start"); }}>← Back</button>
    <p className="fieldHelp">Scan the barcode and we’ll check the LikeSized catalog.</p>
    <video className="barcodeScanner" ref={scannerVideo} muted playsInline />
    {loadingBarcode ? <p className="fieldHelp" role="status">Checking LikeSized…</p> : null}
    {error ? <p className="fieldHelp" role="status">{error}</p> : null}
    <button className="catalogManualButton" type="button" onClick={beginManual}>Enter item manually instead</button>
  </section>;

  const canonicalAnswers = productAttributes(product);
  const canonicalQuestions = product?.garment_type_key ? applicableQuestions(product.garment_type_key, canonicalAnswers) : [];
  const isComplete = Boolean(product?.garment_type_key) && canonicalQuestions.every((question) => Boolean(canonicalAnswers[question.key]));
  const guidance = product
    ? isComplete
      ? "This item’s community record is filled in. Review the locked details, report anything that looks wrong, then tell us how it fits."
      : "Built by the community. Fill in anything you know that’s still missing, and report anything that looks wrong."
    : notice || "We don’t have this item yet, but no problem — you can help us add it with just a few quick questions.";

  return <>
    <input type="hidden" name="existing_product_id" value={product?.id ?? ""}/>
    <CatalogContext.Provider value={{ product, scannedBarcode }}>
      <section className="fitDimensionFields">
        <button className="catalogBackButton" type="button" onClick={reset}>← Start over</button>
        <div className="privacyNote">{product ? <><b>Community-built product info</b><div>{guidance}</div></> : <b>{guidance}</b>}</div>
        {product?.image_url ? <div className="catalogSelectedItem"><img src={product.image_url} alt=""/><span><small>Selected item</small><b>{product.brand_name} · {product.name}</b></span></div> : null}

        <div className="fieldPair">
          <label>Brand / Make
            <input name="brand" list={brand.trim() && !product ? "brand-options" : undefined} maxLength={120} value={brand} readOnly={Boolean(product) && !brandIssue} onChange={(event) => { setBrand(event.target.value); setItemSuggestions([]); }} required />
            <datalist id="brand-options">{brandSuggestions.map((item) => <option value={item.name} key={item.id}/>)}</datalist>
            {product && !brandIssue ? <button className="catalogBackButton" type="button" onClick={() => { setBrandIssue(true); setBrand(""); }}>Report an issue</button> : null}
          </label>
          <label>Item / Model
            <input name="product" maxLength={180} value={itemName} readOnly={Boolean(product) && !itemIssue} onChange={(event) => { setItemName(event.target.value); setItemSuggestions([]); }} required placeholder="e.g. 501 Original" />
            {product && !itemIssue ? <button className="catalogBackButton" type="button" onClick={() => { setItemIssue(true); setItemName(""); }}>Report an issue</button> : null}
          </label>
        </div>

        {!product && brand.trim() && itemName.trim() && itemSuggestions.length ? <div className="catalogSuggestionList">{itemSuggestions.map((item) => <button className="catalogSuggestion" type="button" onClick={() => chooseProduct(item)} key={item.id}><span><b>{item.brand_name} · {item.name}</b><small>Already in LikeSized</small></span></button>)}</div> : null}

        <label>Garment type
          <select name="garment_type" value={type} disabled={Boolean(product?.garment_type_key) && !typeIssue} onChange={(event) => { setType(event.target.value); setAnswers({}); setAttributeIssues({}); }} required>
            <option value="" disabled>Select the specific garment</option>
            {GARMENT_CATEGORIES.map((category) => <optgroup key={category.value} label={category.label}>{GARMENT_TYPES.filter((item) => item.category === category.value).map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</optgroup>)}
          </select>
          {product?.garment_type_key && !typeIssue ? <><input type="hidden" name="garment_type" value={type}/><button className="catalogBackButton" type="button" onClick={() => { setTypeIssue(true); setType(""); setAnswers({}); setAttributeIssues({}); }}>Report an issue</button></> : null}
          {selectedType ? <span className="fieldHelp">LikeSized files this under {GARMENT_CATEGORIES.find((item) => item.value === selectedType.category)?.label} automatically.</span> : null}
        </label>

        {type ? <fieldset className="fitDimensionFields">
          <legend>Item details</legend>
          <p className="fieldHelp">Choose an answer for each simple item detail. If you truly can’t tell, Not sure is always the last choice.</p>
          <div className="fieldPair">{questions.map((item) => {
            const knownValue = product?.garment_type_key === type ? canonicalAnswers[item.key] : "";
            const locked = Boolean(knownValue) && !attributeIssues[item.key];
            return <label key={item.key}>{item.label}
              <select name={locked ? undefined : `product_attribute__${item.key}`} value={answers[item.key] ?? ""} disabled={locked} required={!locked} onChange={(event) => {
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
              {locked ? <><input type="hidden" name={`product_attribute__${item.key}`} value={knownValue}/><button className="catalogBackButton" type="button" onClick={() => { setAttributeIssues((current) => ({ ...current, [item.key]: true })); setAnswers((current) => ({ ...current, [item.key]: "" })); }}>Report an issue</button></> : null}
            </label>;
          })}</div>
        </fieldset> : null}
      </section>
      {children}
    </CatalogContext.Provider>
  </>;
}