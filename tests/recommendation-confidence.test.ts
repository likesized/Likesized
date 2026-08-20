import test from "node:test";
import assert from "node:assert/strict";
import { recommendSize, type RecommendationEvidence } from "../lib/recommendation.ts";

function evidence(overrides: Partial<RecommendationEvidence> = {}): RecommendationEvidence {
  return {
    sizeKey: "M",
    sizeLabel: "M",
    fit: "just_right",
    matchScore: 100,
    coveragePercent: 100,
    evidenceLevel: "exact_variant",
    attributeOverlap: 0,
    ...overrides,
  };
}

function repeated(count: number, overrides: Partial<RecommendationEvidence> = {}) {
  return Array.from({ length: count }, () => evidence(overrides));
}

test("requires eligible historical body-match evidence", () => {
  assert.equal(recommendSize([]), null);
  assert.equal(recommendSize([evidence({ matchScore: 49 })]), null);
  assert.equal(recommendSize([evidence({ matchScore: 101 })]), null);
});

test("sample strength raises confidence without allowing 100% certainty", () => {
  const one = recommendSize(repeated(1));
  const four = recommendSize(repeated(4));
  const ten = recommendSize(repeated(10));
  assert.equal(one?.confidence, 59);
  assert.equal(four?.confidence, 78);
  assert.equal(ten?.confidence, 99);
  assert.equal(ten?.similarWearerCount, 10);
  assert.equal(ten?.sizeEvidenceCount, 10);
});

test("coverage remains a confidence signal without double-penalizing match evidence", () => {
  const full = recommendSize(repeated(10, { coveragePercent: 100 }));
  const half = recommendSize(repeated(10, { coveragePercent: 50 }));
  assert.equal(full?.confidence, 99);
  assert.equal(half?.confidence, 85);
  assert.ok((half?.confidence ?? 100) < (full?.confidence ?? 0));
});

test("historical body-match quality lowers confidence when similarity is weaker", () => {
  const perfect = recommendSize(repeated(10, { matchScore: 100 }));
  const seventy = recommendSize(repeated(10, { matchScore: 70 }));
  assert.equal(perfect?.confidence, 99);
  assert.equal(seventy?.confidence, 70);
});

test("weaker evidence tiers remain usable but materially reduce confidence", () => {
  const exact = recommendSize(repeated(10, { evidenceLevel: "exact_variant" }));
  const category = recommendSize(repeated(10, { evidenceLevel: "category_fit" }));
  assert.equal(exact?.confidence, 99);
  assert.equal(category?.confidence, 42);
  assert.equal(category?.strongestEvidenceLevel, "category_fit");
});

test("conflicting fit outcomes reduce confidence for the same size", () => {
  const unanimous = recommendSize(repeated(10));
  const conflicted = recommendSize([
    ...repeated(5),
    ...repeated(5, { fit: "too_small" }),
  ]);
  assert.equal(unanimous?.confidence, 99);
  assert.equal(conflicted?.confidence, 61);
  assert.ok((conflicted?.confidence ?? 100) < (unanimous?.confidence ?? 0));
});

test("competing supported sizes reduce agreement confidence", () => {
  const result = recommendSize([
    ...repeated(5, { sizeKey: "M", sizeLabel: "M" }),
    ...repeated(5, { sizeKey: "L", sizeLabel: "L" }),
  ]);
  assert.equal(result?.sizeKey, "M");
  assert.equal(result?.confidence, 41);
  assert.equal(result?.similarWearerCount, 10);
  assert.equal(result?.sizeEvidenceCount, 5);
});

test("controlled Similar Garments overlap may break an otherwise equal size tie", () => {
  const result = recommendSize([
    evidence({ sizeKey: "M", sizeLabel: "M", evidenceLevel: "similar_garments", attributeOverlap: 0 }),
    evidence({ sizeKey: "L", sizeLabel: "L", evidenceLevel: "similar_garments", attributeOverlap: 4 }),
  ]);
  assert.equal(result?.sizeKey, "L");
  assert.equal(result?.confidence, 22);
  assert.equal(result?.strongestEvidenceLevel, "similar_garments");
});

test("direction can make the same bad Fit Result stronger negative evidence without changing body Match", () => {
  const weakerNegative = recommendSize([
    evidence({ fit: "just_right" }),
    evidence({ fit: "too_small", directionalFitSupport: -0.40 }),
  ]);
  const strongerNegative = recommendSize([
    evidence({ fit: "just_right" }),
    evidence({ fit: "too_small", directionalFitSupport: -0.90 }),
  ]);
  assert.equal(weakerNegative?.sizeKey, "M");
  assert.equal(strongerNegative?.sizeKey, "M");
  assert.ok((strongerNegative?.confidence ?? 100) < (weakerNegative?.confidence ?? 0));
});

test("directional Fit Result support can break an otherwise equal size tie", () => {
  const result = recommendSize([
    evidence({ sizeKey: "M", sizeLabel: "M", directionalFitSupport: 0.60 }),
    evidence({ sizeKey: "L", sizeLabel: "L", directionalFitSupport: 0.90 }),
  ]);
  assert.equal(result?.sizeKey, "L");
  assert.equal(result?.similarWearerCount, 2);
});

test("Fitted preference can favor a snug size without changing Match scores", () => {
  const rows = [
    evidence({ sizeKey: "M", sizeLabel: "M", fit: "snug", matchScore: 100 }),
    evidence({ sizeKey: "L", sizeLabel: "L", fit: "just_right", matchScore: 99 }),
  ];
  assert.equal(recommendSize(rows, "standard")?.sizeKey, "L");
  assert.equal(recommendSize(rows, "fitted")?.sizeKey, "M");
  assert.equal(rows[0].matchScore, 100);
  assert.equal(rows[1].matchScore, 99);
});

test("Relaxed preference can favor a relaxed size over an otherwise stronger Just Right option", () => {
  const rows = [
    evidence({ sizeKey: "M", sizeLabel: "M", fit: "just_right", matchScore: 99 }),
    evidence({ sizeKey: "L", sizeLabel: "L", fit: "relaxed", matchScore: 100 }),
  ];
  assert.equal(recommendSize(rows, "standard")?.sizeKey, "M");
  assert.equal(recommendSize(rows, "relaxed")?.sizeKey, "L");
});

test("Too Small and Too Big remain negative for every fit preference", () => {
  assert.equal(recommendSize([evidence({ fit: "too_small" })], "fitted"), null);
  assert.equal(recommendSize([evidence({ fit: "too_small" })], "relaxed"), null);
  assert.equal(recommendSize([evidence({ fit: "too_big" })], "fitted"), null);
  assert.equal(recommendSize([evidence({ fit: "too_big" })], "relaxed"), null);
});
