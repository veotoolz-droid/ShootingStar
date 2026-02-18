import { useState, useEffect, useRef } from 'react'
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
  Menu
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

function App() {
  const [query, setQuery] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [currentResult, setCurrentResult] = useState<SearchResult | null>(null)
  const [history, setHistory] = useState<SearchResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [displayedAnswer, setDisplayedAnswer] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history and theme from localStorage
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
  }, [])

  // Save history
  useEffect(() => {
    localStorage.setItem('comet-search-history', JSON.stringify(history))
  }, [history])

  // Streaming text effect
  useEffect(() => {
    if (!currentResult) {
      setDisplayedAnswer('')
      return
    }

    let index = 0
    const text = currentResult.answer
    setDisplayedAnswer('')
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedAnswer(text.slice(0, index + 1))
        index += 2 // Speed up typing
      } else {
        clearInterval(interval)
      }
    }, 10)

    return () => clearInterval(interval)
  }, [currentResult?.id])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('comet-theme', !isDark ? 'dark' : 'light')
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setCurrentResult(null)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const { answer, sources } = generateMockResponse(query)
    const result: SearchResult = {
      id: Date.now().toString(),
      query: query.trim(),
      answer,
      sources,
      timestamp: Date.now(),
    }

    setCurrentResult(result)
    setHistory(prev => [result, ...prev.filter(h => h.query !== result.query)].slice(0, 50))
    setIsSearching(false)
  }

  const loadFromHistory = (result: SearchResult) => {
    setQuery(result.query)
    setCurrentResult(result)
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
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.timestamp)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

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
                    AI-powered search with cited sources
                  </p>
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
                    <button
                      type="submit"
                      disabled={!query.trim() || isSearching}
                      className="m-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </form>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Answer */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-medium text-muted-foreground">Answer</span>
                      </div>
                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line leading-relaxed">
                          {displayedAnswer}
                          {displayedAnswer.length < currentResult.answer.length && (
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