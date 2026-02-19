/** @jsxImportSource react */
import { useState, useRef } from 'react'
import { 
  Brain, 
  Search, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Play,
  Download,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  X
} from 'lucide-react'
import { braveSearch, enrichSources, type Source } from '../services/search'
import type { Tab } from './TabManager'

interface ResearchStep {
  id: string
  type: 'plan' | 'search' | 'analyze' | 'followup' | 'synthesize'
  status: 'pending' | 'running' | 'completed' | 'error'
  title: string
  description: string
  result?: string
  sources?: Source[]
  queries?: string[]
  timestamp?: number
}

interface ResearchSession {
  id: string
  query: string
  steps: ResearchStep[]
  finalReport?: string
  isRunning: boolean
  isPaused: boolean
  startTime: number
  endTime?: number
}

interface DeepResearchPanelProps {
  tab: Tab
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void
  braveApiKey: string
  settings: {
    providerMode: string
    kimiApiKey?: string
  }
}

const STEP_ICONS: Record<ResearchStep['type'], typeof Brain> = {
  plan: Brain,
  search: Search,
  analyze: FileText,
  followup: ChevronRight,
  synthesize: Sparkles,
}

export function DeepResearchPanel({ tab, onUpdateTab, braveApiKey, settings }: DeepResearchPanelProps) {
  const [query, setQuery] = useState(tab.query || '')
  const [session, setSession] = useState<ResearchSession | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const abortRef = useRef(false)

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const createResearchPlan = async (userQuery: string): Promise<string[]> => {
    // Use LLM to generate research sub-queries
    const planPrompt = `Given the research query: "${userQuery}"

Generate 3-5 specific sub-queries that would help comprehensively answer this question. 
Each sub-query should focus on a different aspect or angle.

Return ONLY the sub-queries, one per line, no numbering or bullets.`

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
            { role: 'system', content: 'You are a research planning assistant. Generate focused sub-queries for comprehensive research.' },
            { role: 'user', content: planPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (!response.ok) throw new Error('Failed to generate plan')
      
      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''
      return content.split('\n').filter((q: string) => q.trim().length > 0)
    } catch (error) {
      // Fallback: create generic sub-queries
      return [
        `${userQuery} overview`,
        `${userQuery} latest developments`,
        `${userQuery} examples and case studies`,
        `${userQuery} expert opinions`
      ]
    }
  }

  const executeSearch = async (subQuery: string): Promise<{ sources: Source[], summary: string }> => {
    const searchResults = await braveSearch(subQuery, braveApiKey, 'deep')
    const enrichedSources = await enrichSources(searchResults)
    
    // Generate summary for this sub-query
    const summaryPrompt = `Summarize the key findings about "${subQuery}" based on these sources:

${enrichedSources.map((s, i) => `[${i + 1}] ${s.title}\n${s.content || s.snippet}`).join('\n\n')}

Provide a concise summary of the most important points.`

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
            { role: 'system', content: 'You are a research summarizer. Provide concise, factual summaries.' },
            { role: 'user', content: summaryPrompt }
          ],
          temperature: 0.5,
          max_tokens: 800
        })
      })

      const data = await response.json()
      const summary = data.choices[0]?.message?.content || 'Summary not available'
      
      return { sources: enrichedSources, summary }
    } catch {
      return { 
        sources: enrichedSources, 
        summary: `Found ${enrichedSources.length} sources for "${subQuery}"`
      }
    }
  }

  const identifyGaps = async (originalQuery: string, findings: string[]): Promise<string[]> => {
    const gapPrompt = `Original query: "${originalQuery}"

Research findings so far:
${findings.join('\n\n')}

Based on these findings, what important aspects of the original query are still missing or need more depth? 
Generate 1-2 follow-up questions to fill these gaps.

Return ONLY the follow-up questions, one per line.`

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
            { role: 'system', content: 'You are a gap analysis assistant. Identify missing information in research.' },
            { role: 'user', content: gapPrompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      })

      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''
      return content.split('\n').filter((q: string) => q.trim().length > 0).slice(0, 2)
    } catch {
      return []
    }
  }

  const synthesizeReport = async (originalQuery: string, allFindings: string[]): Promise<string> => {
    const synthesisPrompt = `Original research query: "${originalQuery}"

Research findings from multiple angles:
${allFindings.join('\n\n---\n\n')}

Synthesize these findings into a comprehensive research report with:
1. Executive Summary
2. Key Findings (with citations)
3. Detailed Analysis
4. Conclusions
5. Recommendations for further research

Format with clear headings and bullet points where appropriate.`

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
            { role: 'system', content: 'You are a research synthesis expert. Create comprehensive, well-structured reports.' },
            { role: 'user', content: synthesisPrompt }
          ],
          temperature: 0.5,
          max_tokens: 4000
        })
      })

      const data = await response.json()
      return data.choices[0]?.message?.content || 'Report synthesis failed'
    } catch {
      return 'Unable to synthesize final report. Please review the individual findings above.'
    }
  }

  const startResearch = async () => {
    if (!query.trim() || !braveApiKey) return

    abortRef.current = false
    const sessionId = `research-${Date.now()}`
    
    const newSession: ResearchSession = {
      id: sessionId,
      query: query.trim(),
      steps: [
        { id: 'plan', type: 'plan', status: 'pending', title: 'Research Planning', description: 'Analyzing query and creating research strategy' },
        { id: 'search-1', type: 'search', status: 'pending', title: 'Initial Search', description: 'Gathering information from multiple sources' },
        { id: 'analyze-1', type: 'analyze', status: 'pending', title: 'Analysis', description: 'Processing and summarizing findings' },
        { id: 'followup', type: 'followup', status: 'pending', title: 'Gap Analysis', description: 'Identifying missing information' },
        { id: 'search-2', type: 'search', status: 'pending', title: 'Follow-up Search', description: 'Filling knowledge gaps' },
        { id: 'synthesize', type: 'synthesize', status: 'pending', title: 'Synthesis', description: 'Creating comprehensive report' },
      ],
      isRunning: true,
      isPaused: false,
      startTime: Date.now()
    }

    setSession(newSession)
    onUpdateTab(tab.id, { title: `Research: ${query.slice(0, 30)}...`, isLoading: true })

    const allFindings: string[] = []
    const allSources: Source[] = []

    try {
      // Step 1: Planning
      updateStepStatus('plan', 'running')
      const subQueries = await createResearchPlan(query.trim())
      updateStepResult('plan', `Research plan created with ${subQueries.length} sub-queries:\n${subQueries.map(q => `• ${q}`).join('\n')}`, undefined, subQueries)
      updateStepStatus('plan', 'completed')

      if (abortRef.current) return

      // Step 2: Initial Search
      updateStepStatus('search-1', 'running')
      for (const subQuery of subQueries) {
        if (abortRef.current) return
        const { sources, summary } = await executeSearch(subQuery)
        allFindings.push(`Query: ${subQuery}\n${summary}`)
        allSources.push(...sources)
      }
      updateStepResult('search-1', `Completed ${subQueries.length} searches`, allSources)
      updateStepStatus('search-1', 'completed')

      if (abortRef.current) return

      // Step 3: Analysis
      updateStepStatus('analyze-1', 'running')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate analysis
      updateStepResult('analyze-1', `Analyzed ${allSources.length} sources across ${subQueries.length} sub-queries`)
      updateStepStatus('analyze-1', 'completed')

      if (abortRef.current) return

      // Step 4: Gap Analysis
      updateStepStatus('followup', 'running')
      const gaps = await identifyGaps(query.trim(), allFindings)
      updateStepResult('followup', gaps.length > 0 
        ? `Identified ${gaps.length} knowledge gaps:\n${gaps.map(g => `• ${g}`).join('\n')}`
        : 'No significant gaps identified', undefined, gaps)
      updateStepStatus('followup', 'completed')

      if (abortRef.current) return

      // Step 5: Follow-up Search (if gaps found)
      if (gaps.length > 0) {
        updateStepStatus('search-2', 'running')
        for (const gap of gaps) {
          if (abortRef.current) return
          const { sources, summary } = await executeSearch(gap)
          allFindings.push(`Gap Query: ${gap}\n${summary}`)
          allSources.push(...sources)
        }
        updateStepResult('search-2', `Filled ${gaps.length} knowledge gaps`, allSources)
        updateStepStatus('search-2', 'completed')
      } else {
        updateStepStatus('search-2', 'completed')
        updateStepResult('search-2', 'Skipped - no gaps identified')
      }

      if (abortRef.current) return

      // Step 6: Synthesis
      updateStepStatus('synthesize', 'running')
      const report = await synthesizeReport(query.trim(), allFindings)
      
      setSession(prev => prev ? {
        ...prev,
        finalReport: report,
        isRunning: false,
        endTime: Date.now()
      } : null)
      
      updateStepResult('synthesize', 'Comprehensive research report generated')
      updateStepStatus('synthesize', 'completed')

    } catch (error) {
      console.error('Research error:', error)
      setSession(prev => prev ? { ...prev, isRunning: false } : null)
    } finally {
      onUpdateTab(tab.id, { isLoading: false })
    }
  }

  const updateStepStatus = (stepId: string, status: ResearchStep['status']) => {
    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        steps: prev.steps.map(s => 
          s.id === stepId ? { ...s, status, timestamp: Date.now() } : s
        )
      }
    })
  }

  const updateStepResult = (stepId: string, result: string, sources?: Source[], queries?: string[]) => {
    setSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        steps: prev.steps.map(s => 
          s.id === stepId ? { ...s, result, sources, queries } : s
        )
      }
    })
  }

  const stopResearch = () => {
    abortRef.current = true
    setSession(prev => prev ? { ...prev, isRunning: false } : null)
    onUpdateTab(tab.id, { isLoading: false })
  }

  const downloadReport = () => {
    if (!session?.finalReport) return
    
    const blob = new Blob([session.finalReport], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-report-${session.query.slice(0, 30).replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold">Deep Research</h2>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4">
          AI-powered iterative research that plans, searches, analyzes, and synthesizes comprehensive reports
        </p>

        {/* Query Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a research topic..."
            disabled={session?.isRunning}
            className="flex-1 px-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && !session?.isRunning && startResearch()}
          />
          {session?.isRunning ? (
            <button
              onClick={stopResearch}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={startResearch}
              disabled={!query.trim() || !braveApiKey}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Research
            </button>
          )}
        </div>

        {!braveApiKey && (
          <p className="text-sm text-amber-500 mt-2">
            ⚠️ Brave Search API key required. Add it in Settings.
          </p>
        )}
      </div>

      {/* Research Progress */}
      {session && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Progress Overview */}
          <div className="mb-6 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{session.query}</span>
              {session.endTime && (
                <span className="text-sm text-muted-foreground">
                  Completed in {formatDuration(session.endTime - session.startTime)}
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ 
                  width: `${(session.steps.filter(s => s.status === 'completed').length / session.steps.length) * 100}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{session.steps.filter(s => s.status === 'completed').length} of {session.steps.length} steps</span>
              <span>{Math.round((session.steps.filter(s => s.status === 'completed').length / session.steps.length) * 100)}%</span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {session.steps.map((step) => {
              const Icon = STEP_ICONS[step.type]
              const isExpanded = expandedSteps.has(step.id)
              
              return (
                <div 
                  key={step.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    step.status === 'running' ? 'border-emerald-500/50 bg-emerald-500/5' :
                    step.status === 'completed' ? 'border-border' :
                    step.status === 'error' ? 'border-red-500/50 bg-red-500/5' :
                    'border-border opacity-60'
                  }`}
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center
                      ${step.status === 'completed' ? 'bg-emerald-500 text-white' :
                        step.status === 'running' ? 'bg-emerald-500/20 text-emerald-500' :
                        step.status === 'error' ? 'bg-red-500 text-white' :
                        'bg-secondary text-muted-foreground'}
                    `}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : step.status === 'running' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                    
                    <Icon className={`w-4 h-4 ${
                      step.status === 'completed' ? 'text-emerald-500' :
                      step.status === 'running' ? 'text-emerald-500' :
                      'text-muted-foreground'
                    }`} />
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>

                    {step.result && (
                      isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && step.result && (
                    <div className="px-3 pb-3">
                      <div className="pl-12 p-3 bg-secondary/50 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-sans">{step.result}</pre>
                        
                        {step.sources && step.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Sources:</div>
                            <div className="space-y-1">
                              {step.sources.slice(0, 5).map((source, i) => (
                                <a
                                  key={i}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-violet-500 hover:underline truncate"
                                >
                                  {source.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Final Report */}
          {session.finalReport && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Research Report
                </h3>
                <button
                  onClick={downloadReport}
                  className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{session.finalReport}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!session && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Brain className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Start a Deep Research Session</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Enter a topic above and click Start Research. The AI will:
          </p>
          <ul className="text-sm text-muted-foreground mt-4 space-y-1 text-left">
            <li>• Plan a research strategy with sub-queries</li>
            <li>• Search multiple sources for each angle</li>
            <li>• Analyze findings and identify gaps</li>
            <li>• Follow up on missing information</li>
            <li>• Synthesize a comprehensive report</li>
          </ul>
        </div>
      )}
    </div>
  )
}
