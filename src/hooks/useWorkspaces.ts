import { useState, useCallback, useEffect } from 'react';
import { Tab } from '../components/TabManager';

export interface Workspace {
  id: string;
  name: string;
  tabs: Tab[];
  activeTabId: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'comet-workspaces';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }, [workspaces]);

  const createWorkspace = useCallback((name: string, tabs: Tab[], activeTabId: string) => {
    const workspace: Workspace = {
      id: `workspace-${Date.now()}`,
      name,
      tabs: tabs.map(t => ({ ...t, isActive: t.id === activeTabId })),
      activeTabId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setWorkspaces(prev => [workspace, ...prev]);
    return workspace;
  }, []);

  const updateWorkspace = useCallback((id: string, updates: Partial<Workspace>) => {
    setWorkspaces(prev =>
      prev.map(w =>
        w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
      )
    );
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspace(null);
    }
  }, [currentWorkspace]);

  const loadWorkspace = useCallback((id: string): Workspace | null => {
    const workspace = workspaces.find(w => w.id === id);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
    return workspace || null;
  }, [workspaces]);

  const saveCurrentWorkspace = useCallback((tabs: Tab[], activeTabId: string) => {
    if (currentWorkspace) {
      updateWorkspace(currentWorkspace.id, { tabs, activeTabId });
    }
  }, [currentWorkspace, updateWorkspace]);

  const renameWorkspace = useCallback((id: string, name: string) => {
    updateWorkspace(id, { name });
  }, [updateWorkspace]);

  return {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    loadWorkspace,
    saveCurrentWorkspace,
    renameWorkspace,
  };
}

export default useWorkspaces;
