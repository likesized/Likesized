import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("homepage capability calls to action keep their approved rhythm", () => {
  assert.match(home, /Find My Matches →/);
  assert.match(home, /Shop Smarter →/);
  assert.match(home, /Get Inspired →/);
  assert.doesNotMatch(home, /See Following/);
});

test("What LikeSized Does appears before The Loop", () => {
  assert.ok(home.indexOf("WHAT LIKESIZED DOES") < home.indexOf("THE LOOP"));
});

test("public FAQ teaches Fit Reports and Body Match before advanced evidence", () => {
  assert.match(home, /id="faq"/);
  const fitReport = home.indexOf("What does a Fit Report tell me, and what does Fit Result mean?");
  const bodyMatch = home.indexOf("What does my Body Match percentage mean, and does a high match guarantee the same fit?");
  const lowMatch = home.indexOf("Does a low Body Match mean the item will not fit me?");
  const exactVariation = home.indexOf("Why am I seeing a lower Body Match before a stronger one?");
  const strongReports = home.indexOf("What are Strong Fit Reports?");
  assert.ok(fitReport >= 0);
  assert.ok(bodyMatch > fitReport);
  assert.ok(lowMatch > bodyMatch);
  assert.ok(exactVariation > lowMatch);
  assert.ok(strongReports > exactVariation);
  assert.match(home, /It does not mean the garment has a 92% chance of fitting you/);
});

test("public FAQ keeps approved privacy, social, and community-catalog meaning", () => {
  assert.match(home, /Can other members see my measurements\?/);
  assert.match(home, /What is a Fit Twin, and do I have to be Fit Twins to follow someone\?/);
  assert.match(home, /How does the community-built clothing catalog work\?/);
  assert.match(home, /What if I’m not sure of the item, style, or model\?/);
  assert.doesNotMatch(home, /Can I follow someone who is not my Fit Twin\?/);
  assert.doesNotMatch(home, /Does LikeSized work for both men and women\?/);
  assert.doesNotMatch(home, /upper arm\/bicep/);
  assert.doesNotMatch(home, /Those are examples, not rules/);
  assert.equal((home.match(/question:/g) ?? []).length, 11);
});