import { ipcRenderer, contextBridge } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    selectDownloadFolder: () => ipcRenderer.invoke('settings:selectDownloadFolder'),
    selectMemoryBankFolder: () => ipcRenderer.invoke('settings:selectMemoryBankFolder')
  },

  // Browser Automation
  browser: {
    navigate: (url: string) => ipcRenderer.invoke('browser:navigate', url),
    click: (selector: string) => ipcRenderer.invoke('browser:click', selector),
    type: (selector: string, text: string) => ipcRenderer.invoke('browser:type', selector, text),
    getText: (selector?: string) => ipcRenderer.invoke('browser:getText', selector),
    getHtml: () => ipcRenderer.invoke('browser:getHtml'),
    screenshot: (options?: { path?: string; fullPage?: boolean }) => ipcRenderer.invoke('browser:screenshot', options),
    scroll: (direction: 'up' | 'down' | 'top' | 'bottom') => ipcRenderer.invoke('browser:scroll', direction),
    findElements: (selector: string) => ipcRenderer.invoke('browser:findElements', selector),
    evaluate: (script: string) => ipcRenderer.invoke('browser:evaluate', script),
    close: () => ipcRenderer.invoke('browser:close'),
    reopen: () => ipcRenderer.invoke('browser:reopen')
  },

  // Memory Bank
  memory: {
    add: (type: 'conversation' | 'search', content: string, metadata?: Record<string, any>) => 
      ipcRenderer.invoke('memory:add', type, content, metadata),
    search: (query: string, limit?: number) => ipcRenderer.invoke('memory:search', query, limit),
    getRecent: (limit?: number) => ipcRenderer.invoke('memory:getRecent', limit),
    delete: (id: string) => ipcRenderer.invoke('memory:delete', id),
    clear: () => ipcRenderer.invoke('memory:clear'),
    getStats: () => ipcRenderer.invoke('memory:getStats')
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },

  // Download
  download: {
    getFolder: () => ipcRenderer.invoke('download:getFolder')
  }
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      settings: {
        get: () => Promise<any>
        set: (key: string, value: any) => Promise<boolean>
        selectDownloadFolder: () => Promise<string | null>
        selectMemoryBankFolder: () => Promise<string | null>
      }
      browser: {
        navigate: (url: string) => Promise<void>
        click: (selector: string) => Promise<void>
        type: (selector: string, text: string) => Promise<void>
        getText: (selector?: string) => Promise<string>
        getHtml: () => Promise<string>
        screenshot: (options?: { path?: string; fullPage?: boolean }) => Promise<string>
        scroll: (direction: 'up' | 'down' | 'top' | 'bottom') => Promise<void>
        findElements: (selector: string) => Promise<Array<{ tag: string; text: string; attributes: Record<string, string> }>>
        evaluate: (script: string) => Promise<any>
        close: () => Promise<boolean>
        reopen: () => Promise<boolean>
      }
      memory: {
        add: (type: 'conversation' | 'search', content: string, metadata?: Record<string, any>) => Promise<string | null>
        search: (query: string, limit?: number) => Promise<Array<{ id: string; content: string; score: number; metadata: any }>>
        getRecent: (limit?: number) => Promise<Array<{ id: string; content: string; timestamp: number; type: string }>>
        delete: (id: string) => Promise<boolean>
        clear: () => Promise<boolean>
        getStats: () => Promise<{ total: number; conversations: number; searches: number }>
      }
      shell: {
        openExternal: (url: string) => Promise<void>
      }
      download: {
        getFolder: () => Promise<string>
      }
    }
  }
}