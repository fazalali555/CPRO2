#!/usr/bin/env node
/**
 * ESLint ratchet.
 *
 * Four stylistic rules (`no-explicit-any`, `no-unused-vars`,
 * `react-refresh/only-export-components`, `react-hooks/exhaustive-deps`) still
 * have a large backlog across ~180 files. They are configured as warnings so the
 * gate is green, but a green gate that can silently drift is worthless — so this
 * script pins the current counts in `eslint-baseline.json` and fails the build if
 * any rule gets worse.
 *
 * The ratchet only ever tightens: reducing a count is allowed, and you should
 * commit the new baseline with `--update` when you pay some debt down.
 *
 *   npm run lint:baseline            check against the committed baseline
 *   npm run lint:baseline -- --update  record the current counts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ESLint } from 'eslint';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = path.join(repoRoot, 'eslint-baseline.json');
const UPDATE = process.argv.includes('--update');

/** Rules whose counts are ratcheted. Anything else must stay at zero. */
const RATCHETED_RULES = new Set([
  '@typescript-eslint/no-explicit-any',
  '@typescript-eslint/no-unused-vars',
  'react-refresh/only-export-components',
  'react-hooks/exhaustive-deps',
]);

const main = async () => {
  const eslint = new ESLint({ cwd: repoRoot });
  const results = await eslint.lintFiles(['src']);

  /** @type {Record<string, number>} */
  const counts = {};
  let unexpectedErrors = 0;

  for (const result of results) {
    for (const message of result.messages) {
      const rule = message.ruleId;
      if (!rule) continue;
      counts[rule] = (counts[rule] ?? 0) + 1;
      if (message.severity === 2 && !RATCHETED_RULES.has(rule)) {
        unexpectedErrors += 1;
      }
    }
  }

  const summary = Object.fromEntries(
    Object.entries(counts)
      .filter(([rule]) => RATCHETED_RULES.has(rule))
      .sort(([a], [b]) => a.localeCompare(b))
  );

  if (UPDATE) {
    writeFileSync(
      BASELINE_PATH,
      JSON.stringify(
        {
          $comment:
            'Committed ESLint debt ceiling. Regenerate with `npm run lint:baseline -- --update`. Counts may go down, never up.',
          generatedAt: new Date().toISOString(),
          rules: summary,
        },
        null,
        2
      ) + '\n'
    );
    console.log('✓ Baseline updated:');
    for (const [rule, count] of Object.entries(summary)) console.log(`    ${count}\t${rule}`);
    return unexpectedErrors > 0 ? 1 : 0;
  }

  if (!existsSync(BASELINE_PATH)) {
    console.error('✗ eslint-baseline.json is missing. Run: npm run lint:baseline -- --update');
    return 1;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).rules ?? {};
  const regressions = [];
  const improvements = [];

  for (const rule of new Set([...Object.keys(baseline), ...Object.keys(summary)])) {
    const allowed = baseline[rule] ?? 0;
    const actual = summary[rule] ?? 0;
    if (actual > allowed) regressions.push({ rule, allowed, actual });
    else if (actual < allowed) improvements.push({ rule, allowed, actual });
  }

  if (improvements.length) {
    console.log('Debt reduced — run `npm run lint:baseline -- --update` to lock in the gain:');
    for (const i of improvements) console.log(`    ${i.rule}: ${i.allowed} → ${i.actual}`);
  }

  if (unexpectedErrors > 0) {
    console.error(`\n✗ ${unexpectedErrors} error-severity finding(s) outside the ratcheted set.`);
    console.error('  Run `npm run lint` for details.');
    return 1;
  }

  if (regressions.length) {
    console.error('\n✗ ESLint debt increased beyond the committed baseline:');
    for (const r of regressions) {
      console.error(`    ${r.rule}: ${r.allowed} allowed, ${r.actual} found (+${r.actual - r.allowed})`);
    }
    console.error('\n  Fix the new findings. Do not raise the baseline to make CI pass.');
    return 1;
  }

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  console.log(`✓ ESLint debt within baseline (${total} outstanding findings across ${Object.keys(summary).length} rules).`);
  return 0;
};

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
