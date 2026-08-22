import "server-only";

export type ExternalCatalogProvider = "brave_search" | "upcitemdb";

export type ExternalCatalogCandidate = {
  id: string;
  provider: ExternalCatalogProvider;
  brand: string;
  itemName: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  styleId: string | null;
  barcode: string | null;
  sourceName: string | null;
};

function clean(value: unknown, maximum = 180) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maximum) : "";
}

function isBarcode(value: string) {
  return /^\d{8}$|^\d{12,14}$/.test(value.replace(/\D/g, ""));
}

function domainName(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return "Online result"; }
}

async function json(url: URL) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Catalog source returned ${response.status}`);
  return response.json() as Promise<unknown>;
}

export function enabledExternalCatalogProviders(query: string): ExternalCatalogProvider[] {
  const providers: ExternalCatalogProvider[] = [];
  if (process.env.BRAVE_SEARCH_API_KEY) providers.push("brave_search");
  if (isBarcode(query)) providers.push("upcitemdb");
  return providers;
}

export async function searchBraveCatalogCandidates(query: string): Promise<ExternalCatalogCandidate[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "8");
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000), headers: { "X-Subscription-Token": apiKey, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Catalog source returned ${response.status}`);
  const payload = await response.json() as { web?: { results?: Array<Record<string, unknown>> } };
  return (payload.web?.results ?? []).slice(0, 8).map((row, index) => {
    const title = clean(row.title);
    const pageUrl = clean(row.url, 1000);
    const source = clean(row.profile instanceof Object && !Array.isArray(row.profile) ? (row.profile as Record<string, unknown>).long_name : domainName(pageUrl), 120);
    return {
      id: `brave:${index}:${title.toLowerCase()}`,
      provider: "brave_search" as const,
      brand: "",
      itemName: title,
      sourceUrl: pageUrl || null,
      imageUrl: null,
      styleId: null,
      barcode: null,
      sourceName: source || null,
    };
  }).filter((row) => row.itemName);
}

export async function lookupUpcItemDb(query: string): Promise<ExternalCatalogCandidate[]> {
  const barcode = query.replace(/\D/g, "");
  if (!isBarcode(barcode)) return [];
  const url = new URL("https://api.upcitemdb.com/prod/trial/lookup");
  url.searchParams.set("upc", barcode);
  const payload = await json(url) as { items?: Array<Record<string, unknown>> };
  return (payload.items ?? []).slice(0, 3).map((row, index) => ({
    id: `upcitemdb:${barcode}:${index}`,
    provider: "upcitemdb" as const,
    brand: clean(row.brand, 120),
    itemName: clean(row.title),
    sourceUrl: null,
    imageUrl: clean(row.images instanceof Array ? row.images[0] : null, 1000) || null,
    styleId: clean(row.model, 100) || null,
    barcode,
    sourceName: "Barcode lookup",
  })).filter((row) => row.itemName);
}
