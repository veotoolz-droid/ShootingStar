import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        
        const modifiersMatch = (shortcut.modifiers || []).every(mod => {
          switch (mod) {
            case 'ctrl': return e.ctrlKey;
            case 'alt': return e.altKey;
            case 'shift': return e.shiftKey;
            case 'meta': return e.metaKey;
            default: return false;
          }
        });

        if (keyMatch && modifiersMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

// Vim-style navigation hook
export function useVimNavigation({
  onNext,
  onPrevious,
  onClose,
  onNew,
  onFocusSearch,
}: {
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onNew: () => void;
  onFocusSearch: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Cmd/Ctrl + K in input fields
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          onFocusSearch();
        }
        return;
      }

      switch (e.key) {
        case 'j':
          e.preventDefault();
          onNext();
          break;
        case 'k':
          e.preventDefault();
          onPrevious();
          break;
        case 'x':
          e.preventDefault();
          onClose();
          break;
        case 't':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onNew();
          }
          break;
        case 'w':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onClose, onNew, onFocusSearch]);
}

// Hook for keyboard shortcut help
export function useKeyboardHelp() {
  const getShortcuts = useCallback(() => [
    { key: 'Cmd/Ctrl + T', description: 'New tab' },
    { key: 'Cmd/Ctrl + W', description: 'Close tab' },
    { key: 'Cmd/Ctrl + Shift + T', description: 'Reopen closed tab' },
    { key: 'Cmd/Ctrl + K', description: 'Focus search' },
    { key: 'Cmd/Ctrl + Shift + P', description: 'Command palette' },
    { key: 'j', description: 'Next tab' },
    { key: 'k', description: 'Previous tab' },
    { key: 'x', description: 'Close current tab' },
    { key: 'Esc', description: 'Close modal/panel' },
    { key: '?', description: 'Show keyboard shortcuts' },
  ], []);

  return { shortcuts: getShortcuts() };
}

export default useKeyboardShortcuts;
