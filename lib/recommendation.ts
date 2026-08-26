import type { EvidenceLevel } from "@/lib/domain";

export type EvidenceSource = "community" | "closet";
export type AdjacentSize = { sizeKey: string; sizeLabel: string };
export type RecommendationEvidence = {
  sizeKey: string;
  sizeLabel: string;
  fit: "too_small" | "snug" | "just_right" | "relaxed" | "too_big";
  matchScore: number;
  coveragePercent?: number | null;
  evidenceLevel: EvidenceLevel;
  attributeOverlap?: number;
  directionalFitSupport?: number | null;
  source?: EvidenceSource;
  sourceRelevance?: number;
  adjacentSizeUp?: AdjacentSize | null;
  adjacentSizeDown?: AdjacentSize | null;
};

export type RecommendationSourceBreakdown = {
  communityBlend: number;
  closetBlend: number;
  communityTopSizeLabel: string | null;
  closetTopSizeLabel: string | null;
  sourcesAgree: boolean | null;
};

export type SizeRecommendation = {
  sizeKey: string;
  sizeLabel: string;
  confidence: number;
  similarWearerCount: number;
  sizeEvidenceCount: number;
  strongestEvidenceLevel: EvidenceLevel;
  sourceBreakdown: RecommendationSourceBreakdown;
};

export type NormalizedSizeDescriptor = {
  id: string;
  normalizedKey: string;
  displayLabel: string;
  kind: string;
  sizingSystem?: string | null;
  alphaSize?: string | null;
  numericSize?: number | null;
  shoeSize?: number | null;
};

export type ClosetRelevanceInput = {
  sameProduct: boolean;
  sameVariation: boolean;
  sameBrand: boolean;
  sameGarmentType: boolean;
  sameCategory: boolean;
  attributeOverlap: number;
};

export const CLOSET_STRONG_ATTRIBUTE_OVERLAP = 2;

export function closetEvidenceRelevance(input: ClosetRelevanceInput) {
  if (input.sameProduct && input.sameVariation) return 1;
  if (input.sameProduct) return 0.95;
  const strongTraits = input.attributeOverlap >= CLOSET_STRONG_ATTRIBUTE_OVERLAP;
  if (input.sameBrand && input.sameGarmentType && strongTraits) return 0.85;
  if (input.sameGarmentType && strongTraits) return 0.75;
  if (input.sameBrand && input.sameGarmentType) return 0.65;
  if (input.sameGarmentType) return 0.50;
  if (input.sameCategory) return 0.25;
  return 0;
}

const EVIDENCE_WEIGHT: Record<EvidenceLevel, number> = {
  exact_variant: 1,
  exact_product: 0.94,
  product_family: 0.82,
  similar_garments: 0.70,
  brand_garment_type: 0.58,
  category_fit: 0.42,
};
const EVIDENCE_RANK: Record<EvidenceLevel, number> = {
  exact_variant: 1,
  exact_product: 2,
  product_family: 3,
  similar_garments: 4,
  brand_garment_type: 5,
  category_fit: 6,
};
const ALPHA_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL"] as const;

type Bucket = {
  sizeKey: string;
  sizeLabel: string;
  positive: number;
  negative: number;
  positiveCount: number;
  strongestEvidenceLevel: EvidenceLevel;
};
type SourceStats = {
  source: EvidenceSource;
  distribution: Map<string, number>;
  buckets: Map<string, Bucket>;
  top: Bucket | null;
  quality: number;
  intrinsicQuality: number;
  sampleStrength: number;
  evidenceCount: number;
};

type Contribution = { size: AdjacentSize; positive?: number; negative?: number };

function clamp(value: number, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function finite(value: number | null | undefined, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function normalizeAlpha(value: string) { return value.trim().toUpperCase().replace(/\s+/g, ""); }

export function simpleAlphaSize(sizeLabel: string): AdjacentSize | null {
  const alpha = normalizeAlpha(sizeLabel);
  return ALPHA_ORDER.includes(alpha as (typeof ALPHA_ORDER)[number]) ? { sizeKey: `alpha:${alpha}`, sizeLabel: alpha } : null;
}

export function simpleAlphaAdjacency(sizeLabel: string) {
  const current = simpleAlphaSize(sizeLabel);
  if (!current) return { current: null, up: null, down: null };
  const alpha = current.sizeLabel as (typeof ALPHA_ORDER)[number];
  const index = ALPHA_ORDER.indexOf(alpha);
  const downLabel = index > 0 ? ALPHA_ORDER[index - 1] : null;
  const upLabel = index >= 0 && index < ALPHA_ORDER.length - 1 ? ALPHA_ORDER[index + 1] : null;
  return {
    current,
    up: upLabel ? { sizeKey: `alpha:${upLabel}`, sizeLabel: upLabel } : null,
    down: downLabel ? { sizeKey: `alpha:${downLabel}`, sizeLabel: downLabel } : null,
  };
}

/**
 * Safe adjacency only exists for one-dimensional canonical systems. Structured sizes
 * such as waist/inseam, bra, dress-shirt and freeform sizes intentionally return no
 * adjacent target because FITuition must not guess which dimension should change.
 */
export function buildSafeSizeAdjacency(rows: NormalizedSizeDescriptor[]) {
  const result = new Map<string, { current: AdjacentSize; up: AdjacentSize | null; down: AdjacentSize | null }>();
  const numericGroups = new Map<string, NormalizedSizeDescriptor[]>();

  for (const row of rows) {
    if (row.kind === "alpha" && row.alphaSize) {
      const alpha = simpleAlphaAdjacency(row.alphaSize);
      if (alpha.current) result.set(row.id, { current: { sizeKey: row.normalizedKey, sizeLabel: row.displayLabel }, up: alpha.up, down: alpha.down });
      continue;
    }
    if (row.kind === "numeric" && Number.isFinite(row.numericSize)) {
      const key = `numeric:${row.sizingSystem ?? ""}`;
      numericGroups.set(key, [...(numericGroups.get(key) ?? []), row]);
      continue;
    }
    if (row.kind === "shoe" && Number.isFinite(row.shoeSize)) {
      const key = `shoe:${row.sizingSystem ?? ""}`;
      numericGroups.set(key, [...(numericGroups.get(key) ?? []), row]);
    }
  }

  for (const group of numericGroups.values()) {
    const ordered = [...group].sort((a, b) => {
      const av = a.kind === "shoe" ? finite(a.shoeSize, 0) : finite(a.numericSize, 0);
      const bv = b.kind === "shoe" ? finite(b.shoeSize, 0) : finite(b.numericSize, 0);
      return av - bv || a.displayLabel.localeCompare(b.displayLabel);
    });
    ordered.forEach((row, index) => result.set(row.id, {
      current: { sizeKey: row.normalizedKey, sizeLabel: row.displayLabel },
      down: index > 0 ? { sizeKey: ordered[index - 1].normalizedKey, sizeLabel: ordered[index - 1].displayLabel } : null,
      up: index < ordered.length - 1 ? { sizeKey: ordered[index + 1].normalizedKey, sizeLabel: ordered[index + 1].displayLabel } : null,
    }));
  }
  return result;
}

function rowIdentity(row: RecommendationEvidence): AdjacentSize {
  return { sizeKey: row.sizeKey, sizeLabel: row.sizeLabel };
}

function directionalDistribution(row: RecommendationEvidence): Contribution[] {
  const current = rowIdentity(row);
  const directional = finite(row.directionalFitSupport, row.fit === "just_right" ? 1 : row.fit === "snug" ? 0.48 : row.fit === "relaxed" ? 0.72 : -0.65);
  if (row.fit === "just_right") {
    return [{ size: current, positive: clamp(directional, 0.55, 1) }];
  }
  if (row.fit === "snug") {
    const delta = directional - 0.48;
    const upShare = clamp(0.75 - 0.35 * delta, 0.55, 0.95);
    const result: Contribution[] = [{ size: current, positive: 1 - upShare }];
    if (row.adjacentSizeUp) result.push({ size: row.adjacentSizeUp, positive: upShare });
    return result;
  }
  if (row.fit === "relaxed") {
    const delta = directional - 0.72;
    const downShare = clamp(0.75 - 0.30 * delta, 0.55, 0.95);
    const result: Contribution[] = [{ size: current, positive: 1 - downShare }];
    if (row.adjacentSizeDown) result.push({ size: row.adjacentSizeDown, positive: downShare });
    return result;
  }
  const negativeStrength = clamp(Math.abs(directional), 0.4, 1);
  const transferStrength = clamp(0.9 + (negativeStrength - 0.65) * 0.4, 0.78, 1.08);
  if (row.fit === "too_small") {
    const result: Contribution[] = [{ size: current, negative: negativeStrength }];
    if (row.adjacentSizeUp) result.push({ size: row.adjacentSizeUp, positive: transferStrength });
    return result;
  }
  const result: Contribution[] = [{ size: current, negative: negativeStrength }];
  if (row.adjacentSizeDown) result.push({ size: row.adjacentSizeDown, positive: transferStrength });
  return result;
}

function ensureBucket(buckets: Map<string, Bucket>, size: AdjacentSize, evidenceLevel: EvidenceLevel) {
  const existing = buckets.get(size.sizeKey);
  if (existing) {
    if (EVIDENCE_RANK[evidenceLevel] < EVIDENCE_RANK[existing.strongestEvidenceLevel]) existing.strongestEvidenceLevel = evidenceLevel;
    return existing;
  }
  const bucket: Bucket = { sizeKey: size.sizeKey, sizeLabel: size.sizeLabel, positive: 0, negative: 0, positiveCount: 0, strongestEvidenceLevel: evidenceLevel };
  buckets.set(size.sizeKey, bucket);
  return bucket;
}

function scoreSource(rows: RecommendationEvidence[], source: EvidenceSource): SourceStats {
  const buckets = new Map<string, Bucket>();
  let matchQualityTotal = 0;
  let coverageQualityTotal = 0;
  let relevanceQualityTotal = 0;

  rows.forEach((row) => {
    const closeness = Math.pow(row.matchScore / 100, 2);
    const coverage = clamp((row.coveragePercent ?? 100) / 100, 0.25, 1);
    const coverageQuality = 0.70 + 0.30 * coverage;
    const exactness = EVIDENCE_WEIGHT[row.evidenceLevel];
    const sourceRelevance = clamp(row.sourceRelevance ?? 1);
    const attributeBoost = row.evidenceLevel === "similar_garments" ? Math.min(1.12, 1 + (row.attributeOverlap ?? 0) * 0.03) : 1;
    const base = closeness * exactness * attributeBoost * sourceRelevance;

    matchQualityTotal += closeness;
    coverageQualityTotal += coverageQuality;
    relevanceQualityTotal += clamp(exactness * sourceRelevance * Math.min(attributeBoost, 1.08));

    for (const contribution of directionalDistribution(row)) {
      const bucket = ensureBucket(buckets, contribution.size, row.evidenceLevel);
      if (contribution.positive) {
        bucket.positive += base * contribution.positive;
        bucket.positiveCount += 1;
      }
      if (contribution.negative) bucket.negative += base * contribution.negative;
    }
  });

  const net = [...buckets.values()].map((bucket) => ({ bucket, score: Math.max(0, bucket.positive - bucket.negative) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || b.bucket.positive - a.bucket.positive || b.bucket.positiveCount - a.bucket.positiveCount);
  const totalNet = net.reduce((sum, entry) => sum + entry.score, 0);
  const distribution = new Map(net.map((entry) => [entry.bucket.sizeKey, totalNet > 0 ? entry.score / totalNet : 0]));
  const top = net[0]?.bucket ?? null;
  const count = rows.length;
  const sampleStrength = Math.min(1, Math.sqrt(count / 10));
  const concentration = net.length && totalNet > 0 ? net[0].score / totalNet : 0;
  const avgMatch = count ? matchQualityTotal / count : 0;
  const avgCoverage = count ? coverageQualityTotal / count : 0;
  const avgRelevance = count ? relevanceQualityTotal / count : 0;
  const intrinsicQuality = clamp(avgMatch * avgCoverage * avgRelevance * (0.72 + 0.28 * concentration));
  const quality = clamp(intrinsicQuality * sampleStrength);
  return { source, distribution, buckets, top, quality, intrinsicQuality, sampleStrength, evidenceCount: count };
}

export function recommendationConfidenceLabel(confidence: number) {
  if (confidence >= 75) return "High confidence";
  if (confidence >= 45) return "Good confidence";
  return "Limited confidence";
}

export function recommendSize(evidence: RecommendationEvidence[]): SizeRecommendation | null {
  const eligible = evidence.filter((row) => row.sizeKey.trim() && row.sizeLabel.trim() && Number.isFinite(row.matchScore) && row.matchScore >= 50 && row.matchScore <= 100 && (row.sourceRelevance ?? 1) > 0);
  if (!eligible.length) return null;

  const communityRows = eligible.filter((row) => (row.source ?? "community") === "community");
  const closetRows = eligible.filter((row) => row.source === "closet");
  const community = scoreSource(communityRows, "community");
  const closet = scoreSource(closetRows, "closet");
  const communityUsable = Boolean(community.top && community.quality > 0);
  const closetUsable = Boolean(closet.top && closet.quality > 0);
  if (!communityUsable && !closetUsable) return null;

  let communityBlend = 0;
  let closetBlend = 0;
  if (communityUsable && closetUsable) {
    const communityRaw = 0.55 * community.quality;
    const closetRaw = 0.45 * closet.quality;
    const totalRaw = communityRaw + closetRaw;
    communityBlend = totalRaw > 0 ? communityRaw / totalRaw : 0.55;
    closetBlend = totalRaw > 0 ? closetRaw / totalRaw : 0.45;
  } else if (communityUsable) communityBlend = 1;
  else closetBlend = 1;

  const keys = new Set([...community.distribution.keys(), ...closet.distribution.keys()]);
  const final = [...keys].map((sizeKey) => {
    const communityScore = community.distribution.get(sizeKey) ?? 0;
    const closetScore = closet.distribution.get(sizeKey) ?? 0;
    const score = communityBlend * communityScore + closetBlend * closetScore;
    const bucket = community.buckets.get(sizeKey) ?? closet.buckets.get(sizeKey)!;
    const communityBucket = community.buckets.get(sizeKey);
    const closetBucket = closet.buckets.get(sizeKey);
    const evidenceCount = (communityBucket?.positiveCount ?? 0) + (closetBucket?.positiveCount ?? 0);
    const strongestEvidenceLevel = communityBucket && closetBucket
      ? (EVIDENCE_RANK[communityBucket.strongestEvidenceLevel] <= EVIDENCE_RANK[closetBucket.strongestEvidenceLevel] ? communityBucket.strongestEvidenceLevel : closetBucket.strongestEvidenceLevel)
      : (communityBucket?.strongestEvidenceLevel ?? closetBucket!.strongestEvidenceLevel);
    return { sizeKey, sizeLabel: bucket.sizeLabel, score, evidenceCount, strongestEvidenceLevel };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || b.evidenceCount - a.evidenceCount);
  const top = final[0];
  if (!top) return null;
  const runner = final[1]?.score ?? 0;
  const separation = top.score > 0 ? clamp((top.score - runner) / top.score) : 0;

  const bothSources = communityUsable && closetUsable;
  const communityTopKey = community.top?.sizeKey ?? null;
  const closetTopKey = closet.top?.sizeKey ?? null;
  const sourcesAgree = bothSources ? communityTopKey === closetTopKey : null;
  const agreement = bothSources
    ? (sourcesAgree ? 1 : clamp(((community.distribution.get(top.sizeKey) ?? 0) + (closet.distribution.get(top.sizeKey) ?? 0)) / 2))
    : 1;
  const intrinsicQuality = communityBlend * community.intrinsicQuality + closetBlend * closet.intrinsicQuality;
  const sampleStrength = communityBlend * community.sampleStrength + closetBlend * closet.sampleStrength;
  const certainty = clamp(0.55 * intrinsicQuality + 0.20 * top.score + 0.15 * separation + 0.10 * agreement);
  const depthFactor = 0.45 + 0.55 * sampleStrength;
  const confidence = Math.max(0, Math.min(99, Math.round(100 * certainty * depthFactor)));

  return {
    sizeKey: top.sizeKey,
    sizeLabel: top.sizeLabel,
    confidence,
    similarWearerCount: eligible.length,
    sizeEvidenceCount: top.evidenceCount,
    strongestEvidenceLevel: top.strongestEvidenceLevel,
    sourceBreakdown: {
      communityBlend: Math.round(communityBlend * 100),
      closetBlend: Math.round(closetBlend * 100),
      communityTopSizeLabel: community.top?.sizeLabel ?? null,
      closetTopSizeLabel: closet.top?.sizeLabel ?? null,
      sourcesAgree,
    },
  };
}
