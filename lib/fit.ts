export type Measurements = {
  heightIn?: number;
  weightLb?: number;
  chestIn?: number;
  waistIn?: number;
  hipsIn?: number;
  inseamIn?: number;
  shouldersIn?: number;
  torsoIn?: number;
};

export type GarmentCategory = "overall" | "tops" | "bottoms" | "dresses";

type Rule = {
  key: keyof Measurements;
  weight: number;
  tolerance: number;
};

const RULES: Record<GarmentCategory, Rule[]> = {
  overall: [
    { key: "heightIn", weight: 0.12, tolerance: 5 },
    { key: "weightLb", weight: 0.08, tolerance: 45 },
    { key: "chestIn", weight: 0.20, tolerance: 6 },
    { key: "waistIn", weight: 0.20, tolerance: 6 },
    { key: "hipsIn", weight: 0.16, tolerance: 6 },
    { key: "inseamIn", weight: 0.10, tolerance: 4 },
    { key: "shouldersIn", weight: 0.08, tolerance: 4 },
    { key: "torsoIn", weight: 0.06, tolerance: 4 },
  ],
  tops: [
    { key: "chestIn", weight: 0.34, tolerance: 5 },
    { key: "shouldersIn", weight: 0.25, tolerance: 3 },
    { key: "torsoIn", weight: 0.16, tolerance: 4 },
    { key: "heightIn", weight: 0.13, tolerance: 5 },
    { key: "weightLb", weight: 0.07, tolerance: 45 },
    { key: "waistIn", weight: 0.05, tolerance: 6 },
  ],
  bottoms: [
    { key: "waistIn", weight: 0.34, tolerance: 5 },
    { key: "hipsIn", weight: 0.28, tolerance: 5 },
    { key: "inseamIn", weight: 0.24, tolerance: 3 },
    { key: "heightIn", weight: 0.09, tolerance: 5 },
    { key: "weightLb", weight: 0.05, tolerance: 45 },
  ],
  dresses: [
    { key: "chestIn", weight: 0.25, tolerance: 5 },
    { key: "waistIn", weight: 0.23, tolerance: 5 },
    { key: "hipsIn", weight: 0.22, tolerance: 5 },
    { key: "heightIn", weight: 0.12, tolerance: 5 },
    { key: "torsoIn", weight: 0.10, tolerance: 4 },
    { key: "shouldersIn", weight: 0.08, tolerance: 3 },
  ],
};

export function fitMatchScore(
  a: Measurements,
  b: Measurements,
  category: GarmentCategory = "overall"
): number {
  const available = RULES[category].filter(
    (rule) => a[rule.key] !== undefined && b[rule.key] !== undefined
  );

  if (!available.length) return 0;

  const totalWeight = available.reduce((sum, rule) => sum + rule.weight, 0);
  const weighted = available.reduce((sum, rule) => {
    const av = a[rule.key] as number;
    const bv = b[rule.key] as number;
    const difference = Math.abs(av - bv);
    const similarity = Math.max(0, 1 - difference / rule.tolerance);
    return sum + similarity * rule.weight;
  }, 0);

  return Math.round((weighted / totalWeight) * 100);
}
