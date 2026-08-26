import test from "node:test";
import assert from "node:assert/strict";
import { buildSafeSizeAdjacency, recommendSize, simpleAlphaAdjacency, type RecommendationEvidence } from "../lib/recommendation.ts";

function evidence(overrides: Partial<RecommendationEvidence> = {}): RecommendationEvidence {
  const base = simpleAlphaAdjacency("M");
  return {
    sizeKey: base.current!.sizeKey,
    sizeLabel: base.current!.sizeLabel,
    fit: "just_right",
    matchScore: 100,
    coveragePercent: 100,
    evidenceLevel: "exact_variant",
    attributeOverlap: 0,
    source: "community",
    sourceRelevance: 1,
    adjacentSizeUp: base.up,
    adjacentSizeDown: base.down,
    ...overrides,
  };
}
function repeated(count: number, overrides: Partial<RecommendationEvidence> = {}) { return Array.from({ length: count }, () => evidence(overrides)); }

function alphaEvidence(size: string, overrides: Partial<RecommendationEvidence> = {}): RecommendationEvidence {
  const adjacency = simpleAlphaAdjacency(size);
  assert.ok(adjacency.current);
  return evidence({
    sizeKey: adjacency.current.sizeKey,
    sizeLabel: adjacency.current.sizeLabel,
    adjacentSizeUp: adjacency.up,
    adjacentSizeDown: adjacency.down,
    ...overrides,
  });
}

test("requires eligible historical Body Match evidence", () => {
  assert.equal(recommendSize([]), null);
  assert.equal(recommendSize([evidence({ matchScore: 49 })]), null);
  assert.equal(recommendSize([evidence({ matchScore: 101 })]), null);
});

test("unanimous Just Right keeps the worn size", () => {
  const result = recommendSize(repeated(10));
  assert.equal(result?.sizeKey, "alpha:M");
  assert.equal(result?.sourceBreakdown.communityBlend, 100);
  assert.equal(result?.sourceBreakdown.closetBlend, 0);
  assert.equal(result?.similarWearerCount, 10);
  assert.ok((result?.confidence ?? 0) >= 75);
});

test("95% Snug M and 5% Just Right M moves the recommendation to L", () => {
  const result = recommendSize([
    ...repeated(95, { fit: "snug" }),
    ...repeated(5, { fit: "just_right" }),
  ]);
  assert.equal(result?.sizeKey, "alpha:L");
});

test("Too Small transfers support upward while remaining negative against the worn size", () => {
  const result = recommendSize(repeated(10, { fit: "too_small" }));
  assert.equal(result?.sizeKey, "alpha:L");
});

test("Too Big transfers support downward", () => {
  const result = recommendSize(repeated(10, { fit: "too_big" }));
  assert.equal(result?.sizeKey, "alpha:S");
});

test("viewer body direction refines Snug transfer without changing Body Match", () => {
  const largerViewer = recommendSize(repeated(8, { fit: "snug", directionalFitSupport: 0.05 }));
  const smallerViewer = recommendSize(repeated(8, { fit: "snug", directionalFitSupport: 0.95 }));
  assert.equal(largerViewer?.sizeKey, "alpha:L");
  assert.equal(smallerViewer?.sizeKey, "alpha:L");
  assert.ok((largerViewer?.confidence ?? 0) >= (smallerViewer?.confidence ?? 0));
});

test("Relaxed evidence shifts downward with safe adjacency", () => {
  const result = recommendSize(repeated(10, { fit: "relaxed" }));
  assert.equal(result?.sizeKey, "alpha:S");
});

test("structured multi-dimensional sizes never invent an adjacent destination", () => {
  const map = buildSafeSizeAdjacency([
    { id: "waist", normalizedKey: "waist_inseam:30:30", displayLabel: "30×30", kind: "waist_inseam" },
    { id: "bra", normalizedKey: "bra:34:C", displayLabel: "34C", kind: "bra" },
  ]);
  assert.equal(map.has("waist"), false);
  assert.equal(map.has("bra"), false);
  const ambiguous = recommendSize([evidence({ sizeKey: "waist_inseam:30:30", sizeLabel: "30×30", fit: "too_small", adjacentSizeUp: null, adjacentSizeDown: null })]);
  assert.equal(ambiguous, null);
});

test("numeric and shoe adjacency only use the same canonical sizing system", () => {
  const map = buildSafeSizeAdjacency([
    { id: "8", normalizedKey: "numeric:US:8", displayLabel: "8", kind: "numeric", sizingSystem: "US", numericSize: 8 },
    { id: "10", normalizedKey: "numeric:US:10", displayLabel: "10", kind: "numeric", sizingSystem: "US", numericSize: 10 },
    { id: "eu40", normalizedKey: "numeric:EU:40", displayLabel: "40", kind: "numeric", sizingSystem: "EU", numericSize: 40 },
  ]);
  assert.equal(map.get("8")?.up?.sizeKey, "numeric:US:10");
  assert.equal(map.get("10")?.down?.sizeKey, "numeric:US:8");
  assert.equal(map.get("eu40")?.up, null);
});

test("coverage remains source-quality/confidence information rather than a second vote penalty", () => {
  const full = recommendSize(repeated(10, { coveragePercent: 100 }));
  const half = recommendSize(repeated(10, { coveragePercent: 50 }));
  assert.equal(full?.sizeKey, "alpha:M");
  assert.equal(half?.sizeKey, "alpha:M");
  assert.ok((half?.confidence ?? 100) < (full?.confidence ?? 0));
});

test("high-quality exact evidence beats a large weak broad-category pile through source relevance", () => {
  const exact = repeated(6, { fit: "just_right", evidenceLevel: "exact_variant", matchScore: 95 });
  const broad = repeated(80, { sizeKey: "alpha:L", sizeLabel: "L", fit: "just_right", evidenceLevel: "category_fit", matchScore: 55, sourceRelevance: 0.15, adjacentSizeUp: simpleAlphaAdjacency("L").up, adjacentSizeDown: simpleAlphaAdjacency("L").down });
  const result = recommendSize([...exact, ...broad]);
  assert.equal(result?.sizeKey, "alpha:M");
});

test("Community and Closet are scored separately and dynamically blended", () => {
  const community = repeated(10, { source: "community", fit: "just_right", matchScore: 95 });
  const closet = repeated(10, { source: "closet", fit: "just_right", matchScore: 95, sourceRelevance: 1 });
  const result = recommendSize([...community, ...closet]);
  assert.equal(result?.sizeKey, "alpha:M");
  assert.ok((result?.sourceBreakdown.communityBlend ?? 0) > (result?.sourceBreakdown.closetBlend ?? 100));
  assert.equal(result?.sourceBreakdown.sourcesAgree, true);
});

test("strong Closet history can dominate weak Community evidence", () => {
  const weakCommunity = repeated(2, { source: "community", matchScore: 52, evidenceLevel: "category_fit", sourceRelevance: 0.25 });
  const strongCloset = Array.from({ length: 10 }, () => alphaEvidence("L", { source: "closet", matchScore: 98, evidenceLevel: "exact_product", sourceRelevance: 1 }));
  const result = recommendSize([...weakCommunity, ...strongCloset]);
  assert.equal(result?.sizeKey, "alpha:L");
  assert.ok((result?.sourceBreakdown.closetBlend ?? 0) > (result?.sourceBreakdown.communityBlend ?? 100));
});

test("Closet-only evidence can make a recommendation", () => {
  const result = recommendSize(Array.from({ length: 8 }, () => alphaEvidence("L", { source: "closet", evidenceLevel: "exact_product", matchScore: 96, sourceRelevance: 1 })));
  assert.equal(result?.sizeKey, "alpha:L");
  assert.equal(result?.sourceBreakdown.communityBlend, 0);
  assert.equal(result?.sourceBreakdown.closetBlend, 100);
});

test("Community versus Closet disagreement is preserved in the result contract", () => {
  const community = repeated(10, { source: "community", matchScore: 96 });
  const closet = Array.from({ length: 10 }, () => alphaEvidence("L", { source: "closet", matchScore: 96, evidenceLevel: "exact_product", sourceRelevance: 1 }));
  const result = recommendSize([...community, ...closet]);
  assert.equal(result?.sourceBreakdown.sourcesAgree, false);
  assert.equal(result?.sourceBreakdown.communityTopSizeLabel, "M");
  assert.equal(result?.sourceBreakdown.closetTopSizeLabel, "L");
  assert.ok((result?.confidence ?? 100) < 90);
});

test("historically changed-body Closet evidence can be weakened through Body Match", () => {
  const currentLike = recommendSize(Array.from({ length: 8 }, () => alphaEvidence("L", { source: "closet", matchScore: 98, evidenceLevel: "exact_product", sourceRelevance: 1 })));
  const changedBody = recommendSize(Array.from({ length: 8 }, () => alphaEvidence("L", { source: "closet", matchScore: 60, evidenceLevel: "exact_product", sourceRelevance: 1 })));
  assert.equal(currentLike?.sizeKey, "alpha:L");
  assert.equal(changedBody?.sizeKey, "alpha:L");
  assert.ok((changedBody?.confidence ?? 100) < (currentLike?.confidence ?? 0));
});

test("near-tied supported sizes reduce confidence", () => {
  const clear = recommendSize(repeated(10));
  const nearTie = recommendSize([
    ...repeated(5),
    ...Array.from({ length: 5 }, () => alphaEvidence("L", { fit: "just_right" })),
  ]);
  assert.equal(nearTie?.sizeKey, "alpha:M");
  assert.ok((nearTie?.confidence ?? 100) < (clear?.confidence ?? 0));
});
