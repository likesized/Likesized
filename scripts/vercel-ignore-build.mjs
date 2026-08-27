import { spawnSync } from "node:child_process";

const diff = spawnSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
  encoding: "utf8",
});

// Fail open: if Git history cannot be inspected, build rather than risk skipping
// a runtime-affecting production change.
if (diff.status !== 0) {
  console.log("Could not classify the commit safely; production build required.");
  process.exit(1);
}

const changedFiles = diff.stdout
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

const isNonRuntimeOnly = (file) =>
  file.startsWith("docs/") ||
  file === "AI_REPOSITORY_RULES.md" ||
  file === "README.md" ||
  file.startsWith(".github/") ||
  file.startsWith("tests/") ||
  file === "supabase/schema_contract.md" ||
  file === "supabase/storage.sql" ||
  file === "scripts/check-canonical-integrity.mjs";

if (changedFiles.length > 0 && changedFiles.every(isNonRuntimeOnly)) {
  console.log("Only canonical docs, CI metadata, or regression safeguards changed; skip Vercel production build.");
  process.exit(0);
}

console.log("Runtime-affecting or unclassified files changed; production build required.");
process.exit(1);
