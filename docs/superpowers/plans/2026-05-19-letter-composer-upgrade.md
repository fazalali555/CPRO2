# LetterComposer Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the import error by properly initializing the TipTap 3 editor instance and upgrade the component to a premium MS Word-grade letter composer.

**Architecture:** We will replace the missing `editor` variable with a full `useEditor` setup directly in `LetterComposer.tsx`. We will implement a custom `Ribbon` toolbar, an A4 page simulation, a status bar, print/PDF/DOCX export, and keyboard shortcuts. The component will manage its own TipTap state and synchronize it with the form data.

**Tech Stack:** React, TipTap 3, Tailwind CSS, pdf-lib, docx.

---

### Task 1: Fix dynamic import error and initialize TipTap Editor

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Add TipTap imports and fix the `editor` reference error**
  We will add `@tiptap/react`, `@tiptap/starter-kit`, and formatting extensions. We will declare `const editor = useEditor({ ... })` inside the component so that line 622 no longer references an undefined variable.

- [ ] **Step 2: Remove broken or unused references**
  Clean up unused variables and ensure `useEditorInstance` is only used where appropriate.

### Task 2: Implement MS Word-Grade UI (Ribbon, Toolbar, A4 Layout)

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Create a unified Ribbon toolbar**
  Add buttons for Bold, Italic, Underline, Strikethrough, alignment, and lists. Connect these directly to the `editor.chain().focus()` methods.

- [ ] **Step 2: Implement A4 Page Simulation**
  Style the editor container to look like a white A4 page on a grey canvas, with exact 1-inch top/bottom and 1.25-inch left/right margins. Add print media queries (`@media print`) to hide toolbars during `window.print()`.

### Task 3: Implement Letter Templates & KPK Bilingual Headers

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Pre-fill templates**
  Create a template dropdown or buttons for Relieving Order, Charge Handover, etc., prepopulating the editor with the KPK E&SE department header.

- [ ] **Step 2: Add Urdu header support**
  Implement a bilingual header (Urdu right-to-left + English) within the HTML template.

### Task 4: Implement Export (PDF/DOCX) and Smart Features

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Connect PDF & DOCX Export**
  Use existing `pdf-lib` and `docx` skills/libraries to export the letter content.

- [ ] **Step 2: Smart features**
  Ensure the existing `smartLetterParser.ts` is connected. Implement the Status bar with live word and character counts. Connect the keyboard shortcuts (Ctrl+B, Ctrl+S, etc.).
