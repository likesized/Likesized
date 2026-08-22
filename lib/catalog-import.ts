import "server-only";

export type ExternalCatalogProvider = "channel3_catalog" | "upcitemdb";

export type ExternalCatalogCandidate = {
  id: string;
  provider: ExternalCatalogProvider;
  externalProductId: string;
  brand: string;
  itemName: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  styleId: string | null;
  barcode: string | null;
  sourceName: string | null;
  sourceRecord: Record<string, unknown>;
};

function clean(value: unknown, maximum = 180) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maximum) : "";
}
function isBarcode(value: string) { return /^\d{8}$|^\d{12,14}$/.test(value.replace(/\D/g, "")); }
function cleanUrl(value: unknown) {
  const candidate = clean(value, 1000);
  try { const url = new URL(candidate); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null; } catch { return null; }
}
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function compactSourceRecord(value: Record<string, unknown>) {
  const record = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  if (JSON.stringify(record).length > 512_000) throw new Error("Channel3 source record exceeds the safe intake limit");
  return record;
}

export function enabledExternalCatalogProviders(query: string): ExternalCatalogProvider[] {
  const providers: ExternalCatalogProvider[] = [];
  if (process.env.CHANNEL3_API_KEY) providers.push("channel3_catalog");
  if (isBarcode(query)) providers.push("upcitemdb");
  return providers;
}

export async function searchChannel3CatalogCandidates(query: string, userId: string): Promise<ExternalCatalogCandidate[]> {
  const apiKey = process.env.CHANNEL3_API_KEY;
  if (!apiKey) return [];
  const response = await fetch("https://api.trychannel3.com/v1/search", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8_000),
    headers: { "x-api-key": apiKey, "x-user-id": userId, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, limit: 8 }),
  });
  if (!response.ok) throw new Error(`Channel3 returned ${response.status}`);
  const payload = object(await response.json());
  const products = Array.isArray(payload.products) ? payload.products : [];
  return products.map((value): ExternalCatalogCandidate | null => {
    const product = object(value);
    const brands = Array.isArray(product.brands) ? product.brands.map(object) : [];
    const images = Array.isArray(product.images) ? product.images.map(object) : [];
    const offers = Array.isArray(product.offers) ? product.offers.map(object) : [];
    const hero = images.find((image) => image.is_main_image) ?? images[0] ?? {};
    const offer = offers.find((item) => cleanUrl(item.url)) ?? offers[0] ?? {};
    const externalProductId = clean(product.id, 200);
    const itemName = clean(product.title);
    if (!externalProductId || !itemName) return null;
    const sourceUrl = cleanUrl(offer.url);
    return { id: `channel3:${externalProductId}`, provider: "channel3_catalog", externalProductId, brand: clean(brands[0]?.name, 120), itemName, sourceUrl,
      imageUrl: cleanUrl(hero.cleaned_url) ?? cleanUrl(hero.url), styleId: clean(product.sku ?? product.style_id ?? product.mpn, 100) || null,
      barcode: clean(product.upc ?? product.gtin, 20) || null, sourceName: clean(offer.domain, 120) || "Retail catalog", sourceRecord: compactSourceRecord(product) };
  }).filter((candidate): candidate is ExternalCatalogCandidate => candidate !== null);
}

export async function lookupUpcItemDb(query: string): Promise<ExternalCatalogCandidate[]> {
  const barcode = query.replace(/\D/g, "");
  if (!isBarcode(barcode)) return [];
  const url = new URL("https://api.upcitemdb.com/prod/trial/lookup"); url.searchParams.set("upc", barcode);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Barcode catalog returned ${response.status}`);
  const payload = object(await response.json());
  const items = Array.isArray(payload.items) ? payload.items.map(object) : [];
  return items.slice(0, 3).map((row, index) => ({ id: `upcitemdb:${barcode}:${index}`, provider: "upcitemdb" as const, externalProductId: `${barcode}:${index}`,
    brand: clean(row.brand, 120), itemName: clean(row.title), sourceUrl: null, imageUrl: cleanUrl(Array.isArray(row.images) ? row.images[0] : null),
    styleId: clean(row.model, 100) || null, barcode, sourceName: "Barcode lookup", sourceRecord: compactSourceRecord(row) })).filter((row) => row.itemName);
}
