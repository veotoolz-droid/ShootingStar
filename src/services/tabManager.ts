/**
 * Tab Management System
 * Manages multiple tabs for search and browsing
 */

export type TabType = 'search' | 'browser' | 'council';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  url?: string;
  query?: string;
  isActive: boolean;
  isLoading?: boolean;
  favicon?: string;
  data?: any; // Tab-specific data
}

export interface SearchTabData {
  query: string;
  response: string;
  sources: Array<{
    title: string;
    url: string;
    domain: string;
    snippet?: string;
  }>;
  mode: string;
  provider: string;
  isComplete: boolean;
}

export interface BrowserTabData {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export interface CouncilTabData {
  query: string;
  models: Array<{
    id: string;
    name: string;
    response: string;
    isLoading: boolean;
    error?: string;
  }>;
  consensus?: string;
  isComplete: boolean;
}

class TabManager {
  private tabs: Map<string, Tab> = new Map();
  private activeTabId: string | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('comet-tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.tabs = new Map(Object.entries(parsed.tabs || {}));
        this.activeTabId = parsed.activeTabId;
      }
    } catch (error) {
      console.error('Failed to load tabs:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const obj = {
        tabs: Object.fromEntries(this.tabs),
        activeTabId: this.activeTabId,
      };
      localStorage.setItem('comet-tabs', JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save tabs:', error);
    }
  }

  createTab(type: TabType, title: string, data?: any): Tab {
    const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Deactivate current active tab
    if (this.activeTabId) {
      const current = this.tabs.get(this.activeTabId);
      if (current) {
        current.isActive = false;
        this.tabs.set(this.activeTabId, current);
      }
    }

    const tab: Tab = {
      id,
      type,
      title,
      isActive: true,
      data,
    };

    this.tabs.set(id, tab);
    this.activeTabId = id;
    this.saveToStorage();
    this.notifyListeners();

    return tab;
  }

  createSearchTab(query: string, mode: string = 'standard'): Tab {
    return this.createTab('search', query || 'New Search', {
      query,
      response: '',
      sources: [],
      mode,
      provider: '',
      isComplete: false,
    } as SearchTabData);
  }

  createBrowserTab(url: string, title: string = 'New Tab'): Tab {
    return this.createTab('browser', title, {
      url,
      title,
      canGoBack: false,
      canGoForward: false,
      isLoading: true,
    } as BrowserTabData);
  }

  createCouncilTab(query: string): Tab {
    return this.createTab('council', `Council: ${query.slice(0, 30)}...`, {
      query,
      models: [],
      isComplete: false,
    } as CouncilTabData);
  }

  closeTab(id: string): boolean {
    const deleted = this.tabs.delete(id);
    
    if (deleted && this.activeTabId === id) {
      // Activate another tab
      const remaining = Array.from(this.tabs.values());
      if (remaining.length > 0) {
        this.activateTab(remaining[remaining.length - 1].id);
      } else {
        this.activeTabId = null;
      }
    }

    this.saveToStorage();
    this.notifyListeners();
    return deleted;
  }

  activateTab(id: string): Tab | null {
    const tab = this.tabs.get(id);
    if (!tab) return null;

    // Deactivate current
    if (this.activeTabId && this.activeTabId !== id) {
      const current = this.tabs.get(this.activeTabId);
      if (current) {
        current.isActive = false;
        this.tabs.set(this.activeTabId, current);
      }
    }

    // Activate new
    tab.isActive = true;
    this.tabs.set(id, tab);
    this.activeTabId = id;
    
    this.saveToStorage();
    this.notifyListeners();
    
    return tab;
  }

  updateTab(id: string, updates: Partial<Tab>): Tab | null {
    const tab = this.tabs.get(id);
    if (!tab) return null;

    Object.assign(tab, updates);
    this.tabs.set(id, tab);
    this.saveToStorage();
    this.notifyListeners();
    
    return tab;
  }

  updateTabData(id: string, data: any): Tab | null {
    return this.updateTab(id, { data });
  }

  getTab(id: string): Tab | null {
    return this.tabs.get(id) || null;
  }

  getActiveTab(): Tab | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }

  getAllTabs(): Tab[] {
    return Array.from(this.tabs.values()).sort((a, b) => {
      // Sort by creation time (from ID)
      const aTime = parseInt(a.id.split('-')[1] || '0');
      const bTime = parseInt(b.id.split('-')[1] || '0');
      return aTime - bTime;
    });
  }

  getTabsByType(type: TabType): Tab[] {
    return this.getAllTabs().filter(tab => tab.type === type);
  }

  closeAllTabs(): void {
    this.tabs.clear();
    this.activeTabId = null;
    this.saveToStorage();
    this.notifyListeners();
  }

  closeOtherTabs(keepId: string): void {
    const keepTab = this.tabs.get(keepId);
    this.tabs.clear();
    
    if (keepTab) {
      keepTab.isActive = true;
      this.tabs.set(keepId, keepTab);
      this.activeTabId = keepId;
    }
    
    this.saveToStorage();
    this.notifyListeners();
  }

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
let tabManagerInstance: TabManager | null = null;

export function getTabManager(): TabManager {
  if (!tabManagerInstance) {
    tabManagerInstance = new TabManager();
  }
  return tabManagerInstance;
}

export function resetTabManager(): void {
  tabManagerInstance = null;
}

export default TabManager;
