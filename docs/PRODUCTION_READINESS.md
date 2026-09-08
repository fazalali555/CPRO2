# CPRO2 — Production-Readiness Analysis & Remediation

**Date:** 2026-09-08
**Scope:** full repository (466 source files, ~94,600 lines across `src/` and `server/`)
**Supersedes:** the May 2026 `AUDIT_REPORT.md`, whose two headline security/reliability
claims were re-verified below (one fixed, one still open).

Everything in the "Fixed" columns was verified by running the project's own tooling —
the exact commands and their results are in §6. Nothing here is asserted without a
command that was actually run.

---

## 1. Verification baseline (before vs. after)

| Gate | Before | After |
|---|---|---|
| `npm ci` | **FAIL** — lockfile out of sync | **PASS** |
| `tsc --noEmit` | PASS (0 errors) | PASS (0 errors) |
| `vitest run` | PASS — 18 files / 83 tests | PASS — **19 files / 118 tests** |
| `vite build` | PASS, 17.05 s | PASS, **3.33 s** |
| `eslint src` | **FAIL** — 858 problems (**787 errors**) | **PASS** — 0 errors, 760 ratcheted warnings |
| `npm audit --audit-level=high` | **FAIL** — 65 vulns (**2 critical, 12 high**) | **PASS** — 0 critical, 1 high (allow-listed, see §4) |
| Secret scan | *no such gate* | **PASS** (new `npm run secrets:scan`) |
| CI workflow | **red on 3 of 5 steps** | green; every gate enforced |

---

## 2. Critical findings and fixes

### 2.1 Live API key shipped in the production bundle — CRITICAL
The Gemini key `AIza…Ug` (redacted — the full value is recoverable from
commit `5e1495e`; see the rotation note below) was:

1. hardcoded as a fallback in `src/features/clerk-desk/services/AIService.ts:13` and
   `src/features/clerk-desk/components/wordpro/components/ribbon-tabs/ReviewTab.tsx:49`,
2. committed in `.env`, and
3. present in `test-gemini.js`.

It was **confirmed present in the built bundle** (`dist/assets/ClerkDesk-*.js`,
`dist/assets/CopilotSidebar-*.js`), so anyone loading the app could extract it.

**Fixed:** key removed from all three sources; a single `src/config/geminiKey.ts` is now
the only resolver (operator key in Settings → `VITE_GEMINI_API_KEY` → otherwise *not
configured*, with a clear user-facing message). `.env` untracked; `test-gemini.js`
deleted; a secret scanner added to CI. A fresh build was grepped and is clean.

> **Action still required by a human:** the key is in git history and was publicly
> served. **Revoke it in Google Cloud Console and issue a new one.** Removing the file
> does not un-leak it.

### 2.2 SSRF via `webhookUrl` — HIGH
`POST /api/ai/compose-letter` accepted any URL and the server fetched it. Validation was
only `z.string().url()`, so `http://169.254.169.254/latest/meta-data/` and
`https://localhost:…` were accepted — turning the server into an open proxy onto cloud
metadata and internal hosts.

**Fixed:** `server/webhook.js` now enforces https-only, blocks loopback/private/
link-local/multicast ranges (IPv4, IPv6, and IPv4-mapped IPv6 in both spellings), blocks
`*.localhost` and embedded credentials. Wired into the Zod schema so it fails at the edge
with `VALIDATION_ERROR`. 12 unit tests + 2 integration tests.

### 2.3 CORS allow-list declared but ignored — HIGH
`server/config.js` defined `cors.origin` as an allow-list; `server/app.js` used
`cors({ origin: true })`, which reflects *any* origin. The config was dead code.

**Fixed:** `app.js` now builds options from `config.cors.origins` (exact match, `CORS_ORIGIN`
env, comma-separated). Verified live: an allowed origin is echoed, an unlisted one gets no
`Access-Control-Allow-Origin` header.

### 2.4 API key sent in the query string — MEDIUM
`geminiService.js` put the key in `?key=…`, which lands in proxy/CDN/access logs.
**Fixed:** now sent as the `x-goog-api-key` header. Tested.

### 2.5 `fetch` timeout was a no-op — MEDIUM
`fetch(url, { timeout: 30000 })` does nothing — `fetch` has no `timeout` option, so Gemini
calls could hang indefinitely. **Fixed:** `AbortSignal.timeout(config.geminiTimeoutMs)`. Tested.

### 2.6 Unbounded in-memory job store — MEDIUM
`server/jobStore.js` grew a `Map` forever: any client submitting `async: true` requests
could exhaust memory. **Fixed:** bounded by `JOB_STORE_MAX_JOBS` (default 500, oldest
evicted) and `JOB_STORE_TTL_MS` (default 1 h). `sweepJobs` is injectable and tested.

### 2.7 Tailwind v4 components in a Tailwind v3 project — HIGH (silent breakage)
The vendored shadcn/ui tree used **44 Tailwind v4-only idioms** (`--spacing(8)`,
`size-(--cell-size)`, `min-w-(--cell-size)`, …) while the project runs Tailwind **3.4.19**.
Those utilities compiled to nothing or to invalid CSS such as `--cell-size: var(--spacing(8))`
(a function call inside `var()` is not valid CSS), so the **Calendar, Sidebar, Chart,
Select, DropdownMenu and ContextMenu components were visually broken and nobody noticed**.

The Vite 8 upgrade is what surfaced it: Vite 5's esbuild minifier tolerated the invalid CSS,
Vite 8's Lightning CSS correctly rejects it and failed the build.

**Fixed:** all 44 rewritten to v3-equivalent arbitrary values
(`--spacing(8)` → `calc(var(--spacing,0.25rem)*8)`, `size-(--x)` → `size-[var(--x)]`).
Verified: 0 residual v4-isms, build green.

### 2.8 Four `@ts-nocheck` files hiding real errors — MEDIUM
Removing the directives surfaced only **5** errors, all now fixed properly:
- `FuzzySearchService.ts` imported **`fuse.js`, which was neither declared nor installed**,
  in a file that nothing imports — dead code with an unsatisfiable import. The dependency
  was added (`^7.5.0`), which resolved all three errors and made the module usable.
- `Print.tsx` cast `getFileFromIDB()`'s `Blob | Uint8Array | string | undefined` return to
  `Uint8Array` — unsound for two of those four. Now handled per-type.
- `ExportService.ts` `Uint8Array<ArrayBufferLike>` → `BlobPart` (TS 5.7+ tightening).

Also removed 9 `@ts-ignore` (typed the dynamic merge maps in `SettingsRemoveDuplicates.tsx`;
widened one style object to `React.CSSProperties`).

### 2.9 Silent failure swallowing — MEDIUM
36 empty `catch {}` blocks, including around `localStorage.setItem`. **Fixed:** write paths
now `console.warn` (data loss becomes visible); read paths carry an explanatory comment.

Two of these hid a latent bug in `src/pages/Budgeting.tsx`: it used CommonJS
`require('../budgeting/budget/storage')` inside `try`/`catch {}` in an ESM/Vite source —
while line 18 **already statically imported the same module**. Replaced with the static import.

### 2.10 Print race condition — MEDIUM
`PrintLayout.tsx` waited a fixed 100 ms then called `window.print()`, freezing the thread
before webfonts/images resolved. **Fixed:** waits on `document.fonts.ready` plus pending
images, with a 3 s ceiling.

### 2.11 Flaky suite under parallel load — LOW
`retiringIncrement.test.ts` timed out at the default 5 s while running as part of the full
suite, yet passes in isolation in 2.27 s with actual test logic at 1% of runtime. The cause
is environment contention: 19 files each build a jsdom instance, ~13 s of a ~25 s run. On a
shared CI runner that alone can push a synchronous test past 5 s. **Fixed:** `testTimeout`
and `hookTimeout` raised to 15 s in `vitest.config.ts`. Verified with two consecutive full
runs, both 19/118 green.

> Vitest also suggests `pool: 'vmThreads'` to build jsdom once per worker instead of 19
> times. That is the real root-cause fix and would cut the run roughly in half, but it
> changes isolation semantics and this suite leans on `vi.stubEnv`/`vi.resetModules` — so it
> was left for a change with its own review.

### 2.12 Secret scanner almost re-leaked the key — caught pre-commit
The first draft of this report quoted the compromised key verbatim. The scanner passed at
the time only because it walks `git ls-files`, and an untracked file is not in the index —
so committing the report would have put the secret straight back into the repository.
**Fixed:** the key is redacted here. Verified with a negative control: re-inserting the
literal value makes `npm run secrets:scan` exit 1 and point at
`docs/PRODUCTION_READINESS.md:32`.

> Follow-up worth doing: have the scanner also walk the working tree, not just tracked
> files, so untracked additions are caught before they are ever staged.

---

## 3. Toolchain and dependency remediation

| Item | Before → After |
|---|---|
| `vite` | 5.4.21 → **8.2.2** (Rolldown; build 17 s → 3.3 s) |
| `vitest` / `@vitest/coverage-v8` | 1.0.4 → **5.0.0** (clears the 2 critical advisories) |
| `@vitejs/plugin-react` | 4.2.1 → 6.1.1 (required by Vite 8) |
| `@tiptap/*` | pinned 3.22.5 → **3.31.3 across all 18 packages** |
| `engines.node` | `>=18` → `>=22.12.0`; CI `20` → `22` |
| Direct dependencies | 92 → 82 (removed unused) + `fuse.js` added |

**Tiptap duplicate-core bug.** `starter-kit@3.22.5` depends on `@tiptap/core: ^3.22.5`, so a
fresh resolve pulled a **nested second core (3.31.3)** alongside the top-level 3.22.5. Four
copies of `@tiptap/core` existed in the tree, which broke type inference (`toggleBold`
"does not exist on type ChainedCommands"). npm `overrides` did **not** reach the
subtree; aligning the whole family to 3.31.3 did — now exactly one v3 core.

**Removed unused direct dependencies** (verified by grep across `src`, `server`, `scripts`,
`index.html` and root configs): `@hookform/resolvers`, `@tanstack/react-query`,
`@tiptap/extension-code-block-lowlight`, `@trpc/client`, `@trpc/react-query`,
`@trpc/server`, `drizzle-orm`, `html2canvas`, `lowlight`, `superjson`,
`vite-plugin-singlefile`, `@tailwindcss/vite`.
`@types/*` were kept where the underlying package is used.

Removing `@hookform/resolvers` also **fixed `npm ci`**: it resolved to 5.9.1, which declares
26 optional peers including `ajv@^8.12.0` that the lockfile never satisfied.

**Phantom dependencies declared:** `eslint.config.js` imported `@eslint/js` and `globals`
that were absent from `package.json` (working only by hoisting accident). Added at the
matching majors (`@eslint/js@^9` — v10 requires ESLint 10).

---

## 4. Remaining, accepted risk

**`xlsx@0.18.5` — 1 high (prototype pollution + ReDoS), no npm fix.**
The npm package is frozen; SheetJS publishes patched builds only from `cdn.sheetjs.com`,
which is **not reachable from this environment** (`SSL_ERROR_SYSCALL`), so it could not be
verified or installed here.

Real exposure is bounded: `XLSX.read` is called in three places (`Budgeting.tsx`,
`SettingsImportExport.tsx`) parsing files **the operator themselves uploads**, in **their own
browser** — no server-side or cross-user blast radius.

It is recorded in `scripts/audit-gate.mjs` with an owner-facing reason and a
`2026-12-31` expiry; the gate fails once that date passes. Remediation:
`npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, then delete the entry.

---

## 5. Structural debt (analysed, not yet refactored)

These are documented because they are the highest-leverage remaining work, not because
they are resolved.

**5.1 A whole duplicated component tree.** `src/components/ui/` and
`src/features/clerk-desk/components/wordpro/components/ui/` each contain 53 files, and
**38 are byte-identical**. Every fix must be made twice — the Tailwind codemod in §2.7 had
to touch both. This is the single largest maintainability liability in the repo.

**5.2 God components.** `Employees.tsx` 2,803 lines, `LetterComposer.tsx` 2,584,
`departmentDetector.ts` 2,210, `CaseDetail.tsx` 2,179, `src/utils.ts` 2,032,
`Budgeting.tsx` 1,908. These concentrate most of the lint backlog and are hard to test.

**5.3 Bundle size.** Three chunks exceed 500 kB: `export-vendor` 931 kB (344 kB gzip),
`index` 540 kB, `CopilotSidebar` 773 kB. `manualChunks` already splits vendors; the next
step is route-level `import()` for the composer and export paths.

**5.4 Test coverage is concentrated.** 118 tests, but `src/pages/**`, `src/forms/**` (81
files, 11 k lines) and most of `src/services/**` are at 0%. The pension/GPF arithmetic in
`src/lib` *is* covered — the highest-value logic is tested; the UI is not.

**5.5 Lint backlog: 760 warnings** across ~180 files —
`no-explicit-any` 395, `no-unused-vars` 294, `react-refresh` 44, `exhaustive-deps` 27.
Every *correctness* rule is at zero. This backlog is now held by a ratchet (§6).

**5.6 Still open from the May audit:** `dangerouslySetInnerHTML` in 4 files
(`PrintLayout.tsx`, `LetterPrint.tsx`, and both `chart.tsx` copies); `EditorContext.tsx`
monolithic provider re-rendering on every keystroke.

---

## 6. The gate, and how to run it

```bash
npm run verify     # secrets → type-check → lint → lint ratchet → tests → build
```

Verified output: secrets ✓, type-check 0 errors, lint 0 errors / 760 warnings,
ratchet ✓, **19 files / 118 tests passed**, build ✓ in 3.33 s.

**The ratchet.** Because 760 findings could not be fixed responsibly in one pass, the four
backlog rules are warnings — but `scripts/lint-baseline.mjs` pins their counts in
`eslint-baseline.json` and **fails CI if any count rises**. It was tested both ways:
lowering the `no-explicit-any` allowance to 390 produced
`390 allowed, 395 found (+5)` and exit 1. Debt can only shrink.

**The audit gate** (`scripts/audit-gate.mjs`) fails on any unaccepted high/critical and on
expired allow-list entries — unlike a bare `npm audit`, which was permanently red and
therefore ignored.

**CI** (`.github/workflows/main.yml`) now: Node 22; `npm ci`; secret scan; type-check;
lint (no longer `continue-on-error`, which is why 800+ findings accumulated); lint ratchet;
coverage tests; build; audit gate. Added `permissions: contents: read`, concurrency
cancellation, and artifact retention.

---

## 7. Deliberately not done

- **Git history was not rewritten.** The leaked key remains in commit `5e1495e`. Purging it
  is destructive to a shared branch and needs an owner's decision — but rotation (§2.1) is
  mandatory regardless.
- **The 760-finding lint backlog** was ratcheted, not fixed. Mechanically deleting 294
  "unused" bindings in a payroll/pension system without understanding each one is how
  regressions get shipped.
- **§5 structural refactors** (component-tree dedup, god components, code-splitting,
  UI test coverage) were analysed and documented, not attempted.
- **`xlsx`** could not be patched here for the network reason in §4.
