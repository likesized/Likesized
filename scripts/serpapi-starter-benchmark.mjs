import crypto from "node:crypto";
import fs from "node:fs";

const isPreview = process.env.VERCEL_ENV === "preview";
const apiKey = process.env.SERPAPI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!isPreview || !apiKey) {
  console.log("SerpAPI starter benchmark skipped: Preview key not active.");
  process.exit(0);
}
if (!supabaseUrl || !supabaseKey) throw new Error("Supabase Preview configuration is missing.");

const rpc = async (name, payload) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${name} failed (${response.status}): ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
};

const migration = fs.readFileSync("supabase/migrations/20260822073000_community_catalog_intake_and_seed.sql", "utf8");
const marker = "insert into community_seed_products(brand_name,item_name,garment_type_key) values";
const start = migration.indexOf(marker);
if (start < 0) throw new Error("Starter Product seed block was not found.");
const end = migration.indexOf(";", start);
if (end < 0) throw new Error("Starter Product seed block is incomplete.");
const block = migration.slice(start, end + 1);
const products = [];
const tuple = /\('((?:''|[^'])*)','((?:''|[^'])*)','([^']+)'\)/g;
for (const match of block.matchAll(tuple)) {
  products.push({
    brand: match[1].replaceAll("''", "'"),
    model: match[2].replaceAll("''", "'"),
    garmentType: match[3],
  });
}
if (products.length !== 150) throw new Error(`Expected 150 starter Products, found ${products.length}.`);

const tokenHash = crypto.randomBytes(32).toString("hex");
const began = await rpc("begin_serpapi_starter_benchmark", { p_token_hash: tokenHash });
if (began !== true) {
  console.log("SerpAPI starter benchmark already completed; no API calls made.");
  process.exit(0);
}

let nextIndex = 0;
let successes = 0;
const failures = [];

async function runOne(index) {
  const product = products[index];
  const query = `${product.brand} ${product.model}`;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("device", "desktop");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  const raw = await response.json().catch(() => ({ error: "Non-JSON SerpAPI response" }));
  const searchStatus = raw?.search_metadata?.status;
  const successful = response.ok && searchStatus === "Success";
  if (!successful) {
    failures.push({ index: index + 1, query, status: response.status, error: raw?.error ?? searchStatus ?? "Unknown error" });
    console.log(`SERPAPI_BENCHMARK ${index + 1}/150 FAIL ${JSON.stringify({ query, status: response.status, error: raw?.error ?? searchStatus ?? "Unknown error" })}`);
    return;
  }

  await rpc("cache_serpapi_starter_benchmark_response", {
    p_token_hash: tokenHash,
    p_query_text: query,
    p_expected_brand: product.brand,
    p_expected_model: product.model,
    p_expected_garment_type: product.garmentType,
    p_raw_response: raw,
  });
  successes += 1;
  const resultCount = Array.isArray(raw.shopping_results) ? raw.shopping_results.length : 0;
  console.log(`SERPAPI_BENCHMARK ${index + 1}/150 OK ${JSON.stringify({ query, resultCount, searchId: raw?.search_metadata?.id ?? null })}`);
}

async function worker() {
  while (true) {
    const index = nextIndex++;
    if (index >= products.length) return;
    try {
      await runOne(index);
    } catch (error) {
      const product = products[index];
      failures.push({ index: index + 1, query: `${product.brand} ${product.model}`, error: error instanceof Error ? error.message : String(error) });
      console.log(`SERPAPI_BENCHMARK ${index + 1}/150 FAIL ${JSON.stringify({ query: `${product.brand} ${product.model}`, error: error instanceof Error ? error.message : String(error) })}`);
    }
  }
}

try {
  await Promise.all(Array.from({ length: 3 }, () => worker()));
  if (failures.length === 0) {
    await rpc("finish_serpapi_starter_benchmark", { p_token_hash: tokenHash });
    console.log(`SERPAPI_BENCHMARK_COMPLETE ${JSON.stringify({ requested: 150, cached: successes, failures: 0 })}`);
  } else {
    await rpc("pause_serpapi_starter_benchmark", { p_token_hash: tokenHash });
    console.log(`SERPAPI_BENCHMARK_PAUSED ${JSON.stringify({ requested: 150, cachedThisRun: successes, failures: failures.length, sampleFailures: failures.slice(0, 10) })}`);
  }
} catch (error) {
  try { await rpc("pause_serpapi_starter_benchmark", { p_token_hash: tokenHash }); } catch {}
  throw error;
}
