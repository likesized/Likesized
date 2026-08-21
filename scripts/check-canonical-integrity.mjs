import fs from 'node:fs';
import path from 'node:path';

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

const canonicalDocs = [
  'AI_REPOSITORY_RULES.md',
  'docs/AI_MASTER_LOG.md',
  'docs/V1_PRODUCT_SPEC.md',
  'supabase/schema_contract.md',
  'supabase/migrations/README.md',
  'README.md',
];

for (const rel of canonicalDocs) read(rel);

// Required current meanings across the canonical decision/architecture docs.
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

// Stale product semantics that must never be presented as current again.
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

// Database docs must not become stale by hard-coding a migration total.
for (const rel of ['supabase/migrations/README.md', 'supabase/schema_contract.md']) {
  const content = read(rel);
  if (/\ball\s+\d+\s+migrations\b/i.test(content)) fail(`${rel} hard-codes a migration count.`);
  if (/\bComplete V1 migration sequence\b/i.test(content)) fail(`${rel} claims a fixed complete migration sequence.`);
}

// Alternate schema representation is forbidden: ordered migrations are canonical.
if (fs.existsSync(path.join(root, 'supabase/schema.sql'))) {
  fail('supabase/schema.sql must not exist as an alternate current-state schema.');
}

// Temporary/version-suffixed source artifacts are forbidden.
const allFiles = walk(root);
const forbiddenFile = /(?:^|[-_.])(fixed|patched|v2|backup|temp|copy)(?=\.|$)/i;
for (const full of allFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  const base = path.basename(full);
  if (base === 'noop') fail(`Forbidden trigger/debug artifact committed: ${rel}`);
  if (forbiddenFile.test(base)) fail(`Forbidden patch/version-suffixed file committed: ${rel}`);
}

// Current application source may use Fit Twin as a designation, but not as a synonym for Following.
const sourceRoots = ['app', 'components', 'lib'];
const staleSourcePhrases = [
  'Fit Twins are your saved Fit Matches',
  'Save as Fit Twin',
  'Saved Fit Twin',
  'Remove Fit Twin',
  'followFitTwin',
  'unfollowFitTwin',
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

// Would Buy Again must not silently creep back into recommendation inputs.
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
