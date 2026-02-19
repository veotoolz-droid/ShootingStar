import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Command, X } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  placeholder?: string;
}

export function CommandPalette({ isOpen, onClose, commands, placeholder = "Type a command or search..." }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(q))
    );
  });

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Flatten for keyboard navigation
  const flatCommands = Object.values(groupedCommands).flat();

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % flatCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + flatCommands.length) % flatCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Commands list */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {flatCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Command className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category}
                </div>
                {items.map((cmd) => {
                  const globalIdx = flatCommands.findIndex(c => c.id === cmd.id);
                  const isSelected = globalIdx === selectedIndex;
                  
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-violet-500 text-white' : 'hover:bg-secondary'
                      }`}
                    >
                      <span className={isSelected ? 'text-white' : 'text-muted-foreground'}>
                        {cmd.icon || <Command className="w-5 h-5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{cmd.title}</p>
                        {cmd.description && (
                          <p className={`text-sm truncate ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {cmd.description}
                          </p>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className={`px-2 py-0.5 text-xs rounded ${
                          isSelected ? 'bg-white/20' : 'bg-secondary'
                        }`}>
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-secondary rounded">↵</kbd> to select
            </span>
          </div>
          <span>{flatCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}

// Hook for using command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}

export default CommandPalette;
