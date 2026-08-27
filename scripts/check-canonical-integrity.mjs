import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    fail(`Missing required canonical file: ${rel}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function mustContain(rel, text) {
  const content = read(rel);
  if (!content.includes(text)) fail(`${rel} must contain current canonical statement: ${JSON.stringify(text)}`);
}

function mustNotContain(rel, text) {
  const content = read(rel);
  if (content.includes(text)) fail(`${rel} contains stale/forbidden canonical wording: ${JSON.stringify(text)}`);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', '.vercel'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function pullRequestChangedFiles() {
  const activeBranch = process.env.CANONICAL_HEAD_REF?.trim();
  if (!activeBranch) return [];
  try {
    execFileSync('git', ['fetch', '--no-tags', 'origin', 'main'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
    const mergeBase = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: root, encoding: 'utf8' }).trim();
    return execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { cwd: root, encoding: 'utf8' })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch (error) {
    fail(`Could not determine full pull-request changed files for canonical synchronization: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

function readCanonicalBase(rel) {
  try {
    return execFileSync('git', ['show', `origin/main:${rel}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    fail(`Could not read canonical main version of ${rel}: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}

function isRuntimeProductFile(rel) {
  return /^(?:app|components|lib|public)\//.test(rel)
    || /^supabase\/migrations\/.*\.sql$/.test(rel)
    || rel === 'package.json'
    || rel === 'package-lock.json'
    || rel === 'next.config.ts'
    || rel === 'proxy.ts'
    || rel === 'vercel.json'
    || rel === 'scripts/vercel-ignore-build.mjs';
}

function extractFeatureContracts(content) {
  const startMarker = '# CANONICAL FEATURE CONTRACTS — OWNER LOCKED';
  const endMarker = '# END CANONICAL FEATURE CONTRACTS';
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return null;
  return content.slice(start, end + endMarker.length).trim();
}

function authorizedSafeguardFiles(baseMaster, branch) {
  const lines = baseMaster.split(/\r?\n/);
  const allowed = new Set();
  const branchNeedle = `- Implementation branch: \`${branch}\``;

  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].startsWith('## Pending owner-approved safeguard change — ')) continue;
    const block = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^#{1,2}\s/.test(lines[j])) break;
      block.push(lines[j]);
    }
    if (!block.includes(branchNeedle)) continue;
    const authorizedLine = block.find((line) => line.startsWith('- Authorized safeguard files:'));
    if (!authorizedLine) continue;
    for (const match of authorizedLine.matchAll(/`([^`]+)`/g)) allowed.add(match[1]);
  }

  return allowed;
}

function isNonRuntimeReconciliationFile(rel) {
  return rel.startsWith('docs/')
    || rel === 'AI_REPOSITORY_RULES.md'
    || rel === 'README.md'
    || rel.startsWith('.github/')
    || rel.startsWith('tests/')
    || rel === 'supabase/schema_contract.md'
    || rel === 'supabase/storage.sql'
    || rel === 'scripts/check-canonical-integrity.mjs';
}

const canonicalDocs = [
  'AI_REPOSITORY_RULES.md',
  'docs/AI_MASTER_LOG.md',
  'docs/V1_PRODUCT_SPEC.md',
  'supabase/schema_contract.md',
  'supabase/migrations/README.md',
  'README.md',
];

for (const rel of canonicalDocs) read(rel);

for (const rel of ['docs/AI_MASTER_LOG.md', 'docs/V1_PRODUCT_SPEC.md', 'README.md']) {
  mustContain(rel, 'Following');
  mustContain(rel, 'Fit Twin');
  mustContain(rel, 'system-generated');
  mustContain(rel, 'no current V1 1–5-star Fit Rating UI');
}
mustContain('docs/AI_MASTER_LOG.md', 'CANONICAL RECOVERY');
mustContain('docs/AI_MASTER_LOG.md', '# CANONICAL FEATURE CONTRACTS — OWNER LOCKED');
mustContain('docs/AI_MASTER_LOG.md', '# END CANONICAL FEATURE CONTRACTS');
mustContain('docs/V1_PRODUCT_SPEC.md', 'Help Me Size It is fallback');
mustContain('supabase/schema_contract.md', '`follows` is the one canonical **Following** relationship');
mustContain('AI_REPOSITORY_RULES.md', 'Canonical CI must run `npm run canonical:check`');
mustContain('AI_REPOSITORY_RULES.md', 'Owner scope lock — LOCKED');
mustContain('AI_REPOSITORY_RULES.md', 'Runtime/safeguard separation gate — LOCKED');
mustContain('AI_REPOSITORY_RULES.md', 'Every committed `tests/*.test.ts` safeguard must run automatically in CI by discovery.');
mustContain('AI_REPOSITORY_RULES.md', '`vercel.json` + `scripts/vercel-ignore-build.mjs` own the canonical non-runtime release boundary.');
mustContain('.github/workflows/ci.yml', 'for test_file in tests/*.test.ts; do');
mustContain('supabase/storage.sql', 'Support/reference mirror only. This file is not a second canonical current-state schema.');
mustNotContain('supabase/storage.sql', 'Canonical current-state storage model.');
mustNotContain('docs/AI_MASTER_LOG.md', '## Live repair fast path');

// Style Feed relationship/footer behavior is owner locked. Keep the two end-of-feed actions
// distinct: one switches to All Following, the other discovers more Fit Twins.
mustContain('app/circle/page.tsx', 'href={feedHref("all", occasion, styleTag)}>See All Following →</Link>');
mustContain('app/circle/page.tsx', 'href="/people">Find More Fit Twins →</Link>');
mustContain('docs/AI_MASTER_LOG.md', '**See All Following →**');
mustContain('docs/AI_MASTER_LOG.md', '**Find More Fit Twins →**');
mustContain('docs/V1_PRODUCT_SPEC.md', '**See All Following →**');
mustContain('docs/V1_PRODUCT_SPEC.md', '**Find More Fit Twins →**');

// Dynamic application/release status belongs only to the master. The schema contract may
// record database behavior and immutable migration facts, but it must not become a stale
// second ledger for the currently released application line or Vercel operational state.
mustNotContain('supabase/schema_contract.md', 'Current production application source is PR #');
mustNotContain('supabase/schema_contract.md', 'Vercel production');

// Vercel's release boundary prevents a non-runtime canonical reconciliation from spawning
// another production application build merely to record the prior release. It is fail-open:
// unknown or runtime-affecting changes must build, never silently skip.
mustContain('vercel.json', '"ignoreCommand": "node scripts/vercel-ignore-build.mjs"');
const releaseBoundary = read('scripts/vercel-ignore-build.mjs');
for (const required of [
  'if (diff.status !== 0)',
  'process.exit(1)',
  'changedFiles.every(isNonRuntimeOnly)',
  'Runtime-affecting or unclassified files changed; production build required.',
]) {
  if (!releaseBoundary.includes(required)) fail(`scripts/vercel-ignore-build.mjs must preserve fail-open release-boundary logic: ${JSON.stringify(required)}`);
}
for (const forbiddenRuntimeClassification of [
  'file.startsWith("app/")',
  'file.startsWith("components/")',
  'file.startsWith("lib/")',
  'file.startsWith("public/")',
  'file.startsWith("supabase/migrations/")',
  'file === "package.json"',
  'file === "package-lock.json"',
  'file === "vercel.json"',
  'file === "scripts/vercel-ignore-build.mjs"',
]) {
  if (releaseBoundary.includes(forbiddenRuntimeClassification)) {
    fail(`scripts/vercel-ignore-build.mjs must not classify runtime/release-boundary source as skippable: ${JSON.stringify(forbiddenRuntimeClassification)}`);
  }
}

const activeBranch = process.env.CANONICAL_HEAD_REF?.trim();
if (activeBranch) {
  const changed = pullRequestChangedFiles();
  const changedSet = new Set(changed);
  const nonRuntimeReconciliation = changed.length > 0 && changed.every(isNonRuntimeReconciliationFile);

  if (nonRuntimeReconciliation) {
    mustContain('docs/AI_MASTER_LOG.md', 'Active branch: **NONE — canonical main**');
  } else {
    mustContain('docs/AI_MASTER_LOG.md', `Active branch: **\`${activeBranch}\`**`);
  }

  const productOrSafeguardChanged = changed.some((rel) => /^(?:app|components|lib|tests|scripts|\.github\/workflows)\//.test(rel))
    || changedSet.has('package.json')
    || changedSet.has('package-lock.json')
    || changedSet.has('vercel.json');
  const productSpecChanged = changedSet.has('docs/V1_PRODUCT_SPEC.md');
  const migrationChanged = changed.some((rel) => /^supabase\/migrations\/.*\.sql$/.test(rel));

  if ((productOrSafeguardChanged || productSpecChanged) && !changedSet.has('docs/AI_MASTER_LOG.md')) {
    fail('Product/source/safeguard changes must update docs/AI_MASTER_LOG.md on the same active branch.');
  }
  if (migrationChanged && !changedSet.has('supabase/schema_contract.md')) {
    fail('Migration changes must update supabase/schema_contract.md in the same pull request.');
  }
  if (migrationChanged && !changedSet.has('docs/AI_MASTER_LOG.md')) {
    fail('Migration changes must update docs/AI_MASTER_LOG.md in the same pull request.');
  }

  // This gate intentionally activates only after the separation rule already exists on
  // canonical main. That permits the one owner-authorized bootstrap PR installing the gate,
  // then permanently prevents future runtime PRs from authoring their own judging rules.
  const baseRules = readCanonicalBase('AI_REPOSITORY_RULES.md');
  const separationGateActive = baseRules.includes('### Runtime/safeguard separation gate — LOCKED');
  const runtimeProductChanged = changed.some(isRuntimeProductFile);

  if (separationGateActive && runtimeProductChanged) {
    const forbiddenGovernanceChanges = changed.filter((rel) => rel === 'AI_REPOSITORY_RULES.md'
      || rel === 'scripts/check-canonical-integrity.mjs'
      || rel.startsWith('.github/workflows/'));
    for (const rel of forbiddenGovernanceChanges) {
      fail(`Runtime Product PRs may not modify governance/safeguard machinery in the same PR: ${rel}`);
    }

    const baseMaster = readCanonicalBase('docs/AI_MASTER_LOG.md');
    const currentMaster = read('docs/AI_MASTER_LOG.md');
    const baseContracts = extractFeatureContracts(baseMaster);
    const currentContracts = extractFeatureContracts(currentMaster);
    if (!baseContracts || !currentContracts) {
      fail('Runtime Product PRs require the marked CANONICAL FEATURE CONTRACTS section on both canonical main and the candidate branch.');
    } else if (baseContracts !== currentContracts) {
      fail('Runtime Product PRs may not rewrite stable CANONICAL FEATURE CONTRACTS. Record an owner-approved pending decision before implementation and reconcile the stable contract afterward.');
    }

    const conditionalProtected = changed.filter((rel) => /^tests\/.*\.test\.ts$/.test(rel) || rel === 'docs/V1_PRODUCT_SPEC.md');
    if (conditionalProtected.length) {
      const authorized = authorizedSafeguardFiles(baseMaster, activeBranch);
      for (const rel of conditionalProtected) {
        if (!authorized.has(rel)) {
          fail(`Runtime Product PR changed protected safeguard/spec without a pre-existing Pending owner-approved safeguard change on canonical main for ${activeBranch}: ${rel}`);
        }
      }
    }
  }
}

const forbiddenDocPhrases = [
  'A Fit Twin is a Fit Match the user deliberately saves/follows',
  'Fit Twins are your saved Fit Matches',
  'Fit Twins are saved/followed people',
  'Fit Twin is a Fit Match the user deliberately saves/follows',
  'Fit Result vs Fit Rating — LOCKED distinction',
  'Fit Rating = member’s personal 1–5 star',
  'Fit Rating = member\'s personal 1–5 star',
];
for (const rel of canonicalDocs) {
  for (const phrase of forbiddenDocPhrases) mustNotContain(rel, phrase);
}

for (const rel of ['supabase/migrations/README.md', 'supabase/schema_contract.md']) {
  const content = read(rel);
  if (/\ball\s+\d+\s+migrations\b/i.test(content)) fail(`${rel} hard-codes a migration count.`);
  if (/\bComplete V1 migration sequence\b/i.test(content)) fail(`${rel} claims a fixed complete migration sequence.`);
}

if (fs.existsSync(path.join(root, 'supabase/schema.sql'))) {
  fail('supabase/schema.sql must not exist as an alternate current-state schema.');
}

const allFiles = walk(root);
const forbiddenFile = /(?:^|[-_.])(fixed|patched|hotfix|v2|backup|temp|copy|new[-_.]?version)(?=\.|$)/i;
for (const full of allFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  const base = path.basename(full);
  if (base === 'noop') fail(`Forbidden trigger/debug artifact committed: ${rel}`);
  if (forbiddenFile.test(base)) fail(`Forbidden patch/version-suffixed file committed: ${rel}`);
}

const sourceRoots = ['app', 'components', 'lib'];
const staleSourcePhrases = [
  'Fit Twins are your saved Fit Matches',
  'Save as Fit Twin',
  'Saved Fit Twin',
  'Remove Fit Twin',
  'followFitTwin',
  'unfollowFitTwin',
  'setFitTwinNotificationMute',
  'saveFitTwinNotificationSettings',
  'markAllFitTwinNotificationsRead',
  'markFitTwinNotificationRead',
  'fitTwinIds',
  '/outfits?feed=twins',
  'Fit Twin outfits',
];
for (const base of sourceRoots) {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) continue;
  for (const full of walk(dir)) {
    if (!/\.(?:ts|tsx|js|jsx|md|css)$/.test(full)) continue;
    const rel = path.relative(root, full).replaceAll('\\', '/');
    const content = fs.readFileSync(full, 'utf8');
    for (const phrase of staleSourcePhrases) {
      if (content.includes(phrase)) fail(`${rel} contains stale Following/Fit-Twin source semantics: ${JSON.stringify(phrase)}`);
    }
    if (/[★☆]/u.test(content)) fail(`${rel} contains star-rating glyphs; current V1 star Fit Rating UI is removed.`);
    if (/rating\s*:\s*number/.test(content) && /fit/i.test(content)) fail(`${rel} appears to define numeric fit rating UI state.`);
  }
}

const taggedPanelPath = 'app/outfits/[id]/TaggedItemsPanel.tsx';
mustContain(taggedPanelPath, 'Not enough fit data to confidently recommend a size.');
mustContain(taggedPanelPath, 'Our FITuition suggests: {meta.recommendation.sizeLabel}');
mustContain(taggedPanelPath, 'Confidence: {meta.recommendation.confidenceLabel}');
mustContain(taggedPanelPath, 'View more Relevant Fit Reports →');
mustContain(taggedPanelPath, 'Best Available Matching Fit Report');
mustContain(taggedPanelPath, 'Your Fit Report');
mustNotContain(taggedPanelPath, 'Your own exact report');
mustNotContain(taggedPanelPath, 'I’m not confident enough to recommend a size yet.');
mustNotContain(taggedPanelPath, 'FITuition DETAILS');
mustNotContain(taggedPanelPath, 'Strong Fit Report summary');
mustNotContain(taggedPanelPath, 'Best current match');
mustNotContain(taggedPanelPath, 'FITuition still can’t recommend a size yet.');

const twinsPage = read('app/twins/page.tsx');
if (/\.from\(["']follows["']\)/.test(twinsPage)) {
  fail('app/twins/page.tsx must never derive Fit Twin membership from the follows graph.');
}
mustContain('app/people/actions.ts', 'followPerson');
mustContain('app/people/actions.ts', 'unfollowPerson');
mustContain('app/outfits/page.tsx', '/closet?tab=outfits');
mustContain('app/closet/page.tsx', '>Garments</Link>');
mustContain('app/closet/page.tsx', '>Outfits</Link>');
mustContain('app/closet/page.tsx', '>FITuition</Link>');
mustNotContain('app/outfits/page.tsx', 'feed==="following"');

const recommendation = read('lib/recommendation.ts');
if (/wouldBuyAgain|would_buy_again/.test(recommendation)) {
  fail('lib/recommendation.ts must not use Would Buy Again in size recommendation/confidence under the owner-locked Fit Match decision.');
}

if (errors.length) {
  console.error('\nCanonical integrity check FAILED:\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error(`\n${errors.length} canonical-integrity problem(s) found. Fix the source of truth; do not weaken this check.\n`);
  process.exit(1);
}

console.log('Canonical integrity check passed.');