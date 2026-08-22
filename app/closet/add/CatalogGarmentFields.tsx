"use client";

import { useEffect, useMemo, useState } from "react";
import { GARMENT_CATEGORIES, GARMENT_TYPES, questionsForGarmentType } from "@/lib/garment-taxonomy";

type Brand = { id: string; name: string };
type Product = { id: string; name: string; brand_name: string; garment_type_key: string | null; manufacturer_style_number: string | null };
type ExternalCandidate = { id: string; provider: string; brand: string; itemName: string; sourceUrl: string | null; imageUrl: string | null; styleId: string | null; barcode: string | null; sourceName: string | null };

function normalize(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""); }

export function CatalogGarmentFields({ brands, products }: { brands: Brand[]; products: Product[] }) {
  const [brand, setBrand] = useState("");
  const [itemName, setItemName] = useState("");
  const [garmentType, setGarmentType] = useState("");
  const [styleNumber, setStyleNumber] = useState("");
  const [existingProductId, setExistingProductId] = useState("");
  const [confirmation, setConfirmation] = useState<"" | "confirm" | "change" | "unsure">("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [onlineCandidates, setOnlineCandidates] = useState<ExternalCandidate[]>([]);
  const [catalogSourceUrl, setCatalogSourceUrl] = useState("");
  const [catalogSourceProvider, setCatalogSourceProvider] = useState("");

  const matches = useMemo(() => {
    const itemNeedle = normalize(itemName);
    const brandNeedle = normalize(brand);
    if (itemNeedle.length < 2) return [];
    return products.filter((item) => normalize(item.name).includes(itemNeedle) && (!brandNeedle || normalize(item.brand_name).includes(brandNeedle))).slice(0, 8);
  }, [brand, itemName, products]);

  const selectedType = GARMENT_TYPES.find((item) => item.key === garmentType);
  const visibleQuestions = questionsForGarmentType(garmentType).filter((item) => item.key !== "neckline_height" || (answers.top_sleeve !== "strapless" && answers.swim_top !== "strapless"));

  useEffect(() => {
    const query = [brand, itemName].filter(Boolean).join(" ").trim();
    if (query.length < 3 || existingProductId) { setOnlineCandidates([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { external?: ExternalCandidate[] };
        setOnlineCandidates(payload.external ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setOnlineCandidates([]);
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [brand, itemName, existingProductId]);

  function clearExact() {
    if (!existingProductId && !catalogSourceUrl) return;
    setExistingProductId("");
    setConfirmation("");
    setCatalogSourceUrl("");
    setCatalogSourceProvider("");
  }
  function chooseExisting(id: string) {
    const selected = products.find((item) => item.id === id);
    if (!selected) return;
    setExistingProductId(selected.id);
    setConfirmation("");
    setBrand(selected.brand_name);
    setItemName(selected.name);
    setGarmentType(selected.garment_type_key ?? "");
    setStyleNumber(selected.manufacturer_style_number ?? "");
    setAnswers({});
    setCatalogSourceUrl("");
    setCatalogSourceProvider("");
  }
  function chooseOnline(item: ExternalCandidate) {
    setExistingProductId("");
    setConfirmation("");
    if (!brand && item.brand) setBrand(item.brand);
    setItemName(item.itemName);
    setStyleNumber(item.styleId ?? "");
    setCatalogSourceUrl(item.sourceUrl ?? "");
    setCatalogSourceProvider(item.provider);
    setOnlineCandidates([]);
  }

  return <>
    <input type="hidden" name="existing_product_id" value={existingProductId} />
    <input type="hidden" name="catalog_confirmation" value={confirmation} />
    <input type="hidden" name="catalog_source_url" value={catalogSourceUrl} />
    <input type="hidden" name="catalog_source_provider" value={catalogSourceProvider} />
    <div className="fieldPair">
      <label>Brand<input name="brand" list="brand-options" maxLength={120} placeholder="Levi's" value={brand} onChange={(event) => { clearExact(); setBrand(event.target.value); }} required /><datalist id="brand-options">{brands.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
      <label>Item name<input name="product" maxLength={180} placeholder="541 Athletic Taper" value={itemName} onChange={(event) => { clearExact(); setItemName(event.target.value); }} required /></label>
    </div>
    {matches.length > 0 && !existingProductId ? <label>Possible existing items<select value="" onChange={(event) => chooseExisting(event.target.value)}><option value="">Choose one only if it is the exact item</option>{matches.map((item) => <option value={item.id} key={item.id}>{item.brand_name} · {item.name}{item.manufacturer_style_number ? ` · Style ${item.manufacturer_style_number}` : ""}</option>)}</select></label> : null}
    {onlineCandidates.length > 0 && !existingProductId ? <fieldset className="fitDimensionFields"><legend>Items found online</legend><div className="catalogSuggestionList">{onlineCandidates.map((item) => <button className="catalogSuggestion" type="button" onClick={() => chooseOnline(item)} key={item.id}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}<span><b>{item.itemName}</b>{item.sourceName ? <small>{item.sourceName}</small> : null}</span></button>)}</div></fieldset> : null}
    {existingProductId ? <fieldset className="fitDimensionFields"><legend>Are the saved item details correct?</legend><div className="fieldPair"><label><input type="radio" checked={confirmation === "confirm"} onChange={() => setConfirmation("confirm")} /> Yes, they’re correct</label><label><input type="radio" checked={confirmation === "change"} onChange={() => setConfirmation("change")} /> I need to change something</label><label><input type="radio" checked={confirmation === "unsure"} onChange={() => setConfirmation("unsure")} /> Not sure</label></div><span className="fieldHelp">A clear confirmation from a different person strengthens the saved information. “Not sure” adds no evidence.</span></fieldset> : null}
    <label>Garment type<select name="garment_type" value={garmentType} onChange={(event) => { if (!existingProductId || confirmation !== "change") clearExact(); setGarmentType(event.target.value); setAnswers({}); }} required><option value="" disabled>Select the specific garment</option>{GARMENT_CATEGORIES.map((category) => <optgroup key={category.value} label={category.label}>{GARMENT_TYPES.filter((item) => item.category === category.value).map((type) => <option value={type.key} key={type.key}>{type.label}</option>)}</optgroup>)}</select>{selectedType ? <span className="fieldHelp">LikeSized will place this under {GARMENT_CATEGORIES.find((item) => item.value === selectedType.category)?.label} automatically.</span> : null}</label>
    {garmentType && (!existingProductId || confirmation === "change") ? <fieldset className="fitDimensionFields"><legend>Optional item details</legend><p className="fieldHelp">Choose only what you know. “Not sure” is always safe and records no claim.</p><div className="fieldPair">{visibleQuestions.map((item) => <label key={item.key}>{item.label}<select name={`product_attribute__${item.key}`} value={answers[item.key] ?? ""} onChange={(event) => { const value = event.target.value; setAnswers((current) => { const next = { ...current, [item.key]: value }; if ((item.key === "top_sleeve" || item.key === "swim_top") && value === "strapless") delete next.neckline_height; return next; }); }}><option value="">Not sure</option>{item.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}</div></fieldset> : null}
    <label>Manufacturer Style ID <span className="muted inlineMuted">optional</span><input name="style_number" maxLength={100} placeholder="Style number, if available" value={styleNumber} onChange={(event) => { clearExact(); setStyleNumber(event.target.value); }} /></label>
  </>;
}
