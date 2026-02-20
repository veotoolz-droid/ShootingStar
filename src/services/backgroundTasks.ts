/**
 * Background Task Service
 * Manages async research jobs
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'research' | 'search' | 'council' | 'browse';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  query?: string;
  options?: any;
}

export interface TaskQueue {
  tasks: BackgroundTask[];
  maxConcurrent: number;
}

class BackgroundTaskService {
  private tasks: Map<string, BackgroundTask> = new Map();
  private queue: string[] = [];
  private running: Set<string> = new Set();
  private maxConcurrent: number = 2;
  private listeners: Array<(task: BackgroundTask) => void> = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.startProcessing();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('comet-background-tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.tasks = new Map(Object.entries(parsed.tasks || {}));
        this.queue = parsed.queue || [];
      }
    } catch (error) {
      console.error('Failed to load background tasks:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const obj = {
        tasks: Object.fromEntries(this.tasks),
        queue: this.queue,
      };
      localStorage.setItem('comet-background-tasks', JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save background tasks:', error);
    }
  }

  private startProcessing(): void {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const taskId = this.queue.shift();
    if (!taskId) return;

    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending') return;

    this.running.add(taskId);
    task.status = 'running';
    task.startedAt = Date.now();
    this.tasks.set(taskId, task);
    this.saveToStorage();
    this.notifyListeners(task);

    try {
      // Execute task based on type
      const result = await this.executeTask(task);
      
      task.status = 'completed';
      task.result = result;
      task.progress = 100;
      task.completedAt = Date.now();
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = Date.now();
    } finally {
      this.running.delete(taskId);
      this.tasks.set(taskId, task);
      this.saveToStorage();
      this.notifyListeners(task);
    }
  }

  private async executeTask(task: BackgroundTask): Promise<any> {
    // This would integrate with actual search/research services
    switch (task.type) {
      case 'research':
        // Simulate deep research
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          task.progress = i * 10;
          this.updateTask(task);
        }
        return { findings: 'Research completed', sources: [] };
      
      case 'search':
        // Simulate search
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { results: 'Search completed' };
      
      case 'council':
        // Simulate model council
        await new Promise(resolve => setTimeout(resolve, 5000));
        return { consensus: 'Models agree' };
      
      default:
        return {};
    }
  }

  createTask(
    type: TaskType,
    title: string,
    description: string,
    query?: string,
    options?: any
  ): BackgroundTask {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: BackgroundTask = {
      id,
      type,
      title,
      description,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      query,
      options,
    };

    this.tasks.set(id, task);
    this.queue.push(id);
    this.saveToStorage();
    this.notifyListeners(task);

    return task;
  }

  updateTask(task: BackgroundTask): void {
    this.tasks.set(task.id, task);
    this.saveToStorage();
    this.notifyListeners(task);
  }

  cancelTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    // Remove from queue if pending
    const queueIndex = this.queue.indexOf(id);
    if (queueIndex > -1) {
      this.queue.splice(queueIndex, 1);
    }

    // Cancel if running
    if (task.status === 'running') {
      task.status = 'cancelled';
      task.completedAt = Date.now();
      this.tasks.set(id, task);
      this.running.delete(id);
    }

    this.saveToStorage();
    this.notifyListeners(task);
    return true;
  }

  deleteTask(id: string): boolean {
    this.cancelTask(id);
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getTask(id: string): BackgroundTask | null {
    return this.tasks.get(id) || null;
  }

  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => 
      b.createdAt - a.createdAt
    );
  }

  getTasksByStatus(status: TaskStatus): BackgroundTask[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  getPendingTasks(): BackgroundTask[] {
    return this.getTasksByStatus('pending');
  }

  getRunningTasks(): BackgroundTask[] {
    return this.getTasksByStatus('running');
  }

  getCompletedTasks(): BackgroundTask[] {
    return this.getAllTasks().filter(task => 
      task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
    );
  }

  clearCompleted(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.tasks.delete(id);
      }
    }
    this.saveToStorage();
  }

  onTaskUpdate(listener: (task: BackgroundTask) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(task: BackgroundTask): void {
    this.listeners.forEach(listener => listener(task));
  }

  destroy(): void {
    this.stopProcessing();
    this.listeners = [];
  }
}

// Singleton instance
let taskServiceInstance: BackgroundTaskService | null = null;

export function getBackgroundTaskService(): BackgroundTaskService {
  if (!taskServiceInstance) {
    taskServiceInstance = new BackgroundTaskService();
  }
  return taskServiceInstance;
}

export function resetBackgroundTaskService(): void {
  taskServiceInstance?.destroy();
  taskServiceInstance = null;
}

export default BackgroundTaskService;
