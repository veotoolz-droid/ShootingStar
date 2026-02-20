import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
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
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-violet-500" />
            Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {shortcuts.map(({ key, description }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">{description}</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">{key}</kbd>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Vim-style navigation is available when not focused in an input field.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsHelp;
