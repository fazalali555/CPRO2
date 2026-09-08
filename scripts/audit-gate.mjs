#!/usr/bin/env node
/**
 * Dependency audit gate with an explicit, reviewed allow-list.
 *
 * A plain `npm audit --audit-level=high` is currently guaranteed to fail because
 * of one advisory with no published fix (see ALLOWLIST). A permanently red job
 * gets ignored, which is worse than no job — so this script fails on *anything*
 * not explicitly accepted below, and each accepted entry must carry an owner,
 * an expiry, and the reason it cannot be fixed yet.
 *
 * Run locally:  npm run deps:audit
 * Runs in CI:   .github/workflows/main.yml
 */
import { execSync } from 'node:child_process';

/**
 * Advisories deliberately accepted. Review each entry before its `expires`;
 * remove it as soon as a fix ships.
 */
const ALLOWLIST = [
  {
    package: 'xlsx',
    // GHSA-4r6h-8v6p-xvw6 (prototype pollution) and GHSA-5pgg-2g8v-p4x9 (ReDoS).
    // The npm `xlsx` package is frozen at 0.18.5; SheetJS now publishes patched
    // builds only from https://cdn.sheetjs.com. Exposure is limited: the parser
    // runs in the operator's own browser on files that operator uploads, so
    // there is no server-side or cross-user blast radius.
    reason:
      'No patched release on the npm registry. Remediation: install from the ' +
      'SheetJS CDN tarball (npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz) ' +
      'once network access to cdn.sheetjs.com is available, then delete this entry.',
    expires: '2026-12-31',
  },
];

const allowed = new Set(ALLOWLIST.map((e) => e.package));

const main = () => {
  let audit;
  try {
    audit = execSync('npm audit --json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (err) {
    // `npm audit` exits non-zero when it finds anything; stdout still holds the JSON.
    audit = err.stdout;
  }

  if (!audit) {
    console.error('✗ npm audit produced no output.');
    return 1;
  }

  const report = JSON.parse(audit);
  const vulnerabilities = report.vulnerabilities ?? {};

  const blocking = [];
  const tolerated = [];

  for (const [name, info] of Object.entries(vulnerabilities)) {
    if (info.severity !== 'critical' && info.severity !== 'high') continue;
    if (allowed.has(name)) tolerated.push({ name, ...info });
    else blocking.push({ name, ...info });
  }

  // Stale allow-list entries are a failure too — they must be re-justified.
  const today = new Date().toISOString().slice(0, 10);
  const expired = ALLOWLIST.filter((e) => e.expires && e.expires < today);
  if (expired.length) {
    console.error('✗ Expired audit allow-list entries (re-review and update or remove):');
    for (const e of expired) console.error(`    ${e.package} (expired ${e.expires})`);
    return 1;
  }

  if (tolerated.length) {
    console.log(`Accepted (allow-listed) high/critical advisories: ${tolerated.length}`);
    for (const t of tolerated) {
      const entry = ALLOWLIST.find((e) => e.package === t.name);
      console.log(`  • ${t.name}@${t.range} [${t.severity}]`);
      console.log(`      ${entry.reason}`);
      console.log(`      review by: ${entry.expires}`);
    }
  }

  const { critical = 0, high = 0, moderate = 0, low = 0 } = report.metadata?.vulnerabilities ?? {};
  console.log(`\nTotals — critical: ${critical}, high: ${high}, moderate: ${moderate}, low: ${low}`);

  if (blocking.length) {
    console.error(`\n✗ ${blocking.length} unaccepted high/critical vulnerabilit(ies):`);
    for (const b of blocking) {
      const titles = (b.via || [])
        .map((v) => (typeof v === 'string' ? v : v.title))
        .join('; ')
        .slice(0, 120);
      console.error(`    ${b.name}@${b.range} [${b.severity}] — ${titles}`);
    }
    console.error('\n  Fix with `npm audit fix`, upgrade the dependency, or add a reviewed allow-list entry.');
    return 1;
  }

  console.log('✓ No unaccepted high/critical vulnerabilities.');
  return 0;
};

process.exit(main());
