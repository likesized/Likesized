import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const board=readFileSync("app/circle/StyleFeedBoard.tsx","utf8");

test("Style Feed Outfit creator opens canonical Person quick view",()=>{
  assert.match(board,/import \{ PersonQuickView \} from "@\/components\/PersonQuickView"/);
  assert.match(board,/<PersonQuickView username=\{active\.creator\.username\} displayName=\{active\.creator\.displayName\} avatarUrl=\{active\.creator\.avatarUrl\} inline>/);
  assert.doesNotMatch(board,/className=\{styles\.creator\} href=\{`\/people\/\$\{encodeURIComponent\(active\.creator\.username\)\}`\}/);
});
