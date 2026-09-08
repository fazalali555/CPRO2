/**
 * Single source of truth for the Gemini API key on the client.
 *
 * Resolution order:
 *   1. a key the operator saved in Settings (localStorage), then
 *   2. `VITE_GEMINI_API_KEY` baked in at build time.
 *
 * There is deliberately **no** hardcoded fallback. An earlier revision of this
 * codebase shipped a literal API key as the default, which meant the key was
 * present in the production JavaScript bundle and trivially extractable by
 * anyone who loaded the app. Callers must handle the "not configured" case via
 * `isGeminiConfigured()` and surface a clear message instead of silently making
 * an unauthenticated request.
 */

const STORAGE_KEY = 'clerk_pro_gemini_api_key';

const readStoredKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
  } catch {
    // localStorage throws in private-mode/SSR-ish contexts; treat as "no key".
    return '';
  }
};

/** @returns the configured key, or `null` when none is available. */
export const getGeminiApiKey = (): string | null => {
  const stored = readStoredKey();
  if (stored) return stored;
  const fromEnv = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  return fromEnv ? fromEnv : null;
};

/** @returns true when a usable key is configured. */
export const isGeminiConfigured = (): boolean => getGeminiApiKey() !== null;

/** Persist the operator's key from Settings. An empty value clears it. */
export const setGeminiApiKey = (key: string): void => {
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
};

/** Remove any stored key. */
export const clearGeminiApiKey = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
};

/** Message shown when AI features are invoked without a key. */
export const GEMINI_NOT_CONFIGURED_MESSAGE =
  'AI features are not configured. Add your Gemini API key in Settings → AI Integration.';
