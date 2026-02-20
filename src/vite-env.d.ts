/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        browser: {
            navigate: (url: string) => Promise<void>;
            click: (selector: string) => Promise<void>;
            type: (selector: string, text: string) => Promise<void>;
            screenshot: (options: { fullPage: boolean }) => Promise<string>;
            scroll: (direction: 'up' | 'down' | 'top' | 'bottom') => Promise<void>;
        };
        settings: {
            get: (key?: string) => Promise<any>;
            set: (key: string, value: any) => Promise<void>;
            selectMemoryBankFolder: () => Promise<string | undefined>;
            selectDownloadFolder: () => Promise<string | undefined>;
        };
        memory: {
            getStats: () => Promise<{ total: number; conversations: number; searches: number }>;
            add: (type: string, content: string, metadata?: any) => Promise<void>;
            getRecent: (count: number) => Promise<any[]>;
        };
    };
}
