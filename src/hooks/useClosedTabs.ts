import { useState, useCallback, useEffect } from 'react';
import { Tab } from '../components/TabManager';

const MAX_CLOSED_TABS = 10;
const STORAGE_KEY = 'comet-closed-tabs';

export function useClosedTabs() {
  const [closedTabs, setClosedTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(closedTabs));
  }, [closedTabs]);

  const addClosedTab = useCallback((tab: Tab) => {
    setClosedTabs(prev => {
      const newTabs = [tab, ...prev].slice(0, MAX_CLOSED_TABS);
      return newTabs;
    });
  }, []);

  const removeClosedTab = useCallback((tabId: string) => {
    setClosedTabs(prev => prev.filter(t => t.id !== tabId));
  }, []);

  const getLastClosedTab = useCallback((): Tab | undefined => {
    return closedTabs[0];
  }, [closedTabs]);

  const canRestore = closedTabs.length > 0;

  const clearClosedTabs = useCallback(() => {
    setClosedTabs([]);
  }, []);

  return {
    closedTabs,
    addClosedTab,
    removeClosedTab,
    getLastClosedTab,
    canRestore,
    clearClosedTabs,
  };
}

export default useClosedTabs;
