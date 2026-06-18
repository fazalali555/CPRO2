# WordPro Integration & Performance Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully integrate the Tiptap-based `wordpro` module, replacing legacy block-based editor hooks and optimizing for high-performance mobile and desktop usage.

**Architecture:** Unified Context pattern with State/Actions splitting to minimize re-renders. Strict TypeScript interfaces for physical layout mapping (A4/Legal).

**Tech Stack:** React (TypeScript), Tiptap, Tailwind CSS, Lucide Icons.

---

### Task 1: Core Type & Context Consolidation

**Files:**
- Create: `src/types/editor.ts` (Merged from `src/features/clerk-desk/components/wordpro/lib/editor-types.ts`)
- Modify: `src/contexts/EditorContext.tsx` (Complete rewrite for Tiptap + Optimization)

- [ ] **Step 1: Centralize Editor Types**
Move all editor-related interfaces to a single shared location.

- [ ] **Step 2: Implement High-Performance EditorProvider**
Rewrite `src/contexts/EditorContext.tsx` using the optimized implementation provided in the audit report. Ensure `useMemo` is used correctly to split stable actions from volatile state.

### Task 2: Component Wiring & Legacy Cleanup

**Files:**
- Modify: `src/features/clerk-desk/components/wordpro/components/StatusBar.tsx`
- Modify: `src/features/clerk-desk/components/wordpro/components/ribbon-tabs/ViewTab.tsx`
- Delete: `src/features/clerk-desk/components/wordpro/hooks/useEditorV2.ts`
- Delete: `src/features/clerk-desk/components/wordpro/components/DocumentEditorV2.tsx`

- [ ] **Step 1: Update StatusBar to use optimized selectors**
Ensure `StatusBar` only re-renders when word count or zoom actually changes.

- [ ] **Step 2: Update ViewTab for unified state**
Align zoom and orientation controls with the new context.

- [ ] **Step 3: Remove legacy code**
Safely delete the old `useEditorV2` hook and its associated components.

### Task 3: Print Layout Alignment

**Files:**
- Modify: `src/components/PrintLayout.tsx`
- Modify: `src/components/PrintWrappers.tsx`

- [ ] **Step 1: Connect PrintLayout to EditorContext**
Inject editor margins and orientation into the print CSS dynamically.

- [ ] **Step 2: Verify WYSIWYG Parity**
Run a test to ensure the editor's visual page matches the PDF export and browser print dialog.
