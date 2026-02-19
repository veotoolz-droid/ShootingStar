/** @jsxImportSource react */
import { useState, useCallback, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Download,
  Trash2,
  X,
  Pause,
  RotateCcw,
  Bell,
  BellOff
} from 'lucide-react'

export type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'error' | 'cancelled'

export interface BackgroundTask {
  id: string
  type: 'research' | 'search' | 'analysis' | 'crawl'
  title: string
  description: string
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  query?: string
  settings?: Record<string, any>
}

interface TaskQueueProps {
  tasks: BackgroundTask[]
  onTaskClick?: (task: BackgroundTask) => void
  onTaskCancel?: (taskId: string) => void
  onTaskDelete?: (taskId: string) => void
  onTaskRetry?: (task: BackgroundTask) => void
  showNotifications?: boolean
  onToggleNotifications?: () => void
}

const STATUS_ICONS: Record<TaskStatus, typeof Clock> = {
  queued: Clock,
  running: Loader2,
  paused: Pause,
  completed: CheckCircle2,
  error: AlertCircle,
  cancelled: X,
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  queued: 'text-muted-foreground',
  running: 'text-blue-500',
  paused: 'text-amber-500',
  completed: 'text-emerald-500',
  error: 'text-red-500',
  cancelled: 'text-muted-foreground',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  error: 'Error',
  cancelled: 'Cancelled',
}

export function TaskQueue({ 
  tasks, 
  onTaskClick, 
  onTaskCancel, 
  onTaskDelete, 
  onTaskRetry,
  showNotifications = true,
  onToggleNotifications
}: TaskQueueProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const filteredTasks = tasks.filter(task => 
    filter === 'all' || task.status === filter
  )

  const runningCount = tasks.filter(t => t.status === 'running').length
  const queuedCount = tasks.filter(t => t.status === 'queued').length
  const completedCount = tasks.filter(t => t.status === 'completed').length

  const formatDuration = (task: BackgroundTask) => {
    const end = task.completedAt || Date.now()
    const start = task.startedAt || task.createdAt
    const ms = end - start
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            <h3 className="font-semibold">Background Tasks</h3>
            {(runningCount > 0 || queuedCount > 0) && (
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-600 text-xs rounded-full">
                {runningCount > 0 && `${runningCount} running`}
                {runningCount > 0 && queuedCount > 0 && ', '}
                {queuedCount > 0 && `${queuedCount} queued`}
              </span>
            )}
          </div>
          
          {onToggleNotifications && (
            <button
              onClick={onToggleNotifications}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title={showNotifications ? 'Disable notifications' : 'Enable notifications'}
            >
              {showNotifications ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`p-2 rounded-lg text-center text-xs transition-colors ${
              filter === 'all' ? 'bg-violet-500/20 text-violet-600' : 'bg-secondary'
            }`}
          >
            <div className="font-semibold">{tasks.length}</div>
            <div className="text-muted-foreground">All</div>
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`p-2 rounded-lg text-center text-xs transition-colors ${
              filter === 'running' ? 'bg-blue-500/20 text-blue-600' : 'bg-secondary'
            }`}
          >
            <div className="font-semibold">{runningCount}</div>
            <div className="text-muted-foreground">Running</div>
          </button>
          <button
            onClick={() => setFilter('queued')}
            className={`p-2 rounded-lg text-center text-xs transition-colors ${
              filter === 'queued' ? 'bg-amber-500/20 text-amber-600' : 'bg-secondary'
            }`}
          >
            <div className="font-semibold">{queuedCount}</div>
            <div className="text-muted-foreground">Queued</div>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`p-2 rounded-lg text-center text-xs transition-colors ${
              filter === 'completed' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-secondary'
            }`}
          >
            <div className="font-semibold">{completedCount}</div>
            <div className="text-muted-foreground">Done</div>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks {filter !== 'all' && `with status "${filter}"`}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const Icon = STATUS_ICONS[task.status]
              const isExpanded = expandedTasks.has(task.id)
              
              return (
                <div
                  key={task.id}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    task.status === 'running' ? 'border-blue-500/30 bg-blue-500/5' :
                    task.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                    task.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' :
                    'border-border'
                  }`}
                >
                  <div
                    onClick={() => onTaskClick?.(task)}
                    className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${STATUS_COLORS[task.status]}`}>
                        <Icon className={`w-4 h-4 ${task.status === 'running' ? 'animate-spin' : ''}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{task.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            task.status === 'running' ? 'bg-blue-500/20 text-blue-600' :
                            task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-600' :
                            task.status === 'error' ? 'bg-red-500/20 text-red-600' :
                            'bg-secondary text-muted-foreground'
                          }`}>
                            {STATUS_LABELS[task.status]}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{formatTime(task.createdAt)}</span>
                          {(task.status === 'running' || task.status === 'completed' || task.status === 'error') && (
                            <span>{formatDuration(task)}</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {(task.status === 'running' || task.status === 'queued') && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-violet-500 transition-all duration-500"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                              <span>{task.progress}%</span>
                              <span>
                                {task.status === 'queued' && `Position: ${tasks.filter(t => t.status === 'queued').findIndex(t => t.id === task.id) + 1}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {task.status === 'running' && onTaskCancel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onTaskCancel(task.id)
                            }}
                            className="p-1.5 hover:bg-secondary rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        {(task.status === 'error' || task.status === 'cancelled') && onTaskRetry && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onTaskRetry(task)
                            }}
                            className="p-1.5 hover:bg-secondary rounded transition-colors"
                            title="Retry"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        {task.status === 'completed' && task.result && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(task.id)
                            }}
                            className="p-1.5 hover:bg-secondary rounded transition-colors"
                            title="View result"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        
                        {(task.status === 'completed' || task.status === 'error' || task.status === 'cancelled') && onTaskDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onTaskDelete(task.id)
                            }}
                            className="p-1.5 hover:bg-secondary rounded transition-colors text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Result */}
                  {isExpanded && task.result && (
                    <div className="px-3 pb-3">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <pre className="text-xs whitespace-pre-wrap font-sans">
                          {typeof task.result === 'string' 
                            ? task.result 
                            : JSON.stringify(task.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {task.error && (
                    <div className="px-3 pb-3">
                      <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-xs">
                        {task.error}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for task management
export function useTaskQueue() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([])
  const [showNotifications, setShowNotifications] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load tasks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('comet-task-queue')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTasks(parsed.map((t: BackgroundTask) => ({
          ...t,
          // Reset running tasks to queued on reload
          status: t.status === 'running' ? 'queued' : t.status
        })))
      } catch {
        console.error('Failed to load task queue')
      }
    }
  }, [])

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('comet-task-queue', JSON.stringify(tasks))
  }, [tasks])

  const addTask = useCallback((task: Omit<BackgroundTask, 'id' | 'createdAt' | 'status' | 'progress'>) => {
    const newTask: BackgroundTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      status: 'queued',
      progress: 0
    }
    
    setTasks(prev => [...prev, newTask])
    return newTask.id
  }, [])

  const updateTask = useCallback((taskId: string, updates: Partial<BackgroundTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ))
  }, [])

  const cancelTask = useCallback((taskId: string) => {
    updateTask(taskId, { status: 'cancelled', completedAt: Date.now() })
  }, [updateTask])

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])

  const retryTask = useCallback((task: BackgroundTask) => {
    const newTask: BackgroundTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      startedAt: undefined,
      completedAt: undefined,
      error: undefined,
      result: undefined
    }
    setTasks(prev => [...prev, newTask])
    return newTask.id
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(task => 
      task.status !== 'completed' && task.status !== 'cancelled'
    ))
  }, [])

  // Process queue
  useEffect(() => {
    if (isProcessing) return
    
    const queuedTask = tasks.find(t => t.status === 'queued')
    if (!queuedTask) return

    setIsProcessing(true)
    updateTask(queuedTask.id, { 
      status: 'running', 
      startedAt: Date.now(),
      progress: 10
    })

    // Simulate task processing - in real implementation, this would call the actual task executor
    const processTask = async () => {
      try {
        // Progress updates
        for (let progress = 20; progress <= 90; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          updateTask(queuedTask.id, { progress })
        }

        // Complete
        updateTask(queuedTask.id, { 
          status: 'completed', 
          progress: 100,
          completedAt: Date.now(),
          result: { message: 'Task completed successfully', timestamp: Date.now() }
        })

        // Show notification
        if (showNotifications && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Comet Search', {
            body: `Task completed: ${queuedTask.title}`,
            icon: '/favicon.ico'
          })
        }
      } catch (error) {
        updateTask(queuedTask.id, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Task failed',
          completedAt: Date.now()
        })
      } finally {
        setIsProcessing(false)
      }
    }

    processTask()
  }, [tasks, isProcessing, updateTask, showNotifications])

  // Request notification permission
  useEffect(() => {
    if (showNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [showNotifications])

  return {
    tasks,
    addTask,
    updateTask,
    cancelTask,
    deleteTask,
    retryTask,
    clearCompleted,
    showNotifications,
    setShowNotifications,
    runningCount: tasks.filter(t => t.status === 'running').length,
    queuedCount: tasks.filter(t => t.status === 'queued').length,
    completedCount: tasks.filter(t => t.status === 'completed').length,
  }
}
