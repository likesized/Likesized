import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(path,"utf8");

test("trusted PR governance runs from canonical base and never executes candidate code to judge itself",()=>{
  const workflow=read(".github/workflows/trusted-governance.yml");
  assert.match(workflow,/pull_request_target:/);
  assert.match(workflow,/contents:\s*read/);
  assert.match(workflow,/pull-requests:\s*read/);
  assert.match(workflow,/path:\s*trusted/);
  assert.match(workflow,/path:\s*candidate/);
  assert.match(workflow,/persist-credentials:\s*false/g);
  assert.match(workflow,/node trusted\/scripts\/check-pr-governance\.mjs trusted candidate/);
  assert.match(workflow,/node \.\.\/trusted\/scripts\/check-canonical-integrity\.mjs/);
  assert.doesNotMatch(workflow,/run:\s*(?:npm\s+(?:ci|install|run)|pnpm\b|yarn\b|bun\b)/);
});

test("CI keeps fast draft iteration and full exact-candidate verification separate",()=>{
  const fast=read(".github/workflows/fast.yml");
  const full=read(".github/workflows/ci.yml");
  assert.match(fast,/fast_verify:/);
  assert.match(fast,/name:\s*Fast Repair Verification/);
  assert.match(full,/release_verify:/);
  assert.match(full,/name:\s*Release Verification/);
  assert.doesNotMatch(fast,/name:\s*Release Verification/);
  assert.doesNotMatch(full,/name:\s*Fast Repair Verification/);
  assert.match(fast,/Classify changed paths/);
  assert.match(fast,/database=false/);
  assert.match(fast,/app\/\*\|components\/\*\|lib\/\*/);
  assert.doesNotMatch(fast,/\*\.ts\|\*\.tsx\|\*\.js\|\*\.jsx/);
  assert.match(fast,/for test_file in tests\/\*\.test\.ts; do/);
  assert.match(fast,/steps\.changes\.outputs\.database == 'true'/);
  assert.match(full,/github\.event\.pull_request\.draft == false/);
  assert.match(full,/for test_file in tests\/\*\.test\.ts; do/);
  assert.match(full,/Replay all canonical migrations on a fresh local database/);
  assert.match(full,/Run canonical database behavior\/privacy tests/);
});

test("Style Feed consumes canonical shared Outfit and garment systems",()=>{
  const feed=read("app/circle/page.tsx");
  const garments=read("app/circle/StyleFeedGarmentsButton.tsx");
  const layout=read("app/layout.tsx");
  assert.match(feed,/from "@\/app\/outfits\/\[id\]\/OutfitGallery"/);
  assert.match(feed,/from "@\/app\/outfits\/\[id\]\/CommentThread"/);
  assert.match(feed,/from "@\/lib\/outfit-photo-paths"/);
  assert.match(garments,/from "@\/app\/outfits\/\[id\]\/TaggedItemsPanel"/);
  assert.match(garments,/<TaggedItemsPanel items=\{items\}/);
  assert.doesNotMatch(garments,/Relevant Fit Reports:|Our FITuition suggests:|Not enough fit data to confidently recommend a size/);
  assert.match(layout,/GlobalEntityQuickViewLayer/);
});

test("governance policy keeps Repair and Product Change distinct",()=>{
  const rules=read("AI_REPOSITORY_RULES.md");
  assert.match(rules,/## 2\. Two change lanes — LOCKED/);
  assert.match(rules,/### A\. Repair/);
  assert.match(rules,/### B\. Product Change/);
  assert.match(rules,/The AI may propose `Repair`; the AI does \*\*not\*\* get final authority/);
  assert.match(rules,/Candidate must not control its own judge — LOCKED/);
  assert.match(rules,/Full final verification/);
});
