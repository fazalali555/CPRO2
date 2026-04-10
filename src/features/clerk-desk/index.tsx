// index.tsx - Module exports

export { ClerkDesk } from './ClerkDesk';
export { default } from './ClerkDesk';

// Re-export types
export * from './types';

// Re-export hooks for external use
export { useLetterComposer } from './hooks/useLetterComposer';
export { useLocalStorage, useLocalStorageCollection } from './hooks/useLocalStorage';
export { useKeyboardShortcuts, useClerkDeskShortcuts } from './hooks/useKeyboardShortcuts';
export { useOnlineStatus } from './hooks/useOnlineStatus';
export { useUndoRedo } from './hooks/useUndoRedo';

// Re-export services
export { StorageService } from './services/StorageService';
export { ExportService } from './services/ExportService';
export { AIService } from './services/AIService';

// Re-export constants
export * from './constants';