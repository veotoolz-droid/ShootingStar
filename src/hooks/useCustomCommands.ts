import { useState, useCallback, useEffect } from 'react';

export interface CustomCommand {
  id: string;
  name: string;
  shortcut: string; // e.g., "/explain"
  prompt: string;
  description?: string;
  icon?: string;
}

const STORAGE_KEY = 'comet-custom-commands';

const DEFAULT_COMMANDS: CustomCommand[] = [
  {
    id: 'explain',
    name: 'Explain Like I\'m 5',
    shortcut: '/explain',
    prompt: 'Explain the following in simple terms that a 5-year-old would understand:',
    description: 'Simplify complex topics',
  },
  {
    id: 'translate',
    name: 'Translate to Chinese',
    shortcut: '/translate',
    prompt: 'Translate the following to Chinese:',
    description: 'Translate text to Chinese',
  },
  {
    id: 'summarize',
    name: 'Summarize',
    shortcut: '/summarize',
    prompt: 'Provide a concise summary of the following:',
    description: 'Get a brief summary',
  },
  {
    id: 'code',
    name: 'Code Review',
    shortcut: '/code',
    prompt: 'Review the following code and provide feedback on best practices, potential bugs, and improvements:',
    description: 'Get code review feedback',
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm Ideas',
    shortcut: '/brainstorm',
    prompt: 'Brainstorm creative ideas and approaches for the following topic:',
    description: 'Generate creative ideas',
  },
];

export function useCustomCommands() {
  const [commands, setCommands] = useState<CustomCommand[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_COMMANDS;
    } catch {
      return DEFAULT_COMMANDS;
    }
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  }, [commands]);

  const addCommand = useCallback((command: Omit<CustomCommand, 'id'>) => {
    const newCommand: CustomCommand = {
      ...command,
      id: `cmd-${Date.now()}`,
    };
    setCommands(prev => [...prev, newCommand]);
    return newCommand;
  }, []);

  const updateCommand = useCallback((id: string, updates: Partial<CustomCommand>) => {
    setCommands(prev =>
      prev.map(cmd => (cmd.id === id ? { ...cmd, ...updates } : cmd))
    );
  }, []);

  const deleteCommand = useCallback((id: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== id));
  }, []);

  const resetToDefaults = useCallback(() => {
    setCommands(DEFAULT_COMMANDS);
  }, []);

  const getCommandByShortcut = useCallback((shortcut: string): CustomCommand | undefined => {
    return commands.find(cmd => cmd.shortcut.toLowerCase() === shortcut.toLowerCase());
  }, [commands]);

  const applyCommand = useCallback((shortcut: string, text: string): string => {
    const command = getCommandByShortcut(shortcut);
    if (!command) return text;
    return `${command.prompt}\n\n${text}`;
  }, [getCommandByShortcut]);

  const parseCommand = useCallback((query: string): { command?: CustomCommand; text: string } => {
    const parts = query.trim().split(/\s+/);
    if (parts.length > 0 && parts[0].startsWith('/')) {
      const shortcut = parts[0].toLowerCase();
      const command = getCommandByShortcut(shortcut);
      if (command) {
        return {
          command,
          text: parts.slice(1).join(' '),
        };
      }
    }
    return { text: query };
  }, [getCommandByShortcut]);

  return {
    commands,
    addCommand,
    updateCommand,
    deleteCommand,
    resetToDefaults,
    getCommandByShortcut,
    applyCommand,
    parseCommand,
  };
}

export default useCustomCommands;
