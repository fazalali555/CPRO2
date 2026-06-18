# Mobile Fullscreen Optimization for Letter Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the letter header form and surrounding workspace elements when mobile fullscreen is active to maximize editor space.

**Architecture:** Conditional rendering in `LetterComposer.tsx` for the `MetadataHeader` and a CSS injection strategy to hide parent workspace elements (PageHeader, Tabs, Online Badge) without modifying the parent component. Recalculate canvas height using existing `viewportHeight`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React.

---

### Task 1: Hide MetadataHeader and Workspace Elements in Mobile Fullscreen

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Locate the root div and add conditional CSS for workspace elements**

In `LetterComposer.tsx`, add a dynamic `<style>` tag within the component's return to hide parent elements in `ClerkDesk.tsx` when fullscreen is active on mobile.

```tsx
{/* LetterComposer.tsx */}
{isFullscreen && isMobile && (
  <style>{`
    /* Hide parent ClerkDesk elements */
    .max-w-7xl > .flex.items-center.justify-between, 
    .max-w-7xl > .flex.flex-wrap.gap-2 {
      display: none !important;
    }
    /* Ensure container takes full width/height */
    .max-w-7xl {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `}</style>
)}
```

- [ ] **Step 2: Add conditional rendering for MetadataHeader**

Wrap the `<MetadataHeader />` call with the condition `!(isFullscreen && isMobile)`.

```tsx
{/* LetterComposer.tsx approx line 1190 */}
{!(isFullscreen && isMobile) && (
  <MetadataHeader
    formState={formState}
    setField={setField}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    selectEmployee={selectEmployee}
    searchResults={searchResults}
    showResults={showResults}
    setShowResults={setShowResults}
  />
)}
```

- [ ] **Step 3: Hide local title/subtitle in toolbar**

Update the toolbar's title section to also respect the fullscreen mobile condition.

```tsx
{/* LetterComposer.tsx approx line 996 */}
{!isMobile && (
  <div>
    <h1 className="text-sm font-black uppercase tracking-tight">Letter Composer Pro</h1>
    <p className="text-[10px] text-blue-100/70 font-bold uppercase tracking-wider">
      {formState.editingId ? 'Editing Letter' : 'New Official Letter'}
    </p>
  </div>
)}
{/* Change to: */}
{(!isMobile || !isFullscreen) && (
  <div>
     {/* ... existing content ... */}
  </div>
)}
```

---

### Task 2: Recalculate Canvas Height

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Apply dynamic height to the main content container**

Find the `div` with `className="flex-1 flex overflow-hidden relative"` (approx line 1202). Add the dynamic height style.

```tsx
<div 
  className="flex-1 flex overflow-hidden relative"
  style={{
    height: (isFullscreen && isMobile) ? `${viewportHeight}px` : undefined,
    transition: 'height 0.2s ease'
  }}
>
```

---

### Task 3: Add Fixed Exit Fullscreen Button

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Ensure Minimize2 is imported**

Check `lucide-react` imports.

```tsx
import { Maximize, Minimize, MoreHorizontal, X, ChevronRight, ChevronLeft, Layout as LayoutIcon, History, FileText, Settings, Minimize2 } from 'lucide-react';
```

- [ ] **Step 2: Add the Exit Button at the bottom of JSX**

```tsx
{/* LetterComposer.tsx before closing </EditorProvider> */}
{isFullscreen && (
  <button
    onClick={toggleFullscreen}
    className="fixed top-3 right-3 z-[9999] 
               rounded-full bg-white shadow-lg 
               border border-gray-200 p-2.5
               flex items-center justify-center
               min-w-[44px] min-h-[44px]"
    title="Exit Fullscreen"
    aria-label="Exit Fullscreen"
  >
    <Minimize2 className="h-5 w-5 text-gray-600" />
  </button>
)}
```

---

### Task 4: Add Smooth Transition to MetadataHeader

**Files:**
- Modify: `src/features/clerk-desk/components/letters/MetadataHeader.tsx`

- [ ] **Step 1: Add transition classes to root div**

```tsx
<div className="bg-white border-b px-4 py-4 space-y-4 shadow-sm z-10 relative transition-all duration-200 ease-in-out">
```

---

### Task 5: Verification

- [ ] **Step 1: Run Type Check**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Manual Check (Mental/Simulation)**
- Verify `MetadataHeader` is hidden only on mobile AND fullscreen.
- Verify the exit button appears in all fullscreen modes (desktop and mobile).
- Verify the injected CSS targets the correct elements in `ClerkDesk.tsx`.
