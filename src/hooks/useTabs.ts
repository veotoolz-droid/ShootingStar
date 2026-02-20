import { useState, useEffect, useCallback } from 'react';
import { getTabManager, Tab } from '../services/tabManager';

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const tabManager = getTabManager();

  // Sync with tab manager
  useEffect(() => {
    const updateTabs = () => {
      setTabs(tabManager.getAllTabs());
      setActiveTab(tabManager.getActiveTab());
    };

    updateTabs();
    const unsubscribe = tabManager.onChange(updateTabs);
    
    return unsubscribe;
  }, [tabManager]);

  const createSearchTab = useCallback((query: string, mode: string = 'standard') => {
    return tabManager.createSearchTab(query, mode);
  }, [tabManager]);

  const createBrowserTab = useCallback((url: string, title?: string) => {
    return tabManager.createBrowserTab(url, title);
  }, [tabManager]);

  const createCouncilTab = useCallback((query: string) => {
    return tabManager.createCouncilTab(query);
  }, [tabManager]);

  const closeTab = useCallback((id: string) => {
    return tabManager.closeTab(id);
  }, [tabManager]);

  const activateTab = useCallback((id: string) => {
    return tabManager.activateTab(id);
  }, [tabManager]);

  const updateTabData = useCallback((id: string, data: any) => {
    return tabManager.updateTabData(id, data);
  }, [tabManager]);

  const closeAllTabs = useCallback(() => {
    tabManager.closeAllTabs();
  }, [tabManager]);

  const closeOtherTabs = useCallback((keepId: string) => {
    tabManager.closeOtherTabs(keepId);
  }, [tabManager]);

  return {
    tabs,
    activeTab,
    createSearchTab,
    createBrowserTab,
    createCouncilTab,
    closeTab,
    activateTab,
    updateTabData,
    closeAllTabs,
    closeOtherTabs,
  };
}

export default useTabs;
