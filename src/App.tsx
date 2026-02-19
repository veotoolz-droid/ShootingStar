import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Search, 
  Moon, 
  Sun, 
  History, 
  X, 
  ChevronRight,
  Sparkles,
  Globe,
  Clock,
  ArrowRight,
  Menu,
  Settings,
  Cpu,
  Wifi,
  WifiOff,
  AlertCircle,
  Zap,
  Brain,
  Layers,
  Key,
  FolderOpen,
  Database,
  Play,
  Monitor,
  MousePointer,
  Type,
  Camera,
  ScrollText,
  BrainCircuit,
  Clock as ClockIcon
} from 'lucide-react'
import { 
  braveSearch, 
  enrichSources, 
  streamLLMResponse,
  selectProvider,
  getSearchConfig,
  type Source,
  type SearchMode,
  type ProviderMode,
  type ProviderConfig 
} from './services/search'
import { TabBar, useTabManager, type Tab, type TabType } from './components/TabManager'
import { DeepResearchPanel } from './components/DeepResearch'
import { ModelCouncilPanel } from './components/ModelCouncil'
import { TaskQueue, useTaskQueue } from './components/TaskQueue'

interface SearchResult {
  id: string
  query: string
  answer: string
  sources: Source[]
  timestamp: number
  provider: string
  searchMode: SearchMode
}

interface AppSettings {
  downloadFolder: string
  memoryBankFolder: string
  memoryEnabled: boolean
  memoryMaxItems: number
  braveApiKey: string
  kimiApiKey: string
  providerMode: ProviderMode
  searchMode: SearchMode
}

interface MemoryStats {
  total: number
  conversations: number
  searches: number
}

type LLMProvider = 'mock' | 'lmstudio' | 'openai' | 'custom' | 'kimi'

const LLM_PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  mock: {
    name: 'Mock (Demo)',
    url: '',
    model: 'mock'
  },
  lmstudio: {
    name: 'LM Studio',
    url: 'http://localhost:1234/v1/chat/completions',
    model: 'local-model'
  },
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  custom: {
    name: 'Custom',
    url: '',
    model: ''
  },
  kimi: {
    name: 'Kimi API',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'kimi-k2-0711-preview'
  }
}

const SEARCH_MODES: { mode: SearchMode; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    mode: 'quick', 
    label: 'Quick', 
    icon: <Zap className="w-4 h-4" />,
    description: 'Fast answers from 1-2 sources'
  },
  { 
    mode: 'deep', 
    label: 'Deep', 
    icon: <Layers className="w-4 h-4" />,
    description: 'Comprehensive research from multiple sources'
  },
  { 
    mode: 'reasoning', 
    label: 'Reasoning', 
    icon: <Brain className="w-4 h-4" />,
    description: 'Step-by-step analysis with citations'
  }
]

// Check if LM Studio is running
const checkLMStudioConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:1234/v1/models', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.ok
  } catch {
    return false
  }
}

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

// Search Tab Content Component
function SearchTabContent({ 
  tab, 
  onUpdateTab,
  settings,
  llmProvider,
  customConfig,
  searchMode,
  setSearchMode,
  setHistory,
  addToMemory,
  error,
  setError
}: {
  tab: Tab
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
  settings: AppSettings
  llmProvider: LLMProvider
  customConfig: ProviderConfig
  searchMode: SearchMode
  setSearchMode: (mode: SearchMode) => void
  history: SearchResult[]
  setHistory: React.Dispatch<React.SetStateAction<SearchResult[]>>
  addToMemory: (type: 'conversation' | 'search', content: string, metadata?: Record<string, any>) => Promise<void>
  lmStudioConnected: boolean | null
  error: string | null
  setError: (error: string | null) => void
}) {
  const [query, setQuery] = useState(tab.query || '')
  const [isSearching, setIsSearching] = useState(false)
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null)
  const [displayedAnswer, setDisplayedAnswer] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<boolean>(false)

  const getLLMConfig = (): ProviderConfig => {
    if (llmProvider === 'custom') return customConfig
    return LLM_PROVIDERS[llmProvider]
  }

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isSearching) return

    if (!settings.braveApiKey) {
      setError('Please configure your Brave Search API key in settings')
      return
    }

    setIsSearching(true)
    setCurrentResult(null)
    setDisplayedAnswer('')
    setError(null)
    abortRef.current = false
    onUpdateTab(tab.id, { isLoading: true, query: query.trim() })

    try {
      setDisplayedAnswer('Searching the web...')
      const searchResults = await braveSearch(query, settings.braveApiKey, searchMode)
      
      if (searchResults.length === 0) {
        throw new Error('No search results found')
      }

      setDisplayedAnswer('Reading sources...')
      const enrichedSources = await enrichSources(searchResults)
      
      const llmConfig = getLLMConfig()
      const { config: activeConfig } = selectProvider(
        settings.providerMode,
        searchMode,
        llmConfig,
        settings.kimiApiKey
      )

      const result: SearchResult = {
        id: Date.now().toString(),
        query: query.trim(),
        answer: '',
        sources: enrichedSources,
        timestamp: Date.now(),
        provider: activeConfig.name,
        searchMode
      }
      setCurrentResult(result)

      let fullAnswer = ''
      for await (const chunk of streamLLMResponse(
        query, 
        enrichedSources, 
        activeConfig, 
        searchMode,
        setError
      )) {
        if (abortRef.current) break
        fullAnswer += chunk
        setDisplayedAnswer(fullAnswer)
      }

      const finalResult: SearchResult = {
        ...result,
        answer: fullAnswer
      }
      setCurrentResult(finalResult)
      setHistory(prev => [finalResult, ...prev.filter(h => h.query !== finalResult.query)].slice(0, 50))
      
      await addToMemory('search', `Query: ${query}\n\nAnswer: ${fullAnswer}`, {
        sources: enrichedSources.map(s => s.url),
        provider: activeConfig.name,
        searchMode
      })

      onUpdateTab(tab.id, { isLoading: false, title: query.slice(0, 30) + (query.length > 30 ? '...' : '') })
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed'
      setError(errorMsg)
      onUpdateTab(tab.id, { isLoading: false })
    } finally {
      setIsSearching(false)
    }
  }, [query, isSearching, searchMode, settings, llmProvider, customConfig, tab.id, onUpdateTab])

  const stopSearch = () => {
    abortRef.current = true
    setIsSearching(false)
    onUpdateTab(tab.id, { isLoading: false })
  }

  const getModeBadgeColor = (mode: SearchMode) => {
    switch (mode) {
      case 'quick': return 'bg-amber-500/20 text-amber-600'
      case 'deep': return 'bg-violet-500/20 text-violet-600'
      case 'reasoning': return 'bg-emerald-500/20 text-emerald-600'
      default: return 'bg-secondary'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero / Search */}
      {!currentResult && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">What do you want to know?</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {settings.providerMode === 'local' ? '100% Local AI Search' : 
               settings.providerMode === 'kimi' ? 'Powered by Kimi API' : 
               'Hybrid AI Search'}
            </p>
            {!settings.braveApiKey && (
              <p className="text-sm text-amber-500 mt-2">
                ⚠️ Add Brave Search API key in settings to start
              </p>
            )}
          </div>

          {/* Search Mode Selector */}
          <div className="flex justify-center gap-2 mb-6">
            {SEARCH_MODES.map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setSearchMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  searchMode === mode
                    ? 'bg-violet-500 text-white'
                    : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                }`}
              >
                {icon}
                <span className="capitalize">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                <Search className="w-5 h-5 text-muted-foreground ml-4" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask anything... (${getSearchConfig(searchMode).description})`}
                  className="flex-1 bg-transparent px-4 py-4 text-lg outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); inputRef.current?.focus() }}
                    className="p-2 mr-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!query.trim() || isSearching || !settings.braveApiKey}
                  className="m-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['What is RAG?', 'How do LLMs work?', 'Best React patterns', 'AI safety concerns'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => { setQuery(suggestion); inputRef.current?.focus() }}
                className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {currentResult && (
        <div className="animate-slide-up">
          {/* Search bar (compact) */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              {SEARCH_MODES.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSearchMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    searchMode === mode
                      ? 'bg-violet-500 text-white'
                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                  }`}
                >
                  {icon}
                  <span className="capitalize">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <Search className="w-4 h-4 text-muted-foreground ml-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-3 outline-none"
              />
              {isSearching ? (
                <button
                  type="button"
                  onClick={stopSearch}
                  className="m-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!query.trim() || !settings.braveApiKey}
                  className="m-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Search
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Answer */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-muted-foreground">Answer</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${getModeBadgeColor(currentResult.searchMode)}`}>
                    {currentResult.searchMode}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-auto">
                    {currentResult.provider}
                  </span>
                </div>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <div className="whitespace-pre-line leading-relaxed">
                    {displayedAnswer}
                    {isSearching && (
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              {/* Follow-up suggestions */}
              {!isSearching && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground py-2">Follow-up:</span>
                  {['Tell me more', 'Sources?', 'Examples', 'Related topics'].map((followUp) => (
                    <button
                      key={followUp}
                      onClick={() => setQuery(`${currentResult.query} - ${followUp}`)}
                      className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                    >
                      {followUp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sources */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                Sources ({currentResult.sources.length})
              </h3>
              <div className="space-y-3">
                {currentResult.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-card border border-border rounded-xl hover:border-violet-500/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-violet-500 transition-colors">
                          {source.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {source.snippet}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                          {source.domain}
                          <ChevronRight className="w-3 h-3" />
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Browser Tab Content Component
function BrowserTabContent({ tab, onUpdateTab }: { tab: Tab; onUpdateTab: (tabId: string, updates: Partial<Tab>) => void }) {
  const [browserUrl, setBrowserUrl] = useState(tab.url || '')
  const [browserLog, setBrowserLog] = useState<Array<{ type: 'info' | 'success' | 'error'; message: string; timestamp: number }>>([])
  const [isBrowserLoading, setIsBrowserLoading] = useState(false)

  const addBrowserLog = (type: 'info' | 'success' | 'error', message: string) => {
    setBrowserLog(prev => [...prev, { type, message, timestamp: Date.now() }].slice(-50))
  }

  const handleBrowserNavigate = async () => {
    if (!browserUrl || !isElectron()) return
    
    setIsBrowserLoading(true)
    addBrowserLog('info', `Navigating to ${browserUrl}...`)
    onUpdateTab(tab.id, { isLoading: true, url: browserUrl })
    
    try {
      await window.electronAPI.browser.navigate(browserUrl)
      addBrowserLog('success', `Successfully loaded ${browserUrl}`)
      onUpdateTab(tab.id, { isLoading: false, title: browserUrl.slice(0, 40) + '...' })
    } catch (err) {
      addBrowserLog('error', `Failed to navigate: ${err}`)
      onUpdateTab(tab.id, { isLoading: false })
    } finally {
      setIsBrowserLoading(false)
    }
  }

  const handleBrowserClick = async (selector: string) => {
    if (!isElectron()) return
    try {
      await window.electronAPI.browser.click(selector)
      addBrowserLog('success', `Clicked element: ${selector}`)
    } catch (err) {
      addBrowserLog('error', `Failed to click: ${err}`)
    }
  }

  const handleBrowserType = async (selector: string, text: string) => {
    if (!isElectron()) return
    try {
      await window.electronAPI.browser.type(selector, text)
      addBrowserLog('success', `Typed "${text}" into ${selector}`)
    } catch (err) {
      addBrowserLog('error', `Failed to type: ${err}`)
    }
  }

  const handleBrowserScreenshot = async () => {
    if (!isElectron()) return
    try {
      const path = await window.electronAPI.browser.screenshot({ fullPage: false })
      addBrowserLog('success', `Screenshot saved to ${path}`)
    } catch (err) {
      addBrowserLog('error', `Failed to take screenshot: ${err}`)
    }
  }

  const handleBrowserScroll = async (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!isElectron()) return
    try {
      await window.electronAPI.browser.scroll(direction)
      addBrowserLog('success', `Scrolled ${direction}`)
    } catch (err) {
      addBrowserLog('error', `Failed to scroll: ${err}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Monitor className="w-6 h-6 text-blue-500" />
          Agentic Browser
        </h2>
        <p className="text-muted-foreground">Control a browser with AI - navigate, click, type, and extract data</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* URL Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={browserUrl}
              onChange={(e) => setBrowserUrl(e.target.value)}
              placeholder="Enter URL to navigate..."
              className="flex-1 px-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleBrowserNavigate()}
            />
            <button
              onClick={handleBrowserNavigate}
              disabled={isBrowserLoading || !browserUrl}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isBrowserLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Navigate
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleBrowserScroll('up')}
              className="p-3 bg-card border border-border rounded-lg hover:border-blue-500/50 transition-colors flex flex-col items-center gap-1"
            >
              <ScrollText className="w-5 h-5" />
              <span className="text-xs">Scroll Up</span>
            </button>
            
            <button
              onClick={() => handleBrowserScroll('down')}
              className="p-3 bg-card border border-border rounded-lg hover:border-blue-500/50 transition-colors flex flex-col items-center gap-1"
            >
              <ScrollText className="w-5 h-5" />
              <span className="text-xs">Scroll Down</span>
            </button>
            
            <button
              onClick={() => handleBrowserScreenshot()}
              className="p-3 bg-card border border-border rounded-lg hover:border-blue-500/50 transition-colors flex flex-col items-center gap-1"
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Screenshot</span>
            </button>
            
            <button
              onClick={() => handleBrowserScroll('top')}
              className="p-3 bg-card border border-border rounded-lg hover:border-blue-500/50 transition-colors flex flex-col items-center gap-1"
            >
              <ArrowRight className="w-5 h-5 rotate-[-90deg]" />
              <span className="text-xs">To Top</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Quick Actions
            </h3>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  id={`click-selector-${tab.id}`}
                  placeholder="CSS selector to click..."
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    const selector = (document.getElementById(`click-selector-${tab.id}`) as HTMLInputElement)?.value
                    if (selector) handleBrowserClick(selector)
                  }}
                  className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm"
                >
                  Click
                </button>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  id={`type-selector-${tab.id}`}
                  placeholder="CSS selector..."
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm"
                />
                <input
                  type="text"
                  id={`type-text-${tab.id}`}
                  placeholder="Text to type..."
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    const selector = (document.getElementById(`type-selector-${tab.id}`) as HTMLInputElement)?.value
                    const text = (document.getElementById(`type-text-${tab.id}`) as HTMLInputElement)?.value
                    if (selector && text) handleBrowserType(selector, text)
                  }}
                  className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm"
                >
                  <Type className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Browser Log */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-medium mb-3">Activity Log</h3>
            <div className="h-64 overflow-y-auto space-y-1 font-mono text-sm">
              {browserLog.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No activity yet. Start by navigating to a URL.</p>
              ) : (
                browserLog.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      log.type === 'error' ? 'bg-red-500/10 text-red-500' :
                      log.type === 'success' ? 'bg-green-500/10 text-green-500' :
                      'bg-secondary/50'
                    }`}
                  >
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Browser Info */}
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-medium mb-3">Browser Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine</span>
                <span>Playwright (Chromium)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span>Headless</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-medium mb-3">Available Actions</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Navigate to URL</li>
              <li>• Click elements</li>
              <li>• Type text into inputs</li>
              <li>• Extract page content</li>
              <li>• Take screenshots</li>
              <li>• Scroll page</li>
              <li>• Evaluate JavaScript</li>
              <li>• Find elements</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              AI Integration
            </h3>
            <p className="text-sm text-muted-foreground">
              The AI can use these browser controls to perform multi-step tasks like filling forms, extracting data from websites, or taking screenshots for analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [isDark, setIsDark] = useState(false)
  const [history, setHistory] = useState<SearchResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTaskQueue, setShowTaskQueue] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    downloadFolder: '',
    memoryBankFolder: '',
    memoryEnabled: true,
    memoryMaxItems: 1000,
    braveApiKey: '',
    kimiApiKey: '',
    providerMode: 'hybrid',
    searchMode: 'quick'
  })
  
  // Provider settings
  const [llmProvider, setLLMProvider] = useState<LLMProvider>('lmstudio')
  const [customConfig, setCustomConfig] = useState<ProviderConfig>({ name: 'Custom', url: '', model: '' })
  
  // Search mode
  const [searchMode, setSearchMode] = useState<SearchMode>('quick')
  
  // Connection states
  const [lmStudioConnected, setLmStudioConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Memory state
  const [, setMemoryStats] = useState<MemoryStats>({ total: 0, conversations: 0, searches: 0 })
  const [, setRecentMemories] = useState<Array<{ id: string; content: string; timestamp: number; type: string }>>([])
  const [, _setMemorySearchResults] = useState<Array<{ id: string; content: string; score: number; metadata: any }>>([])

  // Tab Manager
  const { 
    tabs, 
    activeTabId, 
    activeTab, 
    setActiveTabId, 
    createTab, 
    closeTab, 
    updateTab
  } = useTabManager()

  // Task Queue
  const {
    tasks,
    cancelTask,
    deleteTask,
    retryTask,
    showNotifications,
    setShowNotifications,
    runningCount,
    queuedCount
  } = useTaskQueue()

  // Load settings from Electron or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      if (isElectron()) {
        try {
          const electronSettings = await window.electronAPI.settings.get()
          setSettings(electronSettings)
          setSearchMode(electronSettings.searchMode)
        } catch (err) {
          console.error('Failed to load settings:', err)
        }
      } else {
        const savedHistory = localStorage.getItem('comet-search-history')
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory))
        }
        
        const savedTheme = localStorage.getItem('comet-theme')
        if (savedTheme === 'dark') {
          setIsDark(true)
          document.documentElement.classList.add('dark')
        }
        
        const savedSearchMode = localStorage.getItem('comet-search-mode') as SearchMode
        if (savedSearchMode) {
          setSearchMode(savedSearchMode)
          setSettings(prev => ({ ...prev, searchMode: savedSearchMode }))
        }
        
        const savedBraveKey = localStorage.getItem('comet-brave-api-key')
        if (savedBraveKey) {
          setSettings(prev => ({ ...prev, braveApiKey: savedBraveKey }))
        }
        
        const savedKimiKey = localStorage.getItem('comet-kimi-api-key')
        if (savedKimiKey) {
          setSettings(prev => ({ ...prev, kimiApiKey: savedKimiKey }))
        }
        
        const savedProviderMode = localStorage.getItem('comet-provider-mode') as ProviderMode
        if (savedProviderMode) {
          setSettings(prev => ({ ...prev, providerMode: savedProviderMode }))
        }
      }
    }
    
    loadSettings()
  }, [])

  // Load memory stats
  useEffect(() => {
    if (!isElectron() || !settings.memoryEnabled) return
    
    const loadMemoryStats = async () => {
      try {
        const stats = await window.electronAPI.memory.getStats()
        setMemoryStats(stats)
        
        const recent = await window.electronAPI.memory.getRecent(5)
        setRecentMemories(recent)
      } catch (err) {
        console.error('Failed to load memory stats:', err)
      }
    }
    
    loadMemoryStats()
  }, [settings.memoryEnabled])

  // Check LM Studio connection periodically
  useEffect(() => {
    if (llmProvider !== 'lmstudio' && settings.providerMode !== 'local' && settings.providerMode !== 'hybrid') return
    
    const check = async () => {
      const connected = await checkLMStudioConnection()
      setLmStudioConnected(connected)
    }
    
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [llmProvider, settings.providerMode])

  // Save settings
  useEffect(() => {
    localStorage.setItem('comet-search-history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('comet-search-mode', searchMode)
    if (isElectron()) {
      window.electronAPI.settings.set('searchMode', searchMode)
    }
  }, [searchMode])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('comet-theme', !isDark ? 'dark' : 'light')
  }

  const addToMemory = async (type: 'conversation' | 'search', content: string, metadata?: Record<string, any>) => {
    if (!isElectron() || !settings.memoryEnabled) return
    
    try {
      await window.electronAPI.memory.add(type, content, metadata)
      const stats = await window.electronAPI.memory.getStats()
      setMemoryStats(stats)
    } catch (err) {
      console.error('Failed to add to memory:', err)
    }
  }

  const handleNewTab = (type: TabType) => {
    createTab(type)
  }

  const handleSelectDownloadFolder = async () => {
    if (!isElectron()) return
    
    try {
      const folder = await window.electronAPI.settings.selectDownloadFolder()
      if (folder) {
        setSettings(prev => ({ ...prev, downloadFolder: folder }))
      }
    } catch (err) {
      console.error('Failed to select download folder:', err)
    }
  }

  const handleSelectMemoryBankFolder = async () => {
    if (!isElectron()) return
    
    try {
      const folder = await window.electronAPI.settings.selectMemoryBankFolder()
      if (folder) {
        setSettings(prev => ({ ...prev, memoryBankFolder: folder }))
      }
    } catch (err) {
      console.error('Failed to select memory bank folder:', err)
    }
  }

  const handleUpdateSetting = async (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    if (isElectron()) {
      await window.electronAPI.settings.set(key, value)
    }
    
    if (key === 'braveApiKey') {
      localStorage.setItem('comet-brave-api-key', value)
    } else if (key === 'kimiApiKey') {
      localStorage.setItem('comet-kimi-api-key', value)
    } else if (key === 'providerMode') {
      localStorage.setItem('comet-provider-mode', value)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  // Render tab content based on active tab type
  const renderTabContent = () => {
    if (!activeTab) return null

    switch (activeTab.type) {
      case 'search':
        return (
          <SearchTabContent
            tab={activeTab}
            onUpdateTab={updateTab}
            settings={settings}
            llmProvider={llmProvider}
            customConfig={customConfig}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            history={history}
            setHistory={setHistory}
            addToMemory={addToMemory}
            lmStudioConnected={lmStudioConnected}
            error={error}
            setError={setError}
          />
        )
      
      case 'browser':
        return (
          <BrowserTabContent
            tab={activeTab}
            onUpdateTab={updateTab}
          />
        )
      
      case 'research':
        return (
          <DeepResearchPanel
            tab={activeTab}
            onUpdateTab={updateTab}
            braveApiKey={settings.braveApiKey}
            settings={{
              providerMode: settings.providerMode,
              kimiApiKey: settings.kimiApiKey
            }}
          />
        )
      
      case 'council':
        return (
          <ModelCouncilPanel
            tab={activeTab}
            onUpdateTab={updateTab}
            settings={{
              providerMode: settings.providerMode,
              kimiApiKey: settings.kimiApiKey,
              braveApiKey: settings.braveApiKey
            }}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg hidden sm:block">Comet</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Task Queue Toggle */}
            <button
              onClick={() => setShowTaskQueue(!showTaskQueue)}
              className={`relative p-2 rounded-lg transition-colors ${showTaskQueue ? 'bg-secondary' : 'hover:bg-secondary'}`}
            >
              <ClockIcon className="w-5 h-5" />
              {(runningCount > 0 || queuedCount > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {runningCount + queuedCount}
                </span>
              )}
            </button>

            {/* Search Mode Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs">
              {SEARCH_MODES.find(m => m.mode === searchMode)?.icon}
              <span className="capitalize">{searchMode}</span>
            </div>

            {/* Provider Mode Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span className="capitalize">{settings.providerMode}</span>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-secondary' : 'hover:bg-secondary'}`}
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-secondary' : 'hover:bg-secondary'}`}
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14 flex-1 overflow-hidden">
        {/* Sidebar - History */}
        <aside 
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-background border-r border-border transform transition-transform duration-300 pt-14 lg:pt-0 ${
            showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden'
          }`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Recent</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No searches yet</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const newTabId = createTab('search')
                      updateTab(newTabId, { query: item.query, title: item.query.slice(0, 30) + '...' })
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors group"
                  >
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.query}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        item.searchMode === 'quick' ? 'bg-amber-500/20 text-amber-600' :
                        item.searchMode === 'deep' ? 'bg-violet-500/20 text-violet-600' :
                        'bg-emerald-500/20 text-emerald-600'
                      }`}>
                        {item.searchMode}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {item.provider}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Task Queue Panel */}
        {showTaskQueue && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setShowTaskQueue(false)}
            />
            <div className="fixed right-0 top-14 bottom-0 w-80 bg-background border-l border-border z-40">
              <TaskQueue
                tasks={tasks}
                onTaskClick={(task) => console.log('Task clicked:', task)}
                onTaskCancel={cancelTask}
                onTaskDelete={deleteTask}
                onTaskRetry={retryTask}
                showNotifications={showNotifications}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
              />
            </div>
          </>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setShowSettings(false)}
            />
            <div className="fixed right-0 top-14 bottom-0 w-96 bg-background border-l border-border z-40 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Download Folder */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Download Folder
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.downloadFolder}
                      readOnly
                      className="flex-1 px-3 py-2 bg-background rounded-lg text-sm text-muted-foreground"
                    />
                    <button
                      onClick={handleSelectDownloadFolder}
                      disabled={!isElectron()}
                      className="px-3 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50"
                    >
                      Browse
                    </button>
                  </div>
                  {!isElectron() && (
                    <p className="text-xs text-muted-foreground mt-1">Download folder selection requires Electron app</p>
                  )}
                </div>

                {/* Memory Bank Folder */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Memory Bank Folder
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.memoryBankFolder}
                      readOnly
                      className="flex-1 px-3 py-2 bg-background rounded-lg text-sm text-muted-foreground"
                    />
                    <button
                      onClick={handleSelectMemoryBankFolder}
                      disabled={!isElectron()}
                      className="px-3 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 disabled:opacity-50"
                    >
                      Browse
                    </button>
                  </div>
                  {!isElectron() && (
                    <p className="text-xs text-muted-foreground mt-1">Memory bank requires Electron app</p>
                  )}
                </div>

                {/* Memory Settings */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" />
                    Memory Settings
                  </label>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Enable Memory</span>
                      <input
                        type="checkbox"
                        checked={settings.memoryEnabled}
                        onChange={(e) => handleUpdateSetting('memoryEnabled', e.target.checked)}
                        disabled={!isElectron()}
                        className="w-4 h-4 rounded border-border"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Max Items</span>
                      <input
                        type="number"
                        value={settings.memoryMaxItems}
                        onChange={(e) => handleUpdateSetting('memoryMaxItems', parseInt(e.target.value))}
                        disabled={!isElectron()}
                        className="w-24 px-2 py-1 bg-background rounded text-sm"
                      />
                    </label>
                  </div>
                </div>

                {/* Brave API Key */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium mb-2">
                    <Key className="w-4 h-4" />
                    <span>Brave Search API Key</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Required for web search. Get free key at{' '}
                    <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">
                      brave.com/search/api
                    </a>
                  </p>
                  <input
                    type="password"
                    value={settings.braveApiKey}
                    onChange={(e) => handleUpdateSetting('braveApiKey', e.target.value)}
                    placeholder="Enter Brave API key..."
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>

                {/* Provider Mode Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Provider Mode
                  </label>
                  <div className="space-y-2">
                    {(['local', 'kimi', 'hybrid'] as ProviderMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleUpdateSetting('providerMode', mode)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          settings.providerMode === mode 
                            ? 'border-violet-500 bg-violet-500/10' 
                            : 'border-border hover:border-violet-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {mode === 'local' && <Cpu className="w-4 h-4" />}
                          {mode === 'kimi' && <Globe className="w-4 h-4" />}
                          {mode === 'hybrid' && <Layers className="w-4 h-4" />}
                          <div className="text-left">
                            <span className="font-medium capitalize">{mode}</span>
                            <p className="text-xs text-muted-foreground">
                              {mode === 'local' && '100% Local LLM'}
                              {mode === 'kimi' && '100% Kimi API'}
                              {mode === 'hybrid' && 'Local for quick, Kimi for deep'}
                            </p>
                          </div>
                        </div>
                        {settings.providerMode === mode && (
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kimi API Key (if needed) */}
                {(settings.providerMode === 'kimi' || settings.providerMode === 'hybrid') && (
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Kimi API Key
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Get your key at{' '}
                      <a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">
                        platform.moonshot.cn
                      </a>
                    </p>
                    <input
                      type="password"
                      value={settings.kimiApiKey}
                      onChange={(e) => handleUpdateSetting('kimiApiKey', e.target.value)}
                      placeholder="Enter Kimi API key..."
                      className="w-full px-3 py-2 bg-background rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                )}

                {/* Local LLM Provider */}
                {(settings.providerMode === 'local' || settings.providerMode === 'hybrid') && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Local LLM Provider
                    </label>
                    <div className="space-y-2">
                      {(Object.keys(LLM_PROVIDERS).filter(k => k !== 'kimi') as LLMProvider[]).map((key) => (
                        <button
                          key={key}
                          onClick={() => setLLMProvider(key)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                            llmProvider === key 
                              ? 'border-violet-500 bg-violet-500/10' 
                              : 'border-border hover:border-violet-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {key === 'lmstudio' && (
                              lmStudioConnected === true ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                              ) : lmStudioConnected === false ? (
                                <WifiOff className="w-4 h-4 text-red-500" />
                              ) : (
                                <Cpu className="w-4 h-4" />
                              )
                            )}
                            {key === 'mock' && <Sparkles className="w-4 h-4" />}
                            {key === 'openai' && <Globe className="w-4 h-4" />}
                            {key === 'custom' && <Settings className="w-4 h-4" />}
                            <span className="font-medium">{LLM_PROVIDERS[key].name}</span>
                          </div>
                          {llmProvider === key && (
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* LM Studio Instructions */}
                    {llmProvider === 'lmstudio' && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm space-y-2">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span>LM Studio Setup</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                          <li>Download <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">LM Studio</a></li>
                          <li>Load a model (Qwen 2.5 recommended)</li>
                          <li>Start server on port 1234 with CORS enabled</li>
                        </ol>
                      </div>
                    )}

                    {/* Custom Provider Config */}
                    {llmProvider === 'custom' && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={customConfig.url}
                          onChange={(e) => setCustomConfig({ ...customConfig, url: e.target.value })}
                          placeholder="API URL"
                          className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                        <input
                          type="text"
                          value={customConfig.model}
                          onChange={(e) => setCustomConfig({ ...customConfig, model: e.target.value })}
                          placeholder="Model name"
                          className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Search Mode */}
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Default Search Mode
                  </label>
                  <div className="space-y-2">
                    {SEARCH_MODES.map(({ mode, label, icon, description }) => (
                      <button
                        key={mode}
                        onClick={() => setSearchMode(mode)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          searchMode === mode 
                            ? 'border-violet-500 bg-violet-500/10' 
                            : 'border-border hover:border-violet-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {icon}
                          <div className="text-left">
                            <span className="font-medium">{label}</span>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        {searchMode === mode && (
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Overlay for mobile */}
        {showHistory && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setShowHistory(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={closeTab}
            onNewTab={handleNewTab}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
