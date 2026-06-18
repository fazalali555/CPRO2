# Letter Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully functional Letter Composer ribbon and metadata header.

**Architecture:**
1.  **Metadata Header**: A clean, responsive header block above the editor container (above the A4 canvas).
2.  **Ribbon**: Functional tabbed interface in `LetterComposer.tsx` for clipboard, font, paragraph, and layout tools, wired to TipTap extensions.
3.  **State Management**: Use `formState` for all metadata and `editorInstance` for formatting.

**Tech Stack:** React, TipTap, Tailwind CSS, Radix UI.

---

### Task 1: Create Metadata Header Component

**Files:**
- Create: `src/features/clerk-desk/components/letters/MetadataHeader.tsx`
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Implement `MetadataHeader.tsx`**

```tsx
import React from 'react';
import { TextField, TextArea } from '@/components/M3';

interface Props {
  formState: any;
  setField: (field: string, value: any) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectEmployee: (e: any) => void;
  searchResults: any[];
}

export const MetadataHeader: React.FC<Props> = ({ formState, setField, searchTerm, setSearchTerm, selectEmployee, searchResults }) => {
  return (
    <div className="bg-white border-b px-8 py-6 space-y-4 shadow-sm z-10 relative">
       {/* Implementation matching the requested design */}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

---

### Task 2: Implement Ribbon Logic

**Files:**
- Modify: `src/features/clerk-desk/components/letters/LetterComposer.tsx`

- [ ] **Step 1: Wire Ribbon buttons to TipTap commands**

Map every button in Home, Insert, Layout tabs to TipTap `editor` commands.

- [ ] **Step 2: Implement Find/Replace Dialog**

- [ ] **Step 3: Commit**

---

### Task 3: Final Verification

- [ ] **Step 1: TypeScript check**
Run: `npx tsc --noEmit`
Expected: Zero type errors related to new ribbon code.

- [ ] **Step 2: Functional verification**
Confirm ribbon actions work (bold, italic, lists).
Confirm mobile layout (375px) has no horizontal scroll.
Confirm header persists data.

---
