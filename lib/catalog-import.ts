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
  garmentType: string | null;
  colors: string[];
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

function structuredText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(structuredText);
  return [];
}

function mapGarmentType(product: Record<string, unknown>): string | null {
  const category = object(product.category);
  const categoryText = [
    clean(category.slug, 120),
    clean(category.title, 120),
    ...structuredText(category.path).map((value) => clean(value, 120)),
    clean(product.title, 180),
  ].filter(Boolean).join(" ").toLowerCase();

  const matches: Array<[string, RegExp]> = [
    ["dress_shirt", /\bdress shirts?\b/],
    ["casual_button_down", /\bbutton[- ]?downs?\b/],
    ["flannel_shirt", /\bflannel shirts?\b/],
    ["strapless_top", /\bstrapless tops?\b|\btube tops?\b|\bbandeau tops?\b/],
    ["halter_top", /\bhalter tops?\b/],
    ["tankini_top", /\btankini tops?\b/],
    ["bikini_bottom", /\bbikini bottoms?\b/],
    ["bikini_top", /\bbikini tops?\b/],
    ["one_piece_swimsuit", /\bone[- ]?piece swimsuits?\b|\bone[- ]?piece swim\b/],
    ["swim_trunks", /\bswim trunks?\b/],
    ["board_shorts", /\bboard shorts?\b/],
    ["sports_bra", /\bsports bras?\b/],
    ["bralette", /\bralettes?\b/],
    ["bra", /\bbras?\b/],
    ["jacket_coat", /\bjackets?\b|\bcoats?\b|\bparkas?\b|\bpuffers?\b|\btrenches?\b/],
    ["cardigan", /\bcardigans?\b/],
    ["sweatshirt", /\bsweatshirts?\b/],
    ["hoodie", /\bhoodies?\b/],
    ["sweater", /\bsweaters?\b|\bpullovers?\b/],
    ["t_shirt", /\bt[- ]?shirts?\b|\btees?\b/],
    ["polo", /\bpolos?\b/],
    ["blouse", /\bblouses?\b/],
    ["camisole", /\bcamisoles?\b|\bcamis?\b/],
    ["tank", /\btank tops?\b/],
    ["jeans", /\bjeans?\b/],
    ["cargo_pants", /\bcargo pants?\b/],
    ["sweatpants", /\bsweatpants?\b|\bsweat pants?\b/],
    ["joggers", /\bjoggers?\b/],
    ["leggings", /\bleggings?\b/],
    ["shorts", /\bshorts?\b/],
    ["skirt", /\bskirts?\b/],
    ["jumpsuit", /\bjumpsuits?\b/],
    ["romper", /\brompers?\b/],
    ["bodysuit", /\bbodysuits?\b/],
    ["overalls", /\boveralls?\b/],
    ["dress", /\bdresses?\b/],
    ["sneakers", /\bsneakers?\b|\btrainers?\b/],
    ["boots", /\bboots?\b/],
    ["dress_shoes", /\bdress shoes?\b/],
    ["loafers", /\bloafers?\b/],
    ["flats", /\bflats?\b/],
    ["heels", /\bhe(e)?ls?\b|\bpumps?\b/],
    ["sandals", /\bsandals?\b/],
    ["slides", /\bslides?\b/],
    ["clogs", /\bclogs?\b/],
  ];
  return matches.find(([, pattern]) => pattern.test(categoryText))?.[0] ?? null;
}

function structuredColors(product: Record<string, unknown>): string[] {
  const labels = new Set<string>();
  const variants = object(product.variants);
  const options = Array.isArray(variants.options) ? variants.options.map(object) : [];
  for (const option of options) {
    const name = clean(option.name, 80).toLowerCase();
    if (name !== "color" && name !== "colour") continue;
    const values = Array.isArray(option.values) ? option.values.map(object) : [];
    for (const value of values) {
      const label = clean(value.label, 120);
      if (label) labels.add(label);
    }
  }

  const attributes = object(product.structured_attributes);
  for (const key of ["color", "colour", "color_name", "colour_name"]) {
    for (const value of structuredText(attributes[key])) {
      const label = clean(value, 120);
      if (label) labels.add(label);
    }
  }
  return [...labels].slice(0, 120);
}

function manufacturerStyleId(product: Record<string, unknown>): string | null {
  const attributes = object(product.structured_attributes);
  for (const value of [
    product.mpn,
    product.style_id,
    product.manufacturer_style_id,
    attributes.mpn,
    attributes.style_id,
    attributes.manufacturer_style_id,
    attributes.model_number,
  ]) {
    const cleaned = clean(value, 100);
    if (cleaned) return cleaned;
  }
  return null;
}

function safeSourceRecord(product: Record<string, unknown>, colors: string[]) {
  const raw = JSON.stringify(product);
  const category = object(product.category);
  const record: Record<string, unknown> = {
    source_schema: "channel3_structured_product_v1",
    channel3_product_id: clean(product.id, 200),
    category: {
      slug: clean(category.slug, 120) || null,
      title: clean(category.title, 120) || null,
      path: structuredText(category.path).map((value) => clean(value, 120)).filter(Boolean),
    },
    trusted_colors: colors,
    structured_attributes: object(product.structured_attributes),
    raw_payload_json: raw,
  };
  if (JSON.stringify(record).length > 512_000) throw new Error("Channel3 source record exceeds the safe intake limit");
  return record;
}

function channel3Candidate(product: Record<string, unknown>, sourceUrlOverride: string | null = null): ExternalCatalogCandidate | null {
  const externalProductId = clean(product.id, 200);
  const itemName = clean(product.title);
  if (!externalProductId || !itemName) return null;

  const brands = Array.isArray(product.brands) ? product.brands.map(object) : [];
  const images = Array.isArray(product.images) ? product.images.map(object) : [];
  const offers = Array.isArray(product.offers) ? product.offers.map(object) : [];
  const hero = images.find((image) => image.is_main_image === true) ?? images[0] ?? {};
  const offer = offers.find((item) => cleanUrl(item.url)) ?? offers[0] ?? {};
  const colors = structuredColors(product);
  const sourceUrl = sourceUrlOverride ?? cleanUrl(offer.url);

  return {
    id: `channel3:${externalProductId}`,
    provider: "channel3_catalog",
    externalProductId,
    brand: clean(brands[0]?.name, 120),
    itemName,
    sourceUrl,
    imageUrl: cleanUrl(hero.cleaned_url) ?? cleanUrl(hero.url),
    styleId: manufacturerStyleId(product),
    barcode: clean(product.upc ?? product.gtin, 20) || null,
    sourceName: clean(offer.domain, 120) || (sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, "") : "Retail catalog"),
    garmentType: mapGarmentType(product),
    colors,
    sourceRecord: safeSourceRecord(product, colors),
  };
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
  return products.map((value) => channel3Candidate(object(value))).filter((candidate): candidate is ExternalCatalogCandidate => candidate !== null);
}

export async function lookupChannel3CatalogCandidate(productUrl: string, userId: string): Promise<ExternalCatalogCandidate | null> {
  const apiKey = process.env.CHANNEL3_API_KEY;
  if (!apiKey) return null;
  const sourceUrl = cleanUrl(productUrl);
  if (!sourceUrl) throw new Error("Invalid retailer product URL");
  const response = await fetch("https://api.trychannel3.com/v1/lookup", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(10_000),
    headers: { "x-api-key": apiKey, "x-user-id": userId, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url: sourceUrl }),
  });
  if (!response.ok) throw new Error(`Channel3 lookup returned ${response.status}`);
  const payload = object(await response.json());
  const product = object(payload.product);
  return channel3Candidate(product, sourceUrl);
}

export async function retrieveChannel3CatalogCandidate(productId: string, userId: string, sourceUrlOverride: string | null = null): Promise<ExternalCatalogCandidate | null> {
  const apiKey = process.env.CHANNEL3_API_KEY;
  if (!apiKey) return null;
  const normalizedId = clean(productId, 200);
  if (!normalizedId) return null;
  const response = await fetch(`https://api.trychannel3.com/v1/products/${encodeURIComponent(normalizedId)}`, {
    cache: "no-store", signal: AbortSignal.timeout(10_000),
    headers: { "x-api-key": apiKey, "x-user-id": userId, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Channel3 product detail returned ${response.status}`);
  const product = object(await response.json());
  return channel3Candidate(product, sourceUrlOverride);
}

export async function lookupUpcItemDb(query: string): Promise<ExternalCatalogCandidate[]> {
  const barcode = query.replace(/\D/g, "");
  if (!isBarcode(barcode)) return [];
  const url = new URL("https://api.upcitemdb.com/prod/trial/lookup"); url.searchParams.set("upc", barcode);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Barcode catalog returned ${response.status}`);
  const payload = object(await response.json());
  const items = Array.isArray(payload.items) ? payload.items.map(object) : [];
  const candidates: ExternalCatalogCandidate[] = [];
  for (const [index, row] of items.slice(0, 3).entries()) {
    const itemName = clean(row.title);
    if (!itemName) continue;
    const raw = JSON.stringify(row);
    const sourceRecord: Record<string, unknown> = {
      source_schema: "upcitemdb_structured_product_v1",
      trusted_colors: [],
      raw_payload_json: raw,
    };
    if (JSON.stringify(sourceRecord).length > 512_000) continue;
    candidates.push({
      id: `upcitemdb:${barcode}:${index}`,
      provider: "upcitemdb",
      externalProductId: `${barcode}:${index}`,
      brand: clean(row.brand, 120),
      itemName,
      sourceUrl: null,
      imageUrl: cleanUrl(Array.isArray(row.images) ? row.images[0] : null),
      styleId: clean(row.model, 100) || null,
      barcode,
      sourceName: "Barcode lookup",
      garmentType: mapGarmentType({ title: itemName }),
      colors: [],
      sourceRecord,
    });
  }
  return candidates;
}
