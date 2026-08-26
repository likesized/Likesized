"use client";

import { useEffect, useRef, useState } from "react";
import { ProductMiniBrowser } from "@/components/ProductMiniBrowser";
import styles from "@/app/explore/explore.module.css";

type SearchItem = { id: string; title: string; meta: string; href: string };
type SearchGroup = { total: number; items: SearchItem[] };
type SearchResponse = { garments: SearchGroup; outfits: SearchGroup; people: SearchGroup };
const EMPTY: SearchResponse = { garments: { total: 0, items: [] }, outfits: { total: 0, items: [] }, people: { total: 0, items: [] } };

export function ExploreSearch({ fixtures = false, initialQuery = "" }: { fixtures?: boolean; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestNumber = useRef(0);
  const skipInitialSearch = useRef(Boolean(initialQuery.trim()));

  async function runSearch(value: string, limit: number, showFull: boolean) {
    const cleaned = value.trim();
    if (!cleaned) { setResults(EMPTY); setOpen(false); return; }
    const current = ++requestNumber.current;
    setLoading(true);
    const params = new URLSearchParams({ q: cleaned, limit: String(limit) });
    if (fixtures) params.set("fixtures", "1");
    try {
      const response = await fetch(`/api/explore/search?${params.toString()}`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json() as SearchResponse;
      if (current === requestNumber.current) { setResults(data); setFull(showFull); setOpen(true); }
    } catch {
      if (current === requestNumber.current) { setResults(EMPTY); setFull(showFull); setOpen(true); }
    } finally { if (current === requestNumber.current) setLoading(false); }
  }

  useEffect(() => {
    if (skipInitialSearch.current) { skipInitialSearch.current = false; return; }
    const cleaned = query.trim();
    if (!cleaned) { setResults(EMPTY); setOpen(false); return; }
    const timer = window.setTimeout(() => { void runSearch(cleaned, 5, false); }, 220);
    return () => window.clearTimeout(timer);
  }, [query, fixtures]);

  const groups: Array<[keyof SearchResponse, string]> = [["garments", "Garments"], ["outfits", "Outfits"], ["people", "People"]];
  const total = results.garments.total + results.outfits.total + results.people.total;
  return <div className={styles.searchWrap}>
    <form className={styles.search} onSubmit={(event) => { event.preventDefault(); void runSearch(query, 24, true); }} role="search">
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => { if (query.trim() && results !== EMPTY) setOpen(true); }} placeholder="Search garments, outfits, or people" maxLength={80} autoComplete="off" aria-expanded={open} aria-controls="explore-search-results" />
      <button className="primaryButton" type="submit">Search</button>
    </form>
    {open ? <section id="explore-search-results" className={`${styles.searchResults} ${full ? styles.fullSearchResults : ""}`} aria-live="polite">
      <header><strong>{loading ? "Searching…" : `${total} result${total === 1 ? "" : "s"}`}</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close search results">×</button></header>
      {!loading && total === 0 ? <p>No results found.</p> : null}
      {groups.map(([key, title]) => { const group = results[key]; if (!group.total) return null; return <div className={styles.searchGroup} key={key}><h2>{title} <span>{group.total}</span></h2>{group.items.map((item) => <ProductMiniBrowser href={item.href} label={item.title} key={`${key}-${item.id}`}><span className={styles.searchSuggestion}><strong>{item.title}</strong><small>{item.meta}</small></span></ProductMiniBrowser>)}{!full && group.total > 5 ? <button type="button" className={styles.showGroup} onClick={() => void runSearch(query, 24, true)}>See all {group.total} {title.toLowerCase()}</button> : null}</div>; })}
    </section> : null}
  </div>;
}
