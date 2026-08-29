import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const commentsRoute=readFileSync("app/api/outfits/[id]/comments/route.ts","utf8");

test("Style Feed comments accept database-valid UUID-shaped Outfit ids",()=>{
  assert.match(commentsRoute,/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$/);
  assert.doesNotMatch(commentsRoute,/\[1-5\]\[0-9a-f\]\{3\}/);
  assert.doesNotMatch(commentsRoute,/\[89ab\]\[0-9a-f\]\{3\}/);
  assert.match(commentsRoute,/export async function GET/);
  assert.match(commentsRoute,/export async function POST/);
});
