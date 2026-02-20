import { useState, useCallback } from 'react';

export interface CustomCommand {
  id: string;
  name: string;
  shortcut: string;
  prompt: string;
  description: string;
}

const DEFAULT_COMMANDS: CustomCommand[] = [
  {
    id: 'explain',
    name: 'Explain Like I\'m 5',
    shortcut: '/explain',
    prompt: 'Explain this in simple terms that a 5-year-old would understand:',
    description: 'Simplify complex topics',
  },
  {
    id: 'translate',
    name: 'Translate to Chinese',
    shortcut: '/translate',
    prompt: 'Translate the following to Chinese:',
    description: 'Translate content to Chinese',
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
    name: 'Code Explanation',
    shortcut: '/code',
    prompt: 'Explain this code in detail, including what each part does:',
    description: 'Explain code snippets',
  },
  {
    id: 'proscons',
    name: 'Pros & Cons',
    shortcut: '/proscons',
    prompt: 'Analyze the pros and cons of the following:',
    description: 'Get balanced analysis',
  },
  {
    id: 'steps',
    name: 'Step by Step',
    shortcut: '/steps',
    prompt: 'Break this down into clear step-by-step instructions:',
    description: 'Get step-by-step guide',
  },
];

export function useCustomCommands() {
  const [commands, setCommands] = useState<CustomCommand[]>(() => {
    const saved = localStorage.getItem('comet-custom-commands');
    return saved ? JSON.parse(saved) : DEFAULT_COMMANDS;
  });

  const saveCommands = useCallback((newCommands: CustomCommand[]) => {
    setCommands(newCommands);
    localStorage.setItem('comet-custom-commands', JSON.stringify(newCommands));
  }, []);

  const addCommand = useCallback((command: Omit<CustomCommand, 'id'>) => {
    const newCommand: CustomCommand = {
      ...command,
      id: Math.random().toString(36).substring(2, 9),
    };
    saveCommands([...commands, newCommand]);
  }, [commands, saveCommands]);

  const updateCommand = useCallback((id: string, updates: Partial<CustomCommand>) => {
    saveCommands(commands.map(cmd => 
      cmd.id === id ? { ...cmd, ...updates } : cmd
    ));
  }, [commands, saveCommands]);

  const deleteCommand = useCallback((id: string) => {
    saveCommands(commands.filter(cmd => cmd.id !== id));
  }, [commands, saveCommands]);

  const getCommandByShortcut = useCallback((shortcut: string): CustomCommand | undefined => {
    return commands.find(cmd => cmd.shortcut === shortcut);
  }, [commands]);

  const applyCommand = useCallback((shortcut: string, content: string): string => {
    const command = getCommandByShortcut(shortcut);
    if (!command) return content;
    return `${command.prompt}\n\n${content}`;
  }, [getCommandByShortcut]);

  const resetToDefaults = useCallback(() => {
    saveCommands(DEFAULT_COMMANDS);
  }, [saveCommands]);

  return {
    commands,
    addCommand,
    updateCommand,
    deleteCommand,
    getCommandByShortcut,
    applyCommand,
    resetToDefaults,
  };
}

export default useCustomCommands;
