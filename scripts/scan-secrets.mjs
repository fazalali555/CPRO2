#!/usr/bin/env node
/**
 * Secret scanner.
 *
 * Exits non-zero when a high-confidence credential pattern appears in a tracked
 * file. This exists because a live Gemini API key was once hardcoded in client
 * source, committed in `.env`, and shipped inside the production bundle.
 *
 * Run locally:  npm run secrets:scan
 * Runs in CI:   .github/workflows/main.yml
 *
 * Scans git-tracked files only, so build output and local `.env` are ignored.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** High-confidence patterns. Keep these precise — noisy scanners get disabled. */
const RULES = [
  { id: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g, label: 'Google API key' },
  { id: 'aws-access-key', pattern: /\b(?:A3T[A-Z0-9]|AKIA|ASIA)[0-9A-Z]{16}\b/g, label: 'AWS access key id' },
  { id: 'github-token', pattern: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/g, label: 'GitHub token' },
  { id: 'slack-token', pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, label: 'Slack token' },
  { id: 'openai-key', pattern: /\bsk-[0-9A-Za-z_-]{32,}\b/g, label: 'OpenAI-style secret key' },
  { id: 'private-key-block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, label: 'Private key block' },
];

/** Files that legitimately document patterns rather than contain secrets. */
const ALLOWLIST = new Set([
  'scripts/scan-secrets.mjs',
  '.env.example',
]);

/** @returns {string[]} tracked file paths, relative to the repo root */
const trackedFiles = () => {
  const out = execSync('git ls-files -z', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\0').filter(Boolean);
};

const isScannable = (file) =>
  !ALLOWLIST.has(file) &&
  !file.startsWith('package-lock.json') &&
  !/\.(png|jpe?g|gif|webp|ico|pdf|woff2?|ttf|eot|mp4|webm|zip|tgz|lock)$/i.test(file);

const main = () => {
  const findings = [];

  for (const file of trackedFiles()) {
    if (!isScannable(file)) continue;

    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue; // binary or unreadable — skip
    }

    const lines = text.split('\n');
    lines.forEach((line, index) => {
      for (const rule of RULES) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(line)) {
          findings.push({ file, line: index + 1, rule: rule.label });
        }
      }
    });
  }

  if (findings.length === 0) {
    console.log('✓ No secrets found in tracked files.');
    return 0;
  }

  console.error(`✗ Found ${findings.length} potential secret(s):`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  ${f.rule}`);
  }
  console.error(
    '\nRemove the value, move it to an untracked .env, and ROTATE the credential —\n' +
      'anything committed to git history must be treated as compromised.'
  );
  return 1;
};

process.exit(main());
