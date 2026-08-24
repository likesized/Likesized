import sharp from "sharp";

const OUTFIT_DERIVATIVE_FORMATS = new Set(["webp", "jpeg"]);

export async function canonicalOutfitWebp(file: File, maxBytes: number) {
  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input, { failOn: "warning" }).metadata();

  if (!metadata.format || !OUTFIT_DERIVATIVE_FORMATS.has(metadata.format)) {
    throw new Error("That prepared Outfit photo format is not supported.");
  }

  if (metadata.format === "webp") {
    if (input.byteLength > maxBytes) throw new Error("That prepared Outfit photo is too large.");
    return input;
  }

  // Some Safari/iOS versions can decode camera photos but cannot encode canvas WebP.
  // The client falls back to a bounded JPEG derivative; normalize that derivative back
  // to the canonical WebP storage contract here before anything is persisted.
  for (const quality of [82, 74, 66, 58, 50, 42, 34]) {
    const output = await sharp(input, { failOn: "warning" }).webp({ quality }).toBuffer();
    if (output.byteLength <= maxBytes) return output;
  }

  throw new Error("That prepared Outfit photo could not be reduced enough.");
}
