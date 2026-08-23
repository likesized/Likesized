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

test("The Loop appears before What LikeSized Does", () => {
  assert.ok(home.indexOf("THE LOOP") < home.indexOf("WHAT LIKESIZED DOES"));
});

test("public homepage contains substantive FAQ content", () => {
  assert.match(home, /id="faq"/);
  assert.match(home, /What is a Fit Twin\?/);
  assert.match(home, /Can other members see my measurements\?/);
  assert.match(home, /Does LikeSized work for both men and women\?/);
  assert.match(home, /upper arm\/bicep/);
  assert.match(home, /full bust, high bust, underbust/);
  assert.match(home, /Those are examples, not rules/);
  assert.match(home, /Can I follow someone who is not my Fit Twin\?/);
  assert.ok((home.match(/question:/g) ?? []).length >= 6);
});
