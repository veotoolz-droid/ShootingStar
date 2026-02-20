import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'
import { PlaywrightBrowser } from './browser.js'
import { MemoryBank } from './memory.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize electron store for settings
const store = new Store<{
  downloadFolder: string
  memoryBankFolder: string
  memoryEnabled: boolean
  memoryMaxItems: number
  braveApiKey: string
  kimiApiKey: string
  providerMode: 'local' | 'kimi' | 'hybrid'
  searchMode: 'quick' | 'deep' | 'reasoning'
}>({
  defaults: {
    downloadFolder: path.join(app.getPath('downloads'), 'comet-search'),
    memoryBankFolder: path.join(app.getPath('userData'), 'memory-bank'),
    memoryEnabled: true,
    memoryMaxItems: 1000,
    braveApiKey: '',
    kimiApiKey: '',
    providerMode: 'hybrid',
    searchMode: 'quick'
  }
})

// Initialize browser automation and memory
let browser: PlaywrightBrowser | null = null
let memory: MemoryBank | null = null

async function initializeServices() {
  browser = new PlaywrightBrowser()
  
  const memoryFolder = store.get('memoryBankFolder')
  memory = new MemoryBank(memoryFolder)
  await memory.initialize()
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  return mainWindow
}

// App event handlers
app.whenReady().then(async () => {
  await initializeServices()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  if (browser) {
    await browser.close()
  }
  if (memory) {
    await memory.close()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers for Settings
ipcMain.handle('settings:get', () => {
  return {
    downloadFolder: store.get('downloadFolder'),
    memoryBankFolder: store.get('memoryBankFolder'),
    memoryEnabled: store.get('memoryEnabled'),
    memoryMaxItems: store.get('memoryMaxItems'),
    braveApiKey: store.get('braveApiKey'),
    kimiApiKey: store.get('kimiApiKey'),
    providerMode: store.get('providerMode'),
    searchMode: store.get('searchMode')
  }
})

ipcMain.handle('settings:set', (_, key: string, value: any) => {
  store.set(key as any, value)
  return true
})

ipcMain.handle('settings:selectDownloadFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    defaultPath: store.get('downloadFolder')
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    const folder = result.filePaths[0]
    store.set('downloadFolder', folder)
    return folder
  }
  return null
})

ipcMain.handle('settings:selectMemoryBankFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    defaultPath: store.get('memoryBankFolder')
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    const folder = result.filePaths[0]
    store.set('memoryBankFolder', folder)
    
    // Reinitialize memory with new folder
    if (memory) {
      await memory.close()
    }
    memory = new MemoryBank(folder)
    await memory.initialize()
    
    return folder
  }
  return null
})

// IPC Handlers for Browser Automation
ipcMain.handle('browser:navigate', async (_, url: string) => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.navigate(url)
})

ipcMain.handle('browser:click', async (_, selector: string) => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.click(selector)
})

ipcMain.handle('browser:type', async (_, selector: string, text: string) => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.type(selector, text)
})

ipcMain.handle('browser:getText', async (_, selector?: string) => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.getText(selector)
})

ipcMain.handle('browser:getHtml', async () => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.getHtml()
})

ipcMain.handle('browser:screenshot', async (_, options?: { path?: string; fullPage?: boolean }) => {
  if (!browser) throw new Error('Browser not initialized')
  const downloadFolder = store.get('downloadFolder')
  return await browser.screenshot({
    ...options,
    path: options?.path ? path.join(downloadFolder, options.path) : undefined
  })
})

ipcMain.handle('browser:scroll', async (_, direction: 'up' | 'down' | 'top' | 'bottom') => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.scroll(direction)
})

ipcMain.handle('browser:findElements', async (_, selector: string) => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.findElements(selector)
})

ipcMain.handle('browser:evaluate', async (_, script: string) => {
  if (!browser) throw new Error('Browser not initialized')
  return await browser.evaluate(script)
})

ipcMain.handle('browser:close', async () => {
  if (browser) {
    await browser.close()
    browser = null
  }
  return true
})

ipcMain.handle('browser:reopen', async () => {
  if (browser) {
    await browser.close()
  }
  browser = new PlaywrightBrowser()
  return true
})

// IPC Handlers for Memory Bank
ipcMain.handle('memory:add', async (_, type: 'conversation' | 'search', content: string, metadata?: Record<string, any>) => {
  if (!memory) throw new Error('Memory not initialized')
  if (!store.get('memoryEnabled')) return null
  return await memory.add(type, content, metadata)
})

ipcMain.handle('memory:search', async (_, query: string, limit?: number) => {
  if (!memory) throw new Error('Memory not initialized')
  if (!store.get('memoryEnabled')) return []
  return await memory.search(query, limit)
})

ipcMain.handle('memory:getRecent', async (_, limit?: number) => {
  if (!memory) throw new Error('Memory not initialized')
  return await memory.getRecent(limit)
})

ipcMain.handle('memory:delete', async (_, id: string) => {
  if (!memory) throw new Error('Memory not initialized')
  return await memory.delete(id)
})

ipcMain.handle('memory:clear', async () => {
  if (!memory) throw new Error('Memory not initialized')
  return await memory.clear()
})

ipcMain.handle('memory:getStats', async () => {
  if (!memory) throw new Error('Memory not initialized')
  return await memory.getStats()
})

// External link handler
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  await shell.openExternal(url)
})

// Download handler
ipcMain.handle('download:getFolder', () => {
  return store.get('downloadFolder')
})