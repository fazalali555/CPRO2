# Smart Letter Parser and AI Paste Cleaner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, intelligent letter parser for Clerk Pro that automatically extracts official fields from pasted text (KPK department style), cleans AI artifacts, and auto-fills the composer UI.

**Architecture:** 
1. **Parser Utility:** A standalone regex-heavy utility to decompose pasted text into a `ParsedLetter` structure.
2. **TipTap Integration:** A custom paste handler in the editor to intercept raw text, run the parser, and insert structured nodes.
3. **UI Feedback:** A reactive banner and toast system in `LetterComposer` to inform the user of auto-filled fields and confidence levels.

**Tech Stack:** TypeScript, React, TipTap, Regex, Tailwind CSS.

---

### Task 1: Define Types and Interface

**Files:**
- Modify: `src/features/clerk-desk/utils/smartLetterParser.ts`

- [ ] **Step 1: Replace existing interface with the new `ParsedLetter` spec.**

```typescript
export interface ParsedLetter {
  confidence: number;          // 0-100
  letterType: string;
  officeName: string | null;
  officeType: "DEO" | "SDEO" | "School" | "Other" | null;
  gender: "Male" | "Female" | null;
  district: string | null;
  area: string | null;
  refNo: string;
  refNoSuffix: string | null;
  date: string;
  dateRaw: string;
  recipient: string | null;
  recipients: string[];
  subjectPerson: {
    name: string;
    designation: string;
    school: string;
  } | null;
  signatoryTitle: string | null;
  signatoryArea: string | null;
  subject: string;
  bodyHtml: string;           // cleaned, markdown-converted body
  copyTo: string[];
  enclosures: string[];
  hasForwarding: boolean;
  hasEnclosures: boolean;
  hasTable: boolean;
  detectedFields: {
    field: string;
    value: string;
    confidence: "high" | "medium" | "low";
  }[];
}
```

- [ ] **Step 2: Commit.**

```bash
git add src/features/clerk-desk/utils/smartLetterParser.ts
git commit -m "chore: define ParsedLetter interface"
```

---

### Task 2: Core Parser Implementation - Header & Metadata

**Files:**
- Modify: `src/features/clerk-desk/utils/smartLetterParser.ts`

- [ ] **Step 1: Implement Office Header, Ref No, and Date detection.**

```typescript
// Add regex patterns for DEO/SDEO/School headers
// Extract officeName, officeType, gender, district, area
// Extract refNo (including blanks) and parse date
```

- [ ] **Step 2: Implement Letter Type detection.**

```typescript
// Keywords: ORDER, SHOW CAUSE, TRANSFER, RELIEVING, etc.
```

- [ ] **Step 3: Commit.**

```bash
git add src/features/clerk-desk/utils/smartLetterParser.ts
git commit -m "feat: implement header and metadata parsing"
```

---

### Task 3: Recipient & Signatory Detection

**Files:**
- Modify: `src/features/clerk-desk/utils/smartLetterParser.ts`

- [ ] **Step 1: Implement Recipient (To:) detection for single and multiple items.**

```typescript
// Handle "To", "To:", numbered lists, and subject persons inside body
```

- [ ] **Step 2: Implement Signatory (From:) detection from signature block.**

```typescript
// Detect signatoryTitle, signatoryArea, signatoryGender
```

- [ ] **Step 3: Commit.**

```bash
git add src/features/clerk-desk/utils/smartLetterParser.ts
git commit -m "feat: implement recipient and signatory parsing"
```

---

### Task 4: Content Cleaning & Markdown Conversion

**Files:**
- Modify: `src/features/clerk-desk/utils/smartLetterParser.ts`

- [ ] **Step 1: Implement AI preamble/postamble removal.**

```typescript
// Remove "Here is a clean rewrite...", "I hope this helps...", etc.
```

- [ ] **Step 2: Implement Markdown to HTML/TipTap node conversion.**

```typescript
// Convert **, *, __, #, ---, Lists, and Links
// Special handling for KPK blanks "___" and "(M)/(F)"
```

- [ ] **Step 3: Implement Table detection and conversion.**

```typescript
// Detect Tab-separated, Pipe-separated, and space-aligned tables
// Convert to TipTap table format
```

- [ ] **Step 4: Commit.**

```bash
git add src/features/clerk-desk/utils/smartLetterParser.ts
git commit -m "feat: implement content cleaning and markdown conversion"
```

---

### Task 5: UI Integration - Paste Handler & Auto-Fill

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Add a `ParsedSummaryBanner` component to show parse results.**

- [ ] **Step 2: Implement `handlePaste` interceptor.**

```typescript
// 1. Intercept paste
// 2. Run parseOfficialLetter
// 3. showToast with Undo action
// 4. Update formState with multiple fields
// 5. Insert cleaned bodyHtml into editor
```

- [ ] **Step 3: Commit.**

```bash
git add src/features/clerk-desk/components/letters/LetterComposer.tsx
git commit -m "feat: integrate smart parser with LetterComposer UI"
```

---

### Task 6: Verification & Testing

- [ ] **Step 1: Run Typecheck.**

Run: `npm run typecheck`

- [ ] **Step 2: Verify with Test Letters.**

// Paste the 3 example letters and verify fields + body formatting.

- [ ] **Step 3: Final Commit.**

```bash
git commit -m "test: verify smart letter parser functionality"
```
