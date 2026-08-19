export type RecommendationEvidence = {
  sizeLabel: string;
  fit: "too_small" | "snug" | "just_right" | "relaxed" | "too_big";
  matchScore: number;
  wouldBuyAgain: boolean | null;
};

export type SizeRecommendation = {
  sizeLabel: string;
  confidence: number;
  similarWearerCount: number;
  sizeEvidenceCount: number;
};

const FIT_SUPPORT: Record<RecommendationEvidence["fit"], number> = {
  too_small: -0.65,
  snug: 0.48,
  just_right: 1,
  relaxed: 0.72,
  too_big: -0.65,
};

type SizeBucket = {
  sizeLabel: string;
  score: number;
  positive: number;
  positivePotential: number;
  negative: number;
  matchWeight: number;
  weightedMatch: number;
  count: number;
};

export function recommendSize(
  evidence: RecommendationEvidence[],
): SizeRecommendation | null {
  const eligible = evidence.filter(
    (row) =>
      row.sizeLabel.trim().length > 0 &&
      Number.isFinite(row.matchScore) &&
      row.matchScore >= 50 &&
      row.matchScore <= 100,
  );

  if (eligible.length === 0) return null;

  const buckets = new Map<string, SizeBucket>();

  for (const row of eligible) {
    const normalizedSize = row.sizeLabel.trim();
    const closeness = Math.pow(row.matchScore / 100, 2);
    const rebuyFactor =
      row.wouldBuyAgain === true ? 1.08 : row.wouldBuyAgain === false ? 0.85 : 1;
    const fitSupport = FIT_SUPPORT[row.fit];
    const signedSupport = closeness * fitSupport * rebuyFactor;

    const bucket = buckets.get(normalizedSize) ?? {
      sizeLabel: normalizedSize,
      score: 0,
      positive: 0,
      positivePotential: 0,
      negative: 0,
      matchWeight: 0,
      weightedMatch: 0,
      count: 0,
    };

    bucket.score += signedSupport;
    bucket.positive += Math.max(0, signedSupport);
    bucket.negative += Math.max(0, -signedSupport);
    if (fitSupport > 0) {
      bucket.positivePotential += closeness * rebuyFactor;
    }
    bucket.matchWeight += closeness;
    bucket.weightedMatch += row.matchScore * closeness;
    bucket.count += 1;
    buckets.set(normalizedSize, bucket);
  }

  const candidates = [...buckets.values()]
    .filter((bucket) => bucket.score > 0 && bucket.positive > 0)
    .sort((a, b) => b.score - a.score || b.positive - a.positive || b.count - a.count);

  const top = candidates[0];
  if (!top) return null;

  const totalPositive = candidates.reduce((sum, bucket) => sum + bucket.positive, 0);
  const agreement = totalPositive > 0 ? top.positive / totalPositive : 0;
  const averageMatch =
    top.matchWeight > 0 ? top.weightedMatch / top.matchWeight / 100 : 0;
  const positiveFitQuality =
    top.positivePotential > 0 ? top.positive / top.positivePotential : 0;
  const conflictQuality =
    top.positive + top.negative > 0
      ? top.positive / (top.positive + top.negative)
      : 0;
  const fitQuality = positiveFitQuality * conflictQuality;
  const evidenceStrength = Math.min(1, Math.sqrt(top.count / 10));
  const confidence = Math.max(
    0,
    Math.min(
      99,
      Math.round(
        100 *
          agreement *
          averageMatch *
          fitQuality *
          (0.35 + 0.65 * evidenceStrength),
      ),
    ),
  );

  return {
    sizeLabel: top.sizeLabel,
    confidence,
    similarWearerCount: eligible.length,
    sizeEvidenceCount: top.count,
  };
}
