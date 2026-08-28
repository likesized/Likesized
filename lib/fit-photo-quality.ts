export type FitPhotoQualityMetrics = {
  garment_visibility_score: number;
  sharpness_score: number;
  resolution_score: number;
  framing_score: number;
  exposure_score: number;
  image_width: number;
  image_height: number;
  quality_source: "automatic";
};

const ANALYSIS_MAX_SIDE = 256;

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

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not analyze Fit Photo"));
    };
    image.src = url;
  });
}

function pixelQuality(imageData: ImageData) {
  const { data, width, height } = imageData;
  const luminance = new Float32Array(width * height);
  let sum = 0;
  let clippedDark = 0;
  let clippedBright = 0;

  for (let pixel = 0, offset = 0; offset < data.length; pixel += 1, offset += 4) {
    const value = (0.2126 * data[offset]) + (0.7152 * data[offset + 1]) + (0.0722 * data[offset + 2]);
    luminance[pixel] = value;
    sum += value;
    if (value < 12) clippedDark += 1;
    if (value > 243) clippedBright += 1;
  }

  const count = Math.max(1, luminance.length);
  const mean = sum / count;
  const clippedRatio = (clippedDark + clippedBright) / count;
  const exposure = clampScore(100 - Math.abs(mean - 128) * 0.55 - clippedRatio * 180);

  let edgeEnergy = 0;
  let comparisons = 0;
  for (let y = 0; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 0; x < width - 1; x += 1) {
      const index = row + x;
      edgeEnergy += Math.abs(luminance[index] - luminance[index + 1]);
      edgeEnergy += Math.abs(luminance[index] - luminance[index + width]);
      comparisons += 2;
    }
  }
  const averageEdge = comparisons ? edgeEnergy / comparisons : 0;
  const sharpness = clampScore((averageEdge - 2) * 5.5);
  return { exposure, sharpness };
}

/**
 * Deterministic browser-side technical analysis for a member-selected Fit Photo.
 * This does not pretend to be garment recognition. Fit Photo role supplies the
 * initial garment-visibility claim; moderation/admin eligibility remains the
 * authority when the relevant garment is missing or the photo is unsuitable.
 */
export async function analyzeFitPhotoQuality(file: File): Promise<FitPhotoQualityMetrics> {
  const image = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new Error("Could not read Fit Photo dimensions");

  const scale = Math.min(1, ANALYSIS_MAX_SIDE / Math.max(width, height));
  const sampleWidth = Math.max(1, Math.round(width * scale));
  const sampleHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not analyze Fit Photo");
  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const technical = pixelQuality(context.getImageData(0, 0, sampleWidth, sampleHeight));

  return {
    garment_visibility_score: 100,
    sharpness_score: technical.sharpness,
    resolution_score: resolutionScore(width, height),
    framing_score: framingScore(width, height),
    exposure_score: technical.exposure,
    image_width: width,
    image_height: height,
    quality_source: "automatic",
  };
}
