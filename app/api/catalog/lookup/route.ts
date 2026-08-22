import { NextResponse } from "next/server";
import { lookupChannel3CatalogCandidate, retrieveChannel3CatalogCandidate } from "@/lib/catalog-import";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let productUrl = "";
  let productId = "";
  try {
    const body = await request.json() as { url?: unknown; productId?: unknown };
    productUrl = typeof body.url === "string" ? body.url.trim() : "";
    productId = typeof body.productId === "string" ? body.productId.trim().slice(0, 200) : "";
    if (productUrl) {
      const parsed = new URL(productUrl);
      if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || !parsed.hostname) throw new Error("Invalid URL");
    }
    if (!productUrl && !productId) throw new Error("Missing product identity");
  } catch {
    return NextResponse.json({ error: "A valid retail product is required." }, { status: 400 });
  }

  const { data: reservation, error: reservationError } = await supabase.rpc("reserve_catalog_import_request", { p_provider_key: "channel3_catalog" });
  if (reservationError || !(reservation as { allowed?: boolean } | null)?.allowed) {
    return NextResponse.json({ error: "Retail catalog lookup is temporarily unavailable." }, { status: 429 });
  }

  try {
    let product = null;
    if (productUrl) {
      try { product = await lookupChannel3CatalogCandidate(productUrl, userId); } catch { product = null; }
    }
    if (!product && productId) product = await retrieveChannel3CatalogCandidate(productId, userId, productUrl || null);
    if (!product) return NextResponse.json({ error: "Detailed product information was not available for this item." }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Detailed product information could not be loaded right now." }, { status: 502 });
  }
}
