/** @jsxImportSource react */
import { useState, useCallback } from 'react'
import { X, Plus, Globe, Search, Brain, Loader2 } from 'lucide-react'

export type TabType = 'search' | 'browser' | 'research' | 'council'

export interface Tab {
  id: string
  type: TabType
  title: string
  query?: string
  url?: string
  isLoading?: boolean
  isBackground?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onNewTab: (type: TabType) => void
}

const TAB_ICONS: Record<TabType, typeof Search> = {
  search: Search,
  browser: Globe,
  research: Brain,
  council: Brain,
}

const TAB_COLORS: Record<TabType, string> = {
  search: 'text-violet-500',
  browser: 'text-blue-500',
  research: 'text-emerald-500',
  council: 'text-amber-500',
}

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }: TabBarProps) {
  const [showNewTabMenu, setShowNewTabMenu] = useState(false)

  const handleNewTab = (type: TabType) => {
    onNewTab(type)
    setShowNewTabMenu(false)
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-secondary/50 border-b border-border overflow-x-auto">
      {/* Tab List */}
      <div className="flex items-center gap-1 flex-1">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.type]
          const isActive = tab.id === activeTabId
          
          return (
            <div
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer
                min-w-[120px] max-w-[200px] transition-all duration-200
                ${isActive 
                  ? 'bg-background border border-border shadow-sm' 
                  : 'hover:bg-secondary/80 border border-transparent'
                }
                ${tab.isBackground ? 'opacity-60' : ''}
              `}
            >
              <Icon className={`w-3.5 h-3.5 ${TAB_COLORS[tab.type]}`} />
              <span className="flex-1 text-sm truncate">
                {tab.title}
              </span>
              {tab.isLoading && (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
              {tab.isBackground && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Running in background" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTabClose(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-secondary rounded transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* New Tab Button */}
      <div className="relative">
        <button
          onClick={() => setShowNewTabMenu(!showNewTabMenu)}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>

        {showNewTabMenu && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowNewTabMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => handleNewTab('search')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Search className="w-4 h-4 text-violet-500" />
                New Search
              </button>
              <button
                onClick={() => handleNewTab('browser')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Globe className="w-4 h-4 text-blue-500" />
                New Browser
              </button>
              <button
                onClick={() => handleNewTab('research')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Brain className="w-4 h-4 text-emerald-500" />
                Deep Research
              </button>
              <button
                onClick={() => handleNewTab('council')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <Brain className="w-4 h-4 text-amber-500" />
                Model Council
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Hook for tab management
export function useTabManager() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'default', type: 'search', title: 'Search' }
  ])
  const [activeTabId, setActiveTabId] = useState('default')

  const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const createTab = useCallback((type: TabType, initialData?: Partial<Tab>) => {
    const newTab: Tab = {
      id: generateTabId(),
      type,
      title: initialData?.title || getDefaultTabTitle(type),
      ...initialData
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    return newTab.id
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id)
      }
      return newTabs
    })
  }, [activeTabId])

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }, [])

  const setTabLoading = useCallback((tabId: string, isLoading: boolean) => {
    updateTab(tabId, { isLoading })
  }, [updateTab])

  const setTabBackground = useCallback((tabId: string, isBackground: boolean) => {
    updateTab(tabId, { isBackground })
  }, [updateTab])

  const activeTab = tabs.find(t => t.id === activeTabId)

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    createTab,
    closeTab,
    updateTab,
    setTabLoading,
    setTabBackground,
  }
}

function getDefaultTabTitle(type: TabType): string {
  switch (type) {
    case 'search': return 'New Search'
    case 'browser': return 'New Browser'
    case 'research': return 'Deep Research'
    case 'council': return 'Model Council'
    default: return 'New Tab'
  }
}
