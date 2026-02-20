import { ipcRenderer, contextBridge } from 'electron';
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Settings
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
        selectDownloadFolder: () => ipcRenderer.invoke('settings:selectDownloadFolder'),
        selectMemoryBankFolder: () => ipcRenderer.invoke('settings:selectMemoryBankFolder')
    },
    // Browser Automation
    browser: {
        navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
        click: (selector) => ipcRenderer.invoke('browser:click', selector),
        type: (selector, text) => ipcRenderer.invoke('browser:type', selector, text),
        getText: (selector) => ipcRenderer.invoke('browser:getText', selector),
        getHtml: () => ipcRenderer.invoke('browser:getHtml'),
        screenshot: (options) => ipcRenderer.invoke('browser:screenshot', options),
        scroll: (direction) => ipcRenderer.invoke('browser:scroll', direction),
        findElements: (selector) => ipcRenderer.invoke('browser:findElements', selector),
        evaluate: (script) => ipcRenderer.invoke('browser:evaluate', script),
        close: () => ipcRenderer.invoke('browser:close'),
        reopen: () => ipcRenderer.invoke('browser:reopen')
    },
    // Memory Bank
    memory: {
        add: (type, content, metadata) => ipcRenderer.invoke('memory:add', type, content, metadata),
        search: (query, limit) => ipcRenderer.invoke('memory:search', query, limit),
        getRecent: (limit) => ipcRenderer.invoke('memory:getRecent', limit),
        delete: (id) => ipcRenderer.invoke('memory:delete', id),
        clear: () => ipcRenderer.invoke('memory:clear'),
        getStats: () => ipcRenderer.invoke('memory:getStats')
    },
    // Shell
    shell: {
        openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
    },
    // Download
    download: {
        getFolder: () => ipcRenderer.invoke('download:getFolder')
    }
});
