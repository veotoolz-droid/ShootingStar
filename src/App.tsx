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
  AlertCircle
} from 'lucide-react'

interface Source {
  title: string
  url: string
  domain: string
}

interface SearchResult {
  id: string
  query: string
  answer: string
  sources: Source[]
  timestamp: number
  provider: string
}

type Provider = 'mock' | 'lmstudio' | 'openai' | 'custom'

interface ProviderConfig {
  name: string
  url: string
  model: string
  apiKey?: string
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
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
  }
}

// Mock AI responses with sources
const generateMockResponse = (query: string): { answer: string; sources: Source[] } => {
  const sources: Source[] = [
    { title: 'Understanding AI-Powered Search Technologies', url: 'https://example.com/ai-search', domain: 'techinsights.com' },
    { title: 'The Future of Information Retrieval', url: 'https://example.com/future-search', domain: 'futuretech.io' },
    { title: 'Modern Search Architecture Patterns', url: 'https://example.com/search-arch', domain: 'devpatterns.net' },
  ]

  const responses: Record<string, string> = {
    default: `Based on my analysis, ${query} is a fascinating topic that intersects with several key areas of modern technology. The approach typically involves leveraging large language models combined with retrieval-augmented generation (RAG) techniques to provide accurate, sourced information.

Key aspects include:
• Real-time information retrieval from authoritative sources
• Natural language understanding and synthesis
• Citation tracking for verification
• Streaming responses for better UX

This represents a significant evolution from traditional keyword-based search, moving toward conversational, context-aware information discovery.`,
  }

  return {
    answer: responses[query.toLowerCase()] || responses.default,
    sources,
  }
}

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

// Stream from LM Studio or other OpenAI-compatible API
async function* streamLLMResponse(
  query: string,
  config: ProviderConfig,
  onError: (msg: string) => void
): AsyncGenerator<string, void, unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI search assistant. Provide concise, accurate answers. When possible, cite sources or mention where information comes from. Be helpful but brief.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

function App() {
  const [query, setQuery] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null)
  const [history, setHistory] = useState<SearchResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [displayedAnswer, setDisplayedAnswer] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [provider, setProvider] = useState<Provider>('mock')
  const [customConfig, setCustomConfig] = useState<ProviderConfig>({ name: 'Custom', url: '', model: '' })
  const [lmStudioConnected, setLmStudioConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<boolean>(false)

  // Load history, theme, and provider settings
  useEffect(() => {
    const savedHistory = localStorage.getItem('comet-search-history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
    const savedTheme = localStorage.getItem('comet-theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
    const savedProvider = localStorage.getItem('comet-provider') as Provider
    if (savedProvider && PROVIDERS[savedProvider]) {
      setProvider(savedProvider)
    }
    const savedCustom = localStorage.getItem('comet-custom-config')
    if (savedCustom) {
      setCustomConfig(JSON.parse(savedCustom))
    }
  }, [])

  // Check LM Studio connection periodically
  useEffect(() => {
    if (provider !== 'lmstudio') return
    
    const check = async () => {
      const connected = await checkLMStudioConnection()
      setLmStudioConnected(connected)
    }
    
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [provider])

  // Save settings
  useEffect(() => {
    localStorage.setItem('comet-search-history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('comet-provider', provider)
  }, [provider])

  useEffect(() => {
    localStorage.setItem('comet-custom-config', JSON.stringify(customConfig))
  }, [customConfig])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('comet-theme', !isDark ? 'dark' : 'light')
  }

  const getCurrentConfig = (): ProviderConfig => {
    if (provider === 'custom') return customConfig
    return PROVIDERS[provider]
  }

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setCurrentResult(null)
    setDisplayedAnswer('')
    setError(null)
    abortRef.current = false

    const config = getCurrentConfig()
    let fullAnswer = ''

    try {
      if (provider === 'mock') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const { answer, sources } = generateMockResponse(query)
        fullAnswer = answer

        // Simulate streaming
        for (let i = 0; i < answer.length; i += 3) {
          if (abortRef.current) break
          setDisplayedAnswer(answer.slice(0, i + 3))
          await new Promise(r => setTimeout(r, 10))
        }

        const result: SearchResult = {
          id: Date.now().toString(),
          query: query.trim(),
          answer,
          sources,
          timestamp: Date.now(),
          provider: config.name,
        }
        setCurrentResult(result)
        setHistory(prev => [result, ...prev.filter(h => h.query !== result.query)].slice(0, 50))
      } else {
        // Real LLM streaming
        const sources: Source[] = [
          { title: `${config.name} Response`, url: '#', domain: provider === 'lmstudio' ? 'local-llm' : provider },
        ]

        const result: SearchResult = {
          id: Date.now().toString(),
          query: query.trim(),
          answer: '',
          sources,
          timestamp: Date.now(),
          provider: config.name,
        }
        setCurrentResult(result)

        for await (const chunk of streamLLMResponse(query, config, setError)) {
          if (abortRef.current) break
          fullAnswer += chunk
          setDisplayedAnswer(fullAnswer)
        }

        const finalResult: SearchResult = {
          ...result,
          answer: fullAnswer,
        }
        setCurrentResult(finalResult)
        setHistory(prev => [finalResult, ...prev.filter(h => h.query !== finalResult.query)].slice(0, 50))
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }, [query, isSearching, provider, customConfig])

  const stopSearch = () => {
    abortRef.current = true
    setIsSearching(false)
  }

  const loadFromHistory = (result: SearchResult) => {
    setQuery(result.query)
    setCurrentResult(result)
    setDisplayedAnswer(result.answer)
    setShowHistory(false)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('comet-search-history')
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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
            {/* Provider indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>{getCurrentConfig().name}</span>
              {provider === 'lmstudio' && (
                lmStudioConnected === true ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : lmStudioConnected === false ? (
                  <WifiOff className="w-3 h-3 text-red-500" />
                ) : null
              )}
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

      <div className="flex pt-14">
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
                  onClick={clearHistory}
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
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors group"
                  >
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.query}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
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

        {/* Settings Panel */}
        {showSettings && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setShowSettings(false)}
            />
            <div className="fixed right-0 top-14 bottom-0 w-80 bg-background border-l border-border z-40 p-6 overflow-y-auto animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Selection */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    AI Provider
                  </label>
                  <div className="space-y-2">
                    {(Object.keys(PROVIDERS) as Provider[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setProvider(key)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          provider === key 
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
                          <span className="font-medium">{PROVIDERS[key].name}</span>
                        </div>
                        {provider === key && (
                          <div className="w-2 h-2 rounded-full bg-violet-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LM Studio Instructions */}
                {provider === 'lmstudio' && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>LM Studio Setup</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Download <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">LM Studio</a></li>
                      <li>Load a model (see recommendations below)</li>
                      <li>Start the local server (port 1234)</li>
                      <li>Ensure CORS is enabled in settings</li>
                    </ol>
                  </div>
                )}

                {/* Custom Provider Config */}
                {provider === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        API URL
                      </label>
                      <input
                        type="text"
                        value={customConfig.url}
                        onChange={(e) => setCustomConfig({ ...customConfig, url: e.target.value })}
                        placeholder="http://localhost:1234/v1/chat/completions"
                        className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={customConfig.model}
                        onChange={(e) => setCustomConfig({ ...customConfig, model: e.target.value })}
                        placeholder="local-model"
                        className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        API Key (optional)
                      </label>
                      <input
                        type="password"
                        value={customConfig.apiKey || ''}
                        onChange={(e) => setCustomConfig({ ...customConfig, apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                  </div>
                )}

                {/* Model Recommendations */}
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Recommended Models
                  </label>
                  <div className="space-y-2 text-sm">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="font-medium">Qwen 2.5 (7B-14B)</div>
                      <div className="text-xs text-muted-foreground">Best balance of speed and quality</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="font-medium">Llama 3.1 (8B)</div>
                      <div className="text-xs text-muted-foreground">Fast, good for most queries</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="font-medium">Mistral Nemo (12B)</div>
                      <div className="text-xs text-muted-foreground">Excellent reasoning, larger context</div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="font-medium">Phi-4 (14B)</div>
                      <div className="text-xs text-muted-foreground">Microsoft's best small model</div>
                    </div>
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

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Hero / Search */}
            {!currentResult && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                    <span className="gradient-text">What do you want to know?</span>
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    AI-powered search with {provider === 'mock' ? 'demo mode' : getCurrentConfig().name}
                  </p>
                  {provider === 'lmstudio' && lmStudioConnected === false && (
                    <p className="text-sm text-amber-500 mt-2">
                      LM Studio not detected. Make sure it's running on port 1234.
                    </p>
                  )}
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
                        placeholder="Ask anything..."
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
                        disabled={!query.trim() || isSearching}
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
                        disabled={!query.trim()}
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
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-medium text-muted-foreground">Answer</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-auto">
                          {currentResult.provider}
                        </span>
                      </div>
                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line leading-relaxed">
                          {displayedAnswer}
                          {isSearching && (
                            <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Follow-up suggestions */}
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
                  </div>

                  {/* Sources */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      Sources
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
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
        </main>
      </div>
    </div>
  )
}

export default App