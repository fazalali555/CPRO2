// hooks/useKeyboardShortcuts.ts - Keyboard Shortcuts Hook

import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
  scope?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  scope?: string;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, scope = 'global' } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      // Check scope
      if (shortcut.scope && shortcut.scope !== scope && shortcut.scope !== 'global') {
        continue;
      }

      // Check modifiers
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        // Allow shortcuts in inputs only if they have ctrl/cmd
        if (isInputField && !shortcut.ctrl) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        shortcut.action();
        return;
      }
    }
  }, [enabled, scope]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    // Helper to format shortcut display
    formatShortcut: (config: ShortcutConfig) => {
      const parts: string[] = [];
      if (config.ctrl) parts.push('Ctrl');
      if (config.shift) parts.push('Shift');
      if (config.alt) parts.push('Alt');
      parts.push(config.key.toUpperCase());
      return parts.join(' + ');
    },
  };
}

// Pre-defined shortcuts for Clerk Desk
export function useClerkDeskShortcuts(handlers: {
  onSaveDraft?: () => void;
  onFinalize?: () => void;
  onNewLetter?: () => void;
  onPrint?: () => void;
  onSearch?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSwitchTab?: (index: number) => void;
  onEscape?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [
    // Letter shortcuts
    {
      key: 's',
      ctrl: true,
      action: () => handlers.onSaveDraft?.(),
      description: 'Save Draft',
      scope: 'letters',
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      action: () => handlers.onFinalize?.(),
      description: 'Finalize Letter',
      scope: 'letters',
    },
    {
      key: 'n',
      ctrl: true,
      action: () => handlers.onNewLetter?.(),
      description: 'New Letter',
      scope: 'letters',
    },
    {
      key: 'p',
      ctrl: true,
      action: () => handlers.onPrint?.(),
      description: 'Print/Export',
      scope: 'letters',
    },
    
    // Global shortcuts
    {
      key: 'f',
      ctrl: true,
      action: () => handlers.onSearch?.(),
      description: 'Search',
      scope: 'global',
    },
    {
      key: 'z',
      ctrl: true,
      action: () => handlers.onUndo?.(),
      description: 'Undo',
      scope: 'global',
    },
    {
      key: 'y',
      ctrl: true,
      action: () => handlers.onRedo?.(),
      description: 'Redo',
      scope: 'global',
    },
    {
      key: 'Escape',
      action: () => handlers.onEscape?.(),
      description: 'Cancel/Close',
      scope: 'global',
      preventDefault: false,
    },
    
    // Tab switching (1-8)
    ...Array.from({ length: 8 }, (_, i) => ({
      key: String(i + 1),
      ctrl: true,
      action: () => handlers.onSwitchTab?.(i),
      description: `Switch to Tab ${i + 1}`,
      scope: 'global',
    })),
  ];

  return useKeyboardShortcuts(shortcuts);
}