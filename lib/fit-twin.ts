export type FitTwinDesignation = "fit_twin" | "tops_twin" | "bottoms_twin" | null;

export type CurrentPersonMatchScores = {
  overall?: number | null;
  tops?: number | null;
  bottoms?: number | null;
};

export const FIT_TWIN_LABELS: Record<Exclude<FitTwinDesignation, null>, string> = {
  fit_twin: "Fit Twin",
  tops_twin: "Tops Twin",
  bottoms_twin: "Bottoms Twin",
};

function clearsThreshold(score: number | null | undefined, threshold: number) {
  return typeof score === "number" && Number.isFinite(score) && score >= threshold;
}

export function fitTwinDesignation(
  scores: CurrentPersonMatchScores,
  threshold: number,
): FitTwinDesignation {
  const topsQualifies = clearsThreshold(scores.tops, threshold);
  const bottomsQualifies = clearsThreshold(scores.bottoms, threshold);

  if (topsQualifies && bottomsQualifies) return "fit_twin";
  if (topsQualifies) return "tops_twin";
  if (bottomsQualifies) return "bottoms_twin";
  return null;
}

export function fitTwinLabel(designation: FitTwinDesignation) {
  return designation ? FIT_TWIN_LABELS[designation] : null;
}

export function fitTwinPriority(designation: FitTwinDesignation) {
  if (designation === "fit_twin") return 2;
  if (designation) return 1;
  return 0;
}
