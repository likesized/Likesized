import sharp from "sharp";

export type FitPhotoQualityMetrics = {
  garment_visibility_score: number;
  sharpness_score: number;
  resolution_score: number;
  framing_score: number;
  exposure_score: number;
  image_width: number;
  image_height: number;
  perceptual_hash: string;
  quality_source: "automatic";
};

const ANALYSIS_MAX_SIDE = 256;
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolutionScore(width: number, height: number) {
  const megapixels = (width * height) / 1_000_000;
  const shortSide = Math.min(width, height);
  if (megapixels >= 3 && shortSide >= 1200) return 100;
  if (megapixels >= 2 && shortSide >= 900) return 92;
  if (megapixels >= 1 && shortSide >= 700) return 82;
  if (megapixels >= 0.5 && shortSide >= 500) return 68;
  if (megapixels >= 0.25 && shortSide >= 320) return 50;
  return 30;
}

function framingScore(width: number, height: number) {
  const ratio = Math.min(width, height) / Math.max(width, height);
  if (ratio >= 0.5) return 100;
  if (ratio >= 0.4) return 90;
  if (ratio >= 0.32) return 75;
  return 55;
}

function orientedDimensions(width: number, height: number, orientation: number | undefined) {
  return orientation && orientation >= 5 && orientation <= 8
    ? { width: height, height: width }
    : { width, height };
}

function technicalPixelScores(data: Buffer, width: number, height: number, channels: number) {
  const count = Math.max(1, width * height);
  let sum = 0;
  let clippedDark = 0;
  let clippedBright = 0;
  const values = new Float32Array(count);

  for (let pixel = 0, offset = 0; pixel < count; pixel += 1, offset += channels) {
    const value = data[offset];
    values[pixel] = value;
    sum += value;
    if (value < 12) clippedDark += 1;
    if (value > 243) clippedBright += 1;
  }

  const mean = sum / count;
  const clippedRatio = (clippedDark + clippedBright) / count;
  const exposure = clampScore(100 - Math.abs(mean - 128) * 0.55 - clippedRatio * 180);

  let edgeEnergy = 0;
  let comparisons = 0;
  for (let y = 0; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 0; x < width - 1; x += 1) {
      const index = row + x;
      edgeEnergy += Math.abs(values[index] - values[index + 1]);
      edgeEnergy += Math.abs(values[index] - values[index + width]);
      comparisons += 2;
    }
  }
  const averageEdge = comparisons ? edgeEnergy / comparisons : 0;
  return {
    exposure: clampScore(exposure),
    sharpness: clampScore((averageEdge - 2) * 5.5),
  };
}

async function perceptualHash(input: Buffer) {
  const { data, info } = await sharp(input, { failOn: "warning" })
    .rotate()
    .removeAlpha()
    .greyscale()
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== HASH_WIDTH || info.height !== HASH_HEIGHT || info.channels < 1) {
    throw new Error("Could not fingerprint Fit Photo");
  }

  let bits = "";
  for (let y = 0; y < HASH_HEIGHT; y += 1) {
    const row = y * HASH_WIDTH * info.channels;
    for (let x = 0; x < HASH_WIDTH - 1; x += 1) {
      const left = data[row + (x * info.channels)];
      const right = data[row + ((x + 1) * info.channels)];
      bits += left > right ? "1" : "0";
    }
  }
  return bits;
}

/**
 * Canonical technical Fit Photo analysis runs from the submitted file on the
 * server action path. Client fields never decide the persisted quality score or
 * perceptual duplicate fingerprint. This is technical image analysis only: it
 * does not pretend to recognize the garment. Moderation/admin eligibility stays
 * authoritative when the relevant garment is missing or unsuitable.
 */
export async function analyzeFitPhotoQuality(file: File): Promise<FitPhotoQualityMetrics> {
  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input, { failOn: "warning" }).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Could not read Fit Photo dimensions");
  const dimensions = orientedDimensions(metadata.width, metadata.height, metadata.orientation);

  const { data, info } = await sharp(input, { failOn: "warning" })
    .rotate()
    .removeAlpha()
    .greyscale()
    .resize({
      width: ANALYSIS_MAX_SIDE,
      height: ANALYSIS_MAX_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const technical = technicalPixelScores(data, info.width, info.height, info.channels);

  return {
    garment_visibility_score: 100,
    sharpness_score: technical.sharpness,
    resolution_score: resolutionScore(dimensions.width, dimensions.height),
    framing_score: framingScore(dimensions.width, dimensions.height),
    exposure_score: technical.exposure,
    image_width: dimensions.width,
    image_height: dimensions.height,
    perceptual_hash: await perceptualHash(input),
    quality_source: "automatic",
  };
}
