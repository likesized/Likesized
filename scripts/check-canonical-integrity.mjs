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
mustContain('docs/V1_PRODUCT_SPEC.md', 'Help Me Size It is fallback');
mustContain('supabase/schema_contract.md', '`follows` is the one canonical **Following** relationship');
mustContain('AI_REPOSITORY_RULES.md', 'Canonical CI must run `npm run canonical:check`');
mustContain('AI_REPOSITORY_RULES.md', 'Owner scope lock — LOCKED');
mustNotContain('docs/AI_MASTER_LOG.md', '## Live repair fast path');

const activeBranch = process.env.CANONICAL_HEAD_REF?.trim();
if (activeBranch) {
  mustContain('docs/AI_MASTER_LOG.md', `Active branch: **\`${activeBranch}\`**`);

  const changed = pullRequestChangedFiles();
  const changedSet = new Set(changed);
  const productSourceChanged = changed.some((rel) => /^(?:app|components|lib)\//.test(rel));
  const productSpecChanged = changedSet.has('docs/V1_PRODUCT_SPEC.md');
  const migrationChanged = changed.some((rel) => /^supabase\/migrations\/.*\.sql$/.test(rel));

  if ((productSourceChanged || productSpecChanged) && !changedSet.has('docs/AI_MASTER_LOG.md')) {
    fail('Product/source changes must update docs/AI_MASTER_LOG.md on the same active branch.');
  }
  if (migrationChanged && !changedSet.has('supabase/schema_contract.md')) {
    fail('Migration changes must update supabase/schema_contract.md in the same pull request.');
  }
  if (migrationChanged && !changedSet.has('docs/AI_MASTER_LOG.md')) {
    fail('Migration changes must update docs/AI_MASTER_LOG.md in the same pull request.');
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
const forbiddenFile = /(?:^|[-_.])(fixed|patched|v2|backup|temp|copy)(?=\.|$)/i;
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
