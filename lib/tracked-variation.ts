import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";

export type GarmentAnswers = Record<string, string> | null | undefined;
export type TrackedVariationPart = {
  key: string;
  label: string;
  value: string;
  valueLabel: string;
};

export function trackedVariationParts(garmentTypeKey: string | null | undefined, answers: GarmentAnswers): TrackedVariationPart[] {
  if (!garmentTypeKey || !answers) return [];
  const definition = GARMENT_TYPE_BY_KEY.get(garmentTypeKey);
  if (!definition) return [];
  return definition.questions
    .filter((question) => question.classification === "variation-defining")
    .flatMap((question) => {
      const value = answers[question.key];
      if (!value || value === "not_sure") return [];
      const option = question.options.find((candidate) => candidate.value === value);
      if (!option) return [];
      return [{ key: question.key, label: question.label, value, valueLabel: option.label }];
    });
}

export function trackedVariationDetail(garmentTypeKey: string | null | undefined, answers: GarmentAnswers) {
  return trackedVariationParts(garmentTypeKey, answers)
    .map((part) => `${part.label}: ${part.valueLabel}`)
    .join(" · ");
}

export function trackedVariationShortLabel(garmentTypeKey: string | null | undefined, answers: GarmentAnswers) {
  const parts = trackedVariationParts(garmentTypeKey, answers);
  return parts.length ? parts.map((part) => part.valueLabel).join(" · ") : "Standard variation";
}

export function trackedVariationDifferences(
  garmentTypeKey: string | null | undefined,
  targetAnswers: GarmentAnswers,
  relatedAnswers: GarmentAnswers,
) {
  const target = new Map(trackedVariationParts(garmentTypeKey, targetAnswers).map((part) => [part.key, part]));
  const related = trackedVariationParts(garmentTypeKey, relatedAnswers);
  return related.flatMap((part) => {
    const current = target.get(part.key);
    if (!current || current.value === part.value) return [];
    return [`${part.label}: ${part.valueLabel} instead of ${current.valueLabel}`];
  });
}
