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

for (const rel of ['docs/AI_MASTER_LOG.md', 'docs/V1_PRODUCT_SPEC.md', 'README.md']) {
  mustContain(rel, 'Following');
  mustContain(rel, 'Fit Twin');
  mustContain(rel, 'system-generated');
  mustContain(rel, 'no current V1 1–5-star Fit Rating UI');
}

mustContain('docs/AI_MASTER_LOG.md', '# CANONICAL FEATURE CONTRACTS — OWNER LOCKED');
mustContain('docs/AI_MASTER_LOG.md', '# END CANONICAL FEATURE CONTRACTS');
mustContain('docs/V1_PRODUCT_SPEC.md', 'Help Me Size It is fallback');
mustContain('supabase/schema_contract.md', '`follows` is the one canonical **Following** relationship');
mustContain('AI_REPOSITORY_RULES.md', 'Two change lanes — LOCKED');
mustContain('AI_REPOSITORY_RULES.md', 'Candidate must not control its own judge — LOCKED');
mustContain('AI_REPOSITORY_RULES.md', 'Every committed `tests/*.test.ts` safeguard must run automatically in CI by discovery.');
mustContain('AI_REPOSITORY_RULES.md', '`vercel.json` + `scripts/vercel-ignore-build.mjs` own the non-runtime Vercel release boundary.');
mustContain('.github/workflows/ci.yml', 'for test_file in tests/*.test.ts; do');
mustContain('.github/workflows/ci.yml', 'npm audit --omit=dev --audit-level=high');
mustContain('.github/workflows/fast.yml', 'npm audit --omit=dev --audit-level=high');
mustContain('.github/workflows/trusted-governance.yml', 'pull_request_target:');
mustContain('.github/workflows/trusted-governance.yml', 'node trusted/scripts/check-pr-governance.mjs trusted candidate');
mustContain('.github/workflows/trusted-governance.yml', 'permissions:');
mustContain('supabase/storage.sql', 'Support/reference mirror only. This file is not a second canonical current-state schema.');
mustNotContain('supabase/storage.sql', 'Canonical current-state storage model.');

// Style Feed relationship/footer behavior is owner locked. Keep the two end-of-feed actions
// distinct: one switches to All Following, the other discovers more Fit Twins.
mustContain('app/circle/page.tsx', 'href={feedHref("all", occasion, styleTag)}>See All Following →</Link>');
mustContain('app/circle/page.tsx', 'href="/people">Find More Fit Twins →</Link>');
mustContain('docs/AI_MASTER_LOG.md', '**See All Following →**');
mustContain('docs/AI_MASTER_LOG.md', '**Find More Fit Twins →**');
mustContain('docs/V1_PRODUCT_SPEC.md', '**See All Following →**');
mustContain('docs/V1_PRODUCT_SPEC.md', '**Find More Fit Twins →**');

// Dynamic release status belongs only to the Master/Vercel boundary.
mustNotContain('supabase/schema_contract.md', 'Current production application source is PR #');
mustNotContain('supabase/schema_contract.md', 'Vercel production');

// Vercel release boundary must fail open: unknown/runtime changes build.
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

// High-confidence, offline sensitive-data leak detection. This check reports and fails only;
// it never rewrites repository content. The checker file itself is excluded because it contains
// the detection signatures as source code and is already protected by trusted governance.
const sensitiveScanSkip = new Set(['scripts/check-canonical-integrity.mjs']);
const safeEmailDomains = new Set([
  'example.com',
  'example.org',
  'example.net',
  'users.noreply.github.com',
  'likesized.com',
]);
const sensitiveTextFile = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|sql|toml|txt|css|html|sh|env|example)$/i;
const secretTokenPatterns = [
  ['private key material', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['GitHub access token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ['OpenAI-style secret key', /\bsk-[A-Za-z0-9]{20,}\b/g],
  ['Stripe live secret key', /\bsk_live_[A-Za-z0-9]{16,}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['SendGrid API key', /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g],
];
const emailPattern = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
const literalSecretAssignment = /\b(?:api[_-]?key|apiKey|secret[_-]?key|secretKey|service[_-]?role[_-]?key|serviceRoleKey|access[_-]?token|accessToken|auth[_-]?token|authToken|client[_-]?secret|clientSecret)\b\s*[:=]\s*(["'`])([^"'`\r\n]{12,})\1/gi;

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

function looksLikePlaceholder(value) {
  const normalized = value.toLowerCase();
  return [
    'example',
    'sample',
    'mock',
    'dummy',
    'placeholder',
    'redacted',
    'changeme',
    'change-me',
    'not-a-real',
    'not_real',
    'fake',
    'test-only',
    'test_only',
  ].some((marker) => normalized.includes(marker));
}

function sensitiveFailure(rel, content, index, label) {
  fail(`${rel}:${lineNumberAt(content, index)} contains ${label}. Remove the hard-coded value and rotate any real credential that was exposed.`);
}

for (const full of allFiles) {
  const rel = path.relative(root, full).replaceAll('\\', '/');
  if (sensitiveScanSkip.has(rel)) continue;
  if (!sensitiveTextFile.test(rel) && !['.gitignore', 'Dockerfile'].includes(path.basename(full))) continue;

  let content;
  try {
    content = fs.readFileSync(full, 'utf8');
  } catch {
    continue;
  }

  for (const [label, pattern] of secretTokenPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) sensitiveFailure(rel, content, match.index ?? 0, label);
  }

  emailPattern.lastIndex = 0;
  for (const match of content.matchAll(emailPattern)) {
    const domain = match[1].toLowerCase();
    if (safeEmailDomains.has(domain) || domain.endsWith('.example.com') || domain.endsWith('.example.org') || domain.endsWith('.example.net')) continue;
    sensitiveFailure(rel, content, match.index ?? 0, 'a hard-coded non-placeholder email address');
  }

  ssnPattern.lastIndex = 0;
  for (const match of content.matchAll(ssnPattern)) sensitiveFailure(rel, content, match.index ?? 0, 'a Social Security number pattern');

  literalSecretAssignment.lastIndex = 0;
  for (const match of content.matchAll(literalSecretAssignment)) {
    const value = match[2];
    if (looksLikePlaceholder(value)) continue;
    sensitiveFailure(rel, content, match.index ?? 0, 'a literal API key/secret/token assignment');
  }
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
const taggedFituitionPath = 'components/TaggedFituitionCard.tsx';
mustContain(taggedPanelPath, 'TaggedFituitionCard');
mustContain(taggedPanelPath, 'See Full Details →');
mustNotContain(taggedPanelPath, 'See FITuition Details →');
mustNotContain(taggedPanelPath, 'View more Relevant Fit Reports →');
mustNotContain(taggedPanelPath, 'previewBack');
mustContain(taggedFituitionPath, 'Not enough fit data to confidently recommend a size.');
mustContain(taggedFituitionPath, 'Our FITuition suggests: {meta.recommendation.sizeLabel}');
mustContain(taggedFituitionPath, 'Confidence: {meta.recommendation.confidenceLabel}');
mustContain(taggedFituitionPath, 'Best Available Matching Fit Report');
mustContain(taggedFituitionPath, 'Your Fit Report');
mustContain(taggedFituitionPath, 'Strong Fit Reports');
mustContain(taggedFituitionPath, '<RelevantReport report={report}/>');
mustContain(taggedFituitionPath, '<StrongReports groups={meta.strongFitReports}/>');
mustNotContain(taggedFituitionPath, 'Your own exact report');
mustNotContain(taggedFituitionPath, 'I’m not confident enough to recommend a size yet.');
mustNotContain(taggedFituitionPath, 'FITuition DETAILS');
mustNotContain(taggedFituitionPath, 'Strong Fit Report summary');
mustNotContain(taggedFituitionPath, 'Best current match');
mustNotContain(taggedFituitionPath, 'FITuition still can’t recommend a size yet.');

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
