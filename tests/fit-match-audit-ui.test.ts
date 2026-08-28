import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fitTwinDesignation, fitTwinLabel, fitTwinPriority } from "../lib/fit-twin.ts";
import { recommendationConfidenceLabel } from "../lib/recommendation.ts";

test("recommendation confidence is qualitative in the UI layer",()=>{
  assert.equal(recommendationConfidenceLabel(99),"High confidence");
  assert.equal(recommendationConfidenceLabel(75),"High confidence");
  assert.equal(recommendationConfidenceLabel(74),"Good confidence");
  assert.equal(recommendationConfidenceLabel(45),"Good confidence");
  assert.equal(recommendationConfidenceLabel(44),"Limited confidence");
  assert.equal(recommendationConfidenceLabel(0),"Limited confidence");
});

test("Fit Twin designation requires regional qualification instead of overall average",()=>{
  const threshold=85;
  assert.equal(fitTwinDesignation({overall:99,tops:84,bottoms:84},threshold),null);
  assert.equal(fitTwinDesignation({overall:84,tops:91,bottoms:90},threshold),"fit_twin");
  assert.equal(fitTwinDesignation({overall:88,tops:91,bottoms:77},threshold),"tops_twin");
  assert.equal(fitTwinDesignation({overall:88,tops:77,bottoms:91},threshold),"bottoms_twin");
  assert.equal(fitTwinLabel("fit_twin"),"Fit Twin");
  assert.equal(fitTwinLabel("tops_twin"),"Tops Twin");
  assert.equal(fitTwinLabel("bottoms_twin"),"Bottoms Twin");
  assert.equal(fitTwinPriority("fit_twin"),2);
  assert.equal(fitTwinPriority("tops_twin"),1);
  assert.equal(fitTwinPriority(null),0);
});

test("body Match UI never treats measurement coverage as confidence",()=>{
  const people=readFileSync(new URL("../app/people/page.tsx",import.meta.url),"utf8");
  const card=readFileSync(new URL("../components/MatchCard.tsx",import.meta.url),"utf8");
  assert.match(people,/Match % shows how closely/);
  assert.match(people,/not a probability that a garment will fit/);
  assert.match(people,/p_match_category: "tops"/);
  assert.match(people,/p_match_category: "bottoms"/);
  assert.match(people,/Following · \$\{twinLabel\}/);
  assert.doesNotMatch(people,/matchConfidenceLabel|confidenceLabel=/);
  assert.doesNotMatch(card,/confidenceLabel/);
});

test("product recommendation keeps qualitative confidence and explains Body Match accurately",()=>{
  const item=readFileSync(new URL("../app/item\/[slug]\/page.tsx",import.meta.url),"utf8");
  assert.match(item,/recommendationConfidenceLabel\(recommendation\.confidence\)/);
  assert.doesNotMatch(item,/\{recommendation\.confidence\}% confidence/);
  assert.match(item,/Body Match shows how closely your measurements match the person who submitted this Fit Report/);
  assert.match(item,/not how likely the garment is to fit you/);
  assert.doesNotMatch(item,/matchConfidenceLabel/);
});