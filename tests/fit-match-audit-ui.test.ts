import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recommendationConfidenceLabel } from "../lib/recommendation.ts";

test("recommendation confidence is qualitative in the UI layer",()=>{
  assert.equal(recommendationConfidenceLabel(99),"High confidence");
  assert.equal(recommendationConfidenceLabel(75),"High confidence");
  assert.equal(recommendationConfidenceLabel(74),"Good confidence");
  assert.equal(recommendationConfidenceLabel(45),"Good confidence");
  assert.equal(recommendationConfidenceLabel(44),"Limited confidence");
  assert.equal(recommendationConfidenceLabel(0),"Limited confidence");
});

test("body Match UI never treats measurement coverage as confidence",()=>{
  const people=readFileSync(new URL("../app/people/page.tsx",import.meta.url),"utf8");
  const card=readFileSync(new URL("../components/MatchCard.tsx",import.meta.url),"utf8");
  assert.match(people,/Match % shows how closely/);
  assert.match(people,/not a probability that a garment will fit/);
  assert.doesNotMatch(people,/matchConfidenceLabel|confidenceLabel=/);
  assert.doesNotMatch(card,/confidenceLabel/);
});

test("product recommendation hides numeric confidence and labels historical coverage accurately",()=>{
  const item=readFileSync(new URL("../app/item\/[slug]\/page.tsx",import.meta.url),"utf8");
  assert.match(item,/recommendationConfidenceLabel\(recommendation\.confidence\)/);
  assert.doesNotMatch(item,/\{recommendation\.confidence\}% confidence/);
  assert.match(item,/measurement coverage/);
  assert.doesNotMatch(item,/matchConfidenceLabel/);
});
