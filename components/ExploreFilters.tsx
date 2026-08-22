"use client";

import { useState } from "react";
import Link from "next/link";
import { COLOR_FAMILIES, GARMENT_CATEGORIES, GARMENT_TYPES, questionsForGarmentType } from "@/lib/garment-taxonomy";
import styles from "@/app/explore/explore.module.css";

type Brand = { id: string; name: string };
type Values = { category: string; type: string; brand: string; item: string; color: string; attributes: Record<string, string> };

export function ExploreFilters({ scope, brands, initial, fixtures }: { scope: string; brands: Brand[]; initial: Values; fixtures: boolean }) {
  const [category, setCategory] = useState(initial.category);
  const [type, setType] = useState(initial.type);
  const [attributes, setAttributes] = useState<Record<string, string>>(initial.attributes);
  const questions = questionsForGarmentType(type).filter((item) => item.key !== "neckline_height" || (attributes.top_sleeve !== "strapless" && attributes.swim_top !== "strapless"));
  const clearHref = `/explore?view=garments&scope=${scope}${fixtures ? "&preview=fixtures" : ""}`;
  return <details className={styles.filters} open={Boolean(category || type || initial.brand || initial.item || initial.color || Object.keys(initial.attributes).length)}>
    <summary>Filter garments</summary>
    <form action="/explore">
      <input type="hidden" name="view" value="garments" />
      <input type="hidden" name="scope" value={scope} />
      {fixtures ? <input type="hidden" name="preview" value="fixtures" /> : null}
      <label>Category<select name="category" value={category} onChange={(event) => { setCategory(event.target.value); setType(""); setAttributes({}); }}><option value="">All categories</option>{GARMENT_CATEGORIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      <label>Type<select name="type" value={type} disabled={!category} onChange={(event) => { setType(event.target.value); setAttributes({}); }}><option value="">{category ? "All types" : "Select category first"}</option>{GARMENT_TYPES.filter((item) => item.category === category).map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></label>
      {questions.map((question) => <label key={question.key}>{question.label}<select name={`attr_${question.key}`} value={attributes[question.key] ?? ""} onChange={(event) => { const value = event.target.value; setAttributes((current) => { const next = { ...current, [question.key]: value }; if (!value) delete next[question.key]; if ((question.key === "top_sleeve" || question.key === "swim_top") && value === "strapless") delete next.neckline_height; return next; }); }}><option value="">All</option>{question.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}
      <label>Brand<select name="brand" defaultValue={initial.brand}><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      <label>Item name<input name="item" defaultValue={initial.item} placeholder="Exact item name" /></label>
      <label>Color<select name="color" defaultValue={initial.color}><option value="">All colors</option>{COLOR_FAMILIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      <button className="primaryButton">Apply filters</button>
      <Link className="secondaryButton" href={clearHref}>Clear</Link>
    </form>
    <p>Filters are strict. Explore will never silently broaden your choices.</p>
  </details>;
}
