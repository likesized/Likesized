import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const thread=fs.readFileSync("app/outfits/[id]/CommentThread.tsx","utf8");
const composer=fs.readFileSync("app/outfits/[id]/CommentComposer.tsx","utf8");
const commentCss=fs.readFileSync("app/outfits/[id]/CommentThread.module.css","utf8");
const commentApi=fs.readFileSync("app/api/outfits/[id]/comments/route.ts","utf8");
const layout=fs.readFileSync("app/layout.tsx","utf8");
const globalQuickView=fs.readFileSync("components/GlobalEntityQuickViewLayer.tsx","utf8");
const personQuickView=fs.readFileSync("components/PersonQuickView.tsx","utf8");
const productMini=fs.readFileSync("components/ProductMiniBrowser.tsx","utf8");

test("full comments sheet is the single active comments surface while open",()=>{
  assert.match(thread,/!open&&!triggerOnly\?<div className=\{styles\.preview\}/);
  assert.match(thread,/!open&&triggerOnly\?<button/);
  assert.match(thread,/if\(open\)setFull\(apply\);\s*else setPreview\(apply\)/);
  assert.match(thread,/function closeComments\(\)[\s\S]*setOpen\(false\)[\s\S]*if\(!triggerOnly\)[\s\S]*loadPreview\(sort\)/);
  assert.doesNotMatch(thread,/setPreview\(apply\);\s*setFull\(apply\)/);
});

test("comments sheet has separated header sort and compact mobile-safe composer",()=>{
  assert.match(thread,/<strong>Comments<\/strong><span className=\{styles\.count\}>· \{count\}<\/span>/);
  assert.match(thread,/className=\{styles\.sheetSort\}><SortButtons\/>/);
  assert.match(composer,/className=\{styles\.composer\}/);
  assert.match(commentCss,/max-height: calc\(100dvh - 12px\)/);
  assert.match(commentCss,/safe-area-inset-bottom/);
  assert.match(commentCss,/\.composer textarea[\s\S]*font-size: 16px/);
});

test("comment interactions stay local instead of redirecting the whole Outfit",()=>{
  assert.match(thread,/method:"DELETE"/);
  assert.match(commentApi,/export async function DELETE/);
  assert.match(thread,/method:"PATCH"/);
  assert.match(composer,/method:"POST"/);
});

test("comment authors open the shared person quick view before full profile",()=>{
  assert.match(thread,/PersonQuickView/);
  assert.doesNotMatch(thread,/href=\{`\/people\/\$\{comment\.username\}`\}/);
  assert.match(personQuickView,/View Full Profile/);
  assert.match(personQuickView,/data-full-navigation="true"/);
});

test("people garments and outfits share the global mini-detail-first rule",()=>{
  assert.match(layout,/GlobalEntityQuickViewLayer/);
  assert.match(globalQuickView,/parts\[0\]==="people"/);
  assert.match(globalQuickView,/parts\[0\]==="item"/);
  assert.match(globalQuickView,/parts\[0\]==="outfits"/);
  assert.match(globalQuickView,/event\.preventDefault\(\)/);
  assert.match(globalQuickView,/data-full-navigation/);
  assert.match(globalQuickView,/View Full Profile/);
  assert.match(globalQuickView,/View Garment/);
  assert.match(globalQuickView,/View Full Outfit/);
  assert.match(productMini,/EntityQuickView/);
  assert.doesNotMatch(productMini,/<iframe/);
});
