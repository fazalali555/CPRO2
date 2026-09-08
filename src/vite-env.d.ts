/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_BASE_URL?: string;
  readonly VITE_PORT?: string;
  readonly VITE_FRONTEND_FORGE_API_KEY?: string;
  readonly VITE_FRONTEND_FORGE_API_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  /**
   * Optional build-time Gemini key. Prefer having operators enter their own key
   * in Settings; baking one into a public bundle exposes it.
   */
  readonly VITE_GEMINI_API_KEY?: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'tiptap-extension-font-size' {
  import { Extension } from '@tiptap/core';
  export const FontSize: Extension;
  export default FontSize;
}

declare module 'tiptap-extension-line-height' {
  import { Extension } from '@tiptap/core';
  export const LineHeight: Extension;
  export default LineHeight;
}

declare module 'react-dom/client' {
  import { ReactNode } from 'react';
  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }
  export function createRoot(
    container: Element | DocumentFragment,
    options?: { identifierPrefix?: string; onUncaughtError?: unknown; onCaughtError?: unknown }
  ): Root;
}
