import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [trustedRootArg, candidateRootArg] = process.argv.slice(2);
const trustedRoot = path.resolve(trustedRootArg || '.');
const candidateRoot = path.resolve(candidateRootArg || '.');
const baseSha = process.env.PR_BASE_SHA?.trim();
const headSha = process.env.PR_HEAD_SHA?.trim();
const prBody = process.env.PR_BODY || '';
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(root, rel) {
  const full = path.join(root, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

function field(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return prBody.match(new RegExp(`^${escaped}:\\s*(.+?)\\s*$`, 'mi'))?.[1]?.trim() || '';
}

function extractFeatureContracts(content) {
  const startMarker = '# CANONICAL FEATURE CONTRACTS — OWNER LOCKED';
  const endMarker = '# END CANONICAL FEATURE CONTRACTS';
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return null;
  return content.slice(start, end + endMarker.length).trim();
}

function changedEntries() {
  if (!baseSha || !headSha) {
    fail('Trusted governance guard requires PR_BASE_SHA and PR_HEAD_SHA.');
    return [];
  }
  try {
    const result = execFileSync('git', ['-C', candidateRoot, 'diff', '--name-status', `${baseSha}...${headSha}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return result
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\t+/);
        const status = parts[0];
        const rel = parts.at(-1);
        return { status, rel };
      });
  } catch (error) {
    fail(`Could not inspect the complete PR diff: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

const entries = changedEntries();
const changed = entries.map((entry) => entry.rel);
const changedSet = new Set(changed);
const lane = field('Change lane');
const productTruth = field('Product truth changed');
const staleReconciliation = field('Stale canon reconciliation');
const governanceChange = field('Governance change');
const ownerAuthorization = field('Owner authorization');

if (!['Repair', 'Product Change'].includes(lane)) {
  fail('PR body must declare exactly `Change lane: Repair` or `Change lane: Product Change`.');
}

const governanceProtected = changed.filter((rel) =>
  rel === 'AI_REPOSITORY_RULES.md'
  || rel === '.github/CODEOWNERS'
  || rel.startsWith('.github/workflows/')
  || rel === '.github/pull_request_template.md'
  || rel.startsWith('.github/PULL_REQUEST_TEMPLATE/')
  || rel === 'scripts/check-canonical-integrity.mjs'
  || rel === 'scripts/check-pr-governance.mjs'
  || rel === 'vercel.json'
  || rel === 'scripts/vercel-ignore-build.mjs'
);

const architectureFiles = changed.filter((rel) =>
  rel === 'package.json'
  || rel === 'package-lock.json'
  || rel === 'next.config.ts'
  || rel === 'proxy.ts'
  || rel === 'supabase/config.toml'
);

const migrations = changed.filter((rel) => /^supabase\/migrations\/.*\.sql$/.test(rel));
const modifiedTests = entries.filter((entry) => /^M/.test(entry.status) && /^tests\/.*\.test\.ts$/.test(entry.rel)).map((entry) => entry.rel);
const productSpecChanged = changedSet.has('docs/V1_PRODUCT_SPEC.md');
const masterChanged = changedSet.has('docs/AI_MASTER_LOG.md');
const schemaContractChanged = changedSet.has('supabase/schema_contract.md');

const baseMaster = read(trustedRoot, 'docs/AI_MASTER_LOG.md');
const candidateMaster = read(candidateRoot, 'docs/AI_MASTER_LOG.md');
const baseContracts = extractFeatureContracts(baseMaster);
const candidateContracts = extractFeatureContracts(candidateMaster);
const stableContractsChanged = baseContracts !== candidateContracts;

if (lane === 'Repair') {
  if (!/^no$/i.test(productTruth)) fail('Repair PRs must declare `Product truth changed: No`.');
  if (governanceProtected.length) fail(`Repair lane may not modify protected governance: ${governanceProtected.join(', ')}`);
  if (architectureFiles.length) fail(`Repair lane crossed a canonical architecture boundary and must escalate: ${architectureFiles.join(', ')}`);
  if (migrations.length) fail(`Repair lane may not introduce/change migrations; escalate to Product Change: ${migrations.join(', ')}`);
  if (stableContractsChanged) fail('Repair lane may not change the stable CANONICAL FEATURE CONTRACTS section.');

  const staleNeeded = productSpecChanged || modifiedTests.length > 0;
  if (staleNeeded && !/^yes$/i.test(staleReconciliation)) {
    fail('Repair modified an existing test and/or Product Spec; declare `Stale canon reconciliation: Yes` and document the pre-existing canonical evidence.');
  }
  if (!staleNeeded && /^yes$/i.test(staleReconciliation)) {
    fail('`Stale canon reconciliation: Yes` was declared but no pre-existing test/Product Spec assertion was modified.');
  }
  if (/^yes$/i.test(governanceChange)) fail('A Repair cannot declare a governance change; use Product Change.');
}

if (lane === 'Product Change') {
  if (!/^yes$/i.test(productTruth)) fail('Product Change PRs must declare `Product truth changed: Yes`.');
  if (!/^confirmed$/i.test(ownerAuthorization)) fail('Product Change PRs must declare `Owner authorization: Confirmed`.');
  if (governanceProtected.length && !/^yes$/i.test(governanceChange)) {
    fail(`Protected governance changed without \`Governance change: Yes\`: ${governanceProtected.join(', ')}`);
  }
  if (!governanceProtected.length && /^yes$/i.test(governanceChange)) {
    fail('`Governance change: Yes` was declared but no protected governance file changed.');
  }

  const durableProductTruthChanged = stableContractsChanged || productSpecChanged || migrations.length > 0;
  if (durableProductTruthChanged && !masterChanged) {
    fail('Product Change altered durable Product/architecture truth but did not reconcile docs/AI_MASTER_LOG.md.');
  }
  if (migrations.length && !schemaContractChanged) {
    fail('Migration Product Change must reconcile supabase/schema_contract.md in the same PR.');
  }
}

if (stableContractsChanged && !baseContracts) fail('Trusted base is missing the marked CANONICAL FEATURE CONTRACTS section.');
if (stableContractsChanged && !candidateContracts) fail('Candidate removed or broke the marked CANONICAL FEATURE CONTRACTS section.');

if (errors.length) {
  console.error('\nTrusted PR governance FAILED:\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error(`\n${errors.length} governance problem(s) found. The candidate may not redefine its own judge.\n`);
  process.exit(1);
}

console.log(`Trusted PR governance passed for ${lane}.`);
