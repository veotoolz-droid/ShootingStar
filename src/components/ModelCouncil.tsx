/** @jsxImportSource react */
import { useState, useRef } from 'react'
import { 
  Users, 
  Play, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  Loader2,
  Brain,
  Cpu,
  Globe,
  BarChart3
} from 'lucide-react'
import type { Tab } from './TabManager'

interface ModelResponse {
  modelId: string
  modelName: string
  provider: 'local' | 'kimi' | 'openai'
  response: string
  latency: number
  tokens?: number
  status: 'pending' | 'running' | 'completed' | 'error'
  error?: string
}

interface CouncilSession {
  id: string
  query: string
  responses: ModelResponse[]
  consensus?: string
  votes: Record<string, number> // modelId -> vote count
  userVote?: string
  isRunning: boolean
  startTime: number
  endTime?: number
}

interface ModelConfig {
  id: string
  name: string
  provider: 'local' | 'kimi' | 'openai'
  url: string
  model: string
  apiKey?: string
  color: string
}

interface ModelCouncilPanelProps {
  tab: Tab
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
  settings: {
    providerMode: string
    kimiApiKey?: string
    braveApiKey?: string
  }
}

const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    provider: 'kimi',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'kimi-k2-0711-preview',
    color: 'text-violet-500'
  },
  {
    id: 'kimi-k1.5',
    name: 'Kimi K1.5',
    provider: 'kimi',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'kimi-k1.5',
    color: 'text-blue-500'
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    provider: 'local',
    url: 'http://localhost:1234/v1/chat/completions',
    model: 'local-model',
    color: 'text-emerald-500'
  }
]

export function ModelCouncilPanel({ tab, onUpdateTab, settings }: ModelCouncilPanelProps) {
  const [query, setQuery] = useState(tab.query || '')
  const [session, setSession] = useState<CouncilSession | null>(null)
  const [selectedModels, setSelectedModels] = useState<string[]>(['kimi-k2', 'kimi-moonshot'])
  const abortRef = useRef(false)

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId)
      }
      if (prev.length >= 3) return prev // Max 3 models
      return [...prev, modelId]
    })
  }

  const getModelConfig = (modelId: string): ModelConfig => {
    const config = AVAILABLE_MODELS.find(m => m.id === modelId)
    if (!config) throw new Error(`Unknown model: ${modelId}`)
    
    return {
      ...config,
      apiKey: config.provider === 'kimi' ? settings.kimiApiKey : undefined
    }
  }

  const queryModel = async (modelConfig: ModelConfig, userQuery: string): Promise<ModelResponse> => {
    const startTime = Date.now()
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (modelConfig.apiKey) {
        headers['Authorization'] = `Bearer ${modelConfig.apiKey}`
      }

      const response = await fetch(modelConfig.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful AI assistant. Provide clear, accurate, and concise answers.' 
            },
            { role: 'user', content: userQuery }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const latency = Date.now() - startTime
      
      return {
        modelId: modelConfig.id,
        modelName: modelConfig.name,
        provider: modelConfig.provider,
        response: data.choices[0]?.message?.content || 'No response',
        latency,
        tokens: data.usage?.total_tokens,
        status: 'completed'
      }
    } catch (error) {
      return {
        modelId: modelConfig.id,
        modelName: modelConfig.name,
        provider: modelConfig.provider,
        response: '',
        latency: Date.now() - startTime,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const analyzeConsensus = async (responses: ModelResponse[], userQuery: string): Promise<string> => {
    const validResponses = responses.filter(r => r.status === 'completed')
    if (validResponses.length < 2) return 'Insufficient responses for consensus analysis.'

    const consensusPrompt = `Given the following responses to the query "${userQuery}":

${validResponses.map((r) => `=== ${r.modelName} ===\n${r.response}\n`).join('\n')}

Analyze these responses and provide:
1. Areas of agreement (consensus)
2. Areas of disagreement or different perspectives
3. Key insights from each model
4. Overall confidence level in the consensus

Format as a brief analysis.`

    try {
      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.kimiApiKey}`
        },
        body: JSON.stringify({
          model: 'kimi-k2-0711-preview',
          messages: [
            { role: 'system', content: 'You are an expert at analyzing and comparing AI model responses.' },
            { role: 'user', content: consensusPrompt }
          ],
          temperature: 0.5,
          max_tokens: 1500
        })
      })

      const data = await response.json()
      return data.choices[0]?.message?.content || 'Consensus analysis failed'
    } catch {
      return 'Unable to perform consensus analysis'
    }
  }

  const startCouncil = async () => {
    if (!query.trim() || selectedModels.length < 2) return

    abortRef.current = false
    const sessionId = `council-${Date.now()}`
    
    const newSession: CouncilSession = {
      id: sessionId,
      query: query.trim(),
      responses: selectedModels.map(modelId => {
        const config = getModelConfig(modelId)
        return {
          modelId: config.id,
          modelName: config.name,
          provider: config.provider,
          response: '',
          latency: 0,
          status: 'pending'
        }
      }),
      votes: {},
      isRunning: true,
      startTime: Date.now()
    }

    setSession(newSession)
    onUpdateTab(tab.id, { title: `Council: ${query.slice(0, 25)}...`, isLoading: true })

    // Run all models in parallel
    const modelPromises = selectedModels.map(async (modelId) => {
      if (abortRef.current) return null
      
      const config = getModelConfig(modelId)
      
      // Update status to running
      setSession(prev => {
        if (!prev) return null
        return {
          ...prev,
          responses: prev.responses.map(r => 
            r.modelId === modelId ? { ...r, status: 'running' } : r
          )
        }
      })

      const result = await queryModel(config, query.trim())
      
      if (abortRef.current) return null

      // Update with result
      setSession(prev => {
        if (!prev) return null
        return {
          ...prev,
          responses: prev.responses.map(r => 
            r.modelId === modelId ? result : r
          )
        }
      })

      return result
    })

    const results = await Promise.all(modelPromises)
    
    if (abortRef.current) {
      onUpdateTab(tab.id, { isLoading: false })
      return
    }

    // Analyze consensus
    const validResponses = results.filter((r): r is ModelResponse => r !== null && r.status === 'completed')
    if (validResponses.length >= 2) {
      const consensus = await analyzeConsensus(validResponses, query.trim())
      
      setSession(prev => prev ? {
        ...prev,
        consensus,
        isRunning: false,
        endTime: Date.now()
      } : null)
    } else {
      setSession(prev => prev ? { ...prev, isRunning: false, endTime: Date.now() } : null)
    }

    onUpdateTab(tab.id, { isLoading: false })
  }

  const stopCouncil = () => {
    abortRef.current = true
    setSession(prev => prev ? { ...prev, isRunning: false } : null)
    onUpdateTab(tab.id, { isLoading: false })
  }

  const voteForModel = (modelId: string) => {
    setSession(prev => {
      if (!prev) return null
      
      // Remove previous vote if exists
      const newVotes = { ...prev.votes }
      if (prev.userVote) {
        newVotes[prev.userVote] = (newVotes[prev.userVote] || 0) - 1
      }
      
      // Add new vote
      newVotes[modelId] = (newVotes[modelId] || 0) + 1
      
      return {
        ...prev,
        votes: newVotes,
        userVote: modelId
      }
    })
  }

  const getConsensusHighlights = (responses: ModelResponse[]) => {
    const validResponses = responses.filter(r => r.status === 'completed')
    if (validResponses.length < 2) return null

    // Simple consensus detection based on common keywords
    const allWords = validResponses.map(r => 
      r.response.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    )
    
    const commonWords = allWords[0].filter(word => 
      allWords.every(words => words.includes(word))
    )

    return {
      agreementCount: validResponses.length,
      commonKeywords: [...new Set(commonWords)].slice(0, 5)
    }
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold">Model Council</h2>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4">
          Run multiple AI models in parallel and compare their responses side-by-side
        </p>

        {/* Query Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the council..."
            disabled={session?.isRunning}
            className="flex-1 px-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && !session?.isRunning && startCouncil()}
          />
          {session?.isRunning ? (
            <button
              onClick={stopCouncil}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={startCouncil}
              disabled={!query.trim() || selectedModels.length < 2 || !settings.kimiApiKey}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Query Council
            </button>
          )}
        </div>

        {/* Model Selection */}
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_MODELS.map(model => {
            const isSelected = selectedModels.includes(model.id)
            const isDisabled = !isSelected && selectedModels.length >= 3
            
            return (
              <button
                key={model.id}
                onClick={() => !isDisabled && toggleModel(model.id)}
                disabled={isDisabled || session?.isRunning}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isSelected 
                    ? 'bg-amber-500/20 text-amber-600 border border-amber-500/50' 
                    : 'bg-secondary text-muted-foreground border border-transparent hover:bg-secondary/80'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span style={{ color: model.color }}>
                  {model.provider === 'kimi' && <Globe className="w-3 h-3" />}
                  {model.provider === 'local' && <Cpu className="w-3 h-3" />}
                </span>
                {model.name}
              </button>
            )
          })}
        </div>

        {!settings.kimiApiKey && (
          <p className="text-sm text-amber-500 mt-2">
            ⚠️ Kimi API key required. Add it in Settings.
          </p>
        )}
      </div>

      {/* Results */}
      {session && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Consensus Analysis */}
          {session.consensus && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">Consensus Analysis</h3>
              </div>
              <div className="text-sm whitespace-pre-wrap">{session.consensus}</div>
              
              {(() => {
                const highlights = getConsensusHighlights(session.responses)
                if (highlights?.commonKeywords.length) {
                  return (
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Common themes:</span>
                      {highlights.commonKeywords.map((word, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full">
                          {word}
                        </span>
                      ))}
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}

          {/* Response Grid */}
          <div className={`grid gap-4 ${
            session.responses.length === 2 ? 'grid-cols-2' : 
            session.responses.length >= 3 ? 'grid-cols-1 lg:grid-cols-3' : 
            'grid-cols-1'
          }`}>
            {session.responses.map((response) => {
              const model = AVAILABLE_MODELS.find(m => m.id === response.modelId)
              const voteCount = session.votes[response.modelId] || 0
              const isUserVote = session.userVote === response.modelId
              
              return (
                <div 
                  key={response.modelId}
                  className={`border rounded-lg overflow-hidden ${
                    isUserVote ? 'border-amber-500/50 ring-1 ring-amber-500/30' : 'border-border'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span style={{ color: model?.color }}>
                        {response.provider === 'kimi' && <Globe className="w-4 h-4" />}
                        {response.provider === 'local' && <Cpu className="w-4 h-4" />}
                      </span>
                      <span className="font-medium">{response.modelName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {response.status === 'completed' && (
                        <span className="text-xs text-muted-foreground">
                          {formatLatency(response.latency)}
                        </span>
                      )}
                      {response.status === 'running' && (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      )}
                      {response.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {response.status === 'pending' && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting...</p>
                      </div>
                    )}
                    
                    {response.status === 'running' && (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-amber-500" />
                        <p className="text-sm text-muted-foreground">Generating response...</p>
                      </div>
                    )}
                    
                    {response.status === 'completed' && (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">{response.response}</div>
                      </div>
                    )}
                    
                    {response.status === 'error' && (
                      <div className="text-center py-8 text-red-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">{response.error || 'Failed to get response'}</p>
                      </div>
                    )}
                  </div>

                  {/* Vote Footer */}
                  {response.status === 'completed' && (
                    <div className="px-4 py-2 border-t border-border bg-secondary/20">
                      <button
                        onClick={() => voteForModel(response.modelId)}
                        className={`
                          w-full flex items-center justify-center gap-2 py-1.5 rounded text-sm font-medium transition-all
                          ${isUserVote 
                            ? 'bg-amber-500 text-white' 
                            : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <ThumbsUp className={`w-4 h-4 ${isUserVote ? 'fill-current' : ''}`} />
                        {isUserVote ? 'You voted for this' : 'Vote as best'}
                        {voteCount > 0 && (
                          <span className="ml-1">({voteCount})</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!session && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Query the Model Council</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Select 2-3 models and ask a question. The council will:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Run multiple models in parallel
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Compare responses side-by-side
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Analyze consensus and differences
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              Vote on the best answer
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
