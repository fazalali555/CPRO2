# CPRO2 Termux Workspace Rules
## Core Context
- Stack: React 19 / TypeScript / Vite
- Workspace Target: High-Performance Standalone Word Clone
## AI Performance Boundaries
1. No 'any' values. Explicit typing required.
2. Isolate high-frequency metrics in EditorContext to protect Termux memory ceilings.
3. Ignore heavy directories: node_modules/, .vite/, dist/
