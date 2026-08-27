import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const vercelConfig = readFileSync(new URL("../vercel.json", import.meta.url), "utf8");
const classifier = readFileSync(new URL("../scripts/vercel-ignore-build.mjs", import.meta.url), "utf8");

test("Vercel uses the canonical fail-open release-boundary classifier", () => {
  assert.match(vercelConfig, /"ignoreCommand": "node scripts\/vercel-ignore-build\.mjs"/);
  assert.match(classifier, /if \(diff\.status !== 0\)/);
  assert.match(classifier, /process\.exit\(1\)/);
  assert.match(classifier, /Runtime-affecting or unclassified files changed; production build required\./);
});

test("only explicitly non-runtime canonical and governance files may skip a production build", () => {
  for (const allowed of [
    'file.startsWith("docs/")',
    'file === "AI_REPOSITORY_RULES.md"',
    'file === "AGENTS.md"',
    'file === "CLAUDE.md"',
    'file.startsWith(".github/")',
    'file.startsWith("tests/")',
    'file === "supabase/schema_contract.md"',
    'file === "supabase/storage.sql"',
    'file === "scripts/check-canonical-integrity.mjs"',
    'file === "scripts/check-pr-governance.mjs"',
  ]) assert.match(classifier, new RegExp(allowed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  for (const runtimePath of ["app/", "components/", "lib/", "public/", "supabase/migrations/", "package.json", "vercel.json", "scripts/vercel-ignore-build.mjs"])
    assert.doesNotMatch(classifier, new RegExp(`file(?:\\.startsWith)?\\(\\\"${runtimePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\\"\\)`));

  assert.match(classifier, /changedFiles\.every\(isNonRuntimeOnly\)/);
});
