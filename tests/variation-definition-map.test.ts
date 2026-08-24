import assert from "node:assert/strict";
import test from "node:test";
import {
  GARMENT_TYPES,
  GARMENT_VARIATION_DEFINITION_MAP,
  isAllowedGarmentAnswer,
  isVariationDefiningGarmentQuestion,
  variationQuestionsForGarmentType,
} from "../lib/garment-taxonomy.ts";

test("owner-audited structured questions are all tracked-variation defining", () => {
  for (const garment of GARMENT_TYPES) {
    assert.ok(garment.questions.length <= 4, `${garment.label} has too many questions`);
    assert.ok(garment.questions.every((question) => question.classification === "variation-defining"));
    assert.deepEqual(
      GARMENT_VARIATION_DEFINITION_MAP.get(garment.key),
      garment.questions.map((question) => question.key),
      `${garment.label} variation map drifted from its canonical questions`,
    );
    assert.deepEqual(variationQuestionsForGarmentType(garment.key), garment.questions);
  }
});

test("retired Intended Fit is absent from every current garment type", () => {
  for (const garment of GARMENT_TYPES) {
    assert.ok(!garment.questions.some((question) => question.key === "intended_fit"), `${garment.label} still asks Intended Fit`);
    assert.equal(isVariationDefiningGarmentQuestion(garment.key, "intended_fit"), false);
    assert.equal(isAllowedGarmentAnswer(garment.key, "intended_fit", "regular"), false);
  }
});

test("Sneakers Use is retired while approved shoe construction questions remain variations", () => {
  const sneakers = GARMENT_TYPES.find((garment) => garment.key === "sneakers");
  assert.ok(sneakers);
  assert.deepEqual(sneakers.questions.map((question) => question.key), ["shoe_height", "shoe_closure"]);
  assert.equal(isVariationDefiningGarmentQuestion("sneakers", "shoe_use"), false);
  assert.equal(isVariationDefiningGarmentQuestion("sneakers", "shoe_height"), true);
  assert.equal(isVariationDefiningGarmentQuestion("sneakers", "shoe_closure"), true);
});

test("Size and Color never enter the tracked variation-definition map", () => {
  for (const keys of GARMENT_VARIATION_DEFINITION_MAP.values()) {
    assert.ok(!keys.includes("size"));
    assert.ok(!keys.includes("size_label"));
    assert.ok(!keys.includes("normalized_size_id"));
    assert.ok(!keys.includes("color"));
    assert.ok(!keys.includes("color_family"));
    assert.ok(!keys.includes("color_family_key"));
  }
});
