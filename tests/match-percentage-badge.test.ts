import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const badge=readFileSync(new URL("../components/MatchPercentageBadge.tsx",import.meta.url),"utf8");
const badgeCss=readFileSync(new URL("../components/MatchPercentageBadge.module.css",import.meta.url),"utf8");
const matchCard=readFileSync(new URL("../components/MatchCard.tsx",import.meta.url),"utf8");
const personCard=readFileSync(new URL("../components/CanonicalPersonQuickViewCard.tsx",import.meta.url),"utf8");
const taggedCard=readFileSync(new URL("../components/TaggedFituitionCard.tsx",import.meta.url),"utf8");
const expandedEvidence=readFileSync(new URL("../app/item/[slug]/ExpandedEvidenceClient.tsx",import.meta.url),"utf8");
const itemPage=readFileSync(new URL("../app/item/[slug]/page.tsx",import.meta.url),"utf8");
const fixtures=readFileSync(new URL("../lib/fituition-review-fixtures.ts",import.meta.url),"utf8");
const preview=readFileSync(new URL("../app/explore/preview/page.tsx",import.meta.url),"utf8");
const exploreFixtures=readFileSync(new URL("../lib/explore-fixtures.ts",import.meta.url),"utf8");

test("Match percentages share one four-tier visual language",()=>{
  assert.match(badge,/if \(score >= 85\) return "strong"/);
  assert.match(badge,/if \(score >= 70\) return "good"/);
  assert.match(badge,/if \(score >= 50\) return "useful"/);
  assert.match(badge,/return "low"/);
  assert.match(badgeCss,/\.strong\{[^}]*background:#e7f5ed/);
  assert.match(badgeCss,/\.good\{[^}]*background:#eaf2fb/);
  assert.match(badgeCss,/\.useful\{[^}]*background:#fff3dd/);
  assert.match(badgeCss,/\.low\{[^}]*background:#efeeeb/);
  assert.doesNotMatch(badgeCss,/red/i);
});

test("universal member and garment Match surfaces use the shared badge",()=>{
  assert.match(matchCard,/MatchPercentageBadge score=\{match\} label="match"/);
  assert.match(personCard,/MatchPercentageBadge score=\{value\} compact/);
  assert.match(taggedCard,/MatchPercentageBadge score=\{report\.bodyMatch\} label="Body Match"/);
  assert.match(expandedEvidence,/MatchPercentageBadge score=\{row\.bodyMatch\} compact/);
  assert.match(itemPage,/MatchPercentageBadge score=\{bestExact\.historical_match_score\} compact/);
  assert.match(itemPage,/MatchPercentageBadge score=\{related\.historical_match_score\} compact/);
});

test("owner review fixtures cover all four FITuition outcomes and all four Match colors",()=>{
  assert.match(fixtures,/id:"strong-aggregate"/);
  assert.match(fixtures,/id:"recommended-closest"/);
  assert.match(fixtures,/id:"no-recommendation-closest"/);
  assert.match(fixtures,/id:"no-size"/);
  assert.match(fixtures,/sizeLabel:"Medium",count:7,fitBreakdown:\[\{fit:"just_right",fitLabel:"Just Right",count:7/);
  assert.match(fixtures,/sizeLabel:"Large",count:4,fitBreakdown:\[\{fit:"too_big",fitLabel:"Too Big",count:4/);
  assert.match(fixtures,/MATCH_BADGE_REVIEW_SCORES=\[94,78,63,44\]/);
  assert.match(preview,/kind === "fituition"/);
  assert.match(preview,/TaggedFituitionCard meta=\{fixture\.meta\}/);
  assert.match(preview,/cannot appear in production/);
});

test("expanded QA catalog remains preview-only and representative",()=>{
  assert.match(exploreFixtures,/process\.env\.VERCEL_ENV === "preview" \|\| process\.env\.NODE_ENV === "development"/);
  assert.match(exploreFixtures,/preview-reese/);
  assert.match(exploreFixtures,/Anthropologie","Somerset Maxi Dress/);
  assert.match(exploreFixtures,/Array\.from\(\{length:16\}/);
});
