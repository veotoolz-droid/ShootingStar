# 🌠 ShootingStar / Comet Search

> An AI-native search browser with agentic capabilities, local-first architecture, and multi-model intelligence.

[![Electron](https://img.shields.io/badge/Electron-34.2.0-47848F?logo=electron)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.50.1-2EAD33?logo=playwright)](https://playwright.dev/)

![Comet Search Screenshot](./screenshots/hero.png)

---

## ✨ Features

### 🔍 **AI-Powered Search**
- **Real Web Search** - Brave Search API integration with live results
- **Multiple Search Modes:**
  - ⚡ **Quick** - Fast answers from 1-2 sources
  - 📚 **Standard** - Balanced depth with 5 sources
  - 🔬 **Deep Research** - Comprehensive analysis from 10+ sources
  - 🧠 **Reasoning** - Step-by-step analytical answers

### 🤖 **Agentic Browsing** (Electron)
- **Playwright-powered browser automation**
- Navigate, click, type, extract data from any website
- Screenshot capture and page analysis
- Form filling and automated workflows

### 🧠 **Memory Bank** (Vector Storage)
- **Local ChromaDB** - All data stays on your machine
- **Semantic search** across past conversations
- **Local embeddings** using Xenova transformers
- **Persistent storage** with configurable location

### 📑 **Multi-Tab Workspace**
- Browser-like tab management
- 4 tab types: Search, Browser, Research, Council
- Tab persistence across sessions
- Background task indicators

### 🔬 **Deep Research Mode**
- AI plans research strategy
- Automatic sub-query generation
- Iterative search with gap analysis
- Comprehensive report synthesis
- Progress tracking and downloadable reports

### ⚡ **Model Council**
- Run 2-3 AI models in parallel
- Compare outputs side-by-side
- Consensus analysis with agreement detection
- Voting system for best answer
- Support for Kimi API + Local LLMs

### 📋 **Background Tasks**
- Async job queue for long-running research
- Progress notifications
- Task persistence and recovery
- Queue management with pause/resume

---

## 📸 Screenshots

### Search Interface
![Search](./screenshots/search.png)
*Main search interface with mode selection*

### Deep Research
![Deep Research](./screenshots/deep-research.png)
*Iterative research with automatic follow-up queries*

### Model Council
![Model Council](./screenshots/model-council.png)
*Multi-model comparison with consensus analysis*

### Tab Workspace
![Tabs](./screenshots/tabs.png)
*Multi-tab workspace with different tab types*

### Settings
![Settings](./screenshots/settings.png)
*Provider configuration and folder settings*

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org)
- **Git** - [Download](https://git-scm.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/veotoolz-droid/ShootingStar.git
cd ShootingStar

# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

### First-Time Setup

1. **Get API Keys:**
   - **Brave Search** (free): https://brave.com/search/api/
   - **Kimi API** (optional): https://platform.moonshot.cn/

2. **Configure in Settings:**
   - Click the ⚙️ gear icon
   - Add your Brave API key (required)
   - Add Kimi API key (optional, for cloud mode)
   - Select download and memory bank folders

3. **Choose Provider Mode:**
   - 🏠 **Local Only** - Uses LM Studio/Ollama (100% free, private)
   - ☁️ **Kimi API** - Uses Moonshot cloud API
   - 🔄 **Hybrid** - Smart switching (local for quick, cloud for deep)

---

## 🖥️ Usage Guide

### Basic Search
1. Type your query in the search box
2. Select search mode (Quick/Standard/Deep/Reasoning)
3. Press Enter or click Search
4. View AI-generated answer with cited sources

### Deep Research
1. Switch to **Deep** mode
2. Enter a complex research topic
3. AI will:
   - Generate research plan
   - Execute multiple searches
   - Identify knowledge gaps
   - Follow up automatically
   - Synthesize comprehensive report
4. Download report as Markdown

### Model Council
1. Click **Council** tab or button
2. Select 2-3 models to compare
3. Enter your question
4. View side-by-side responses
5. See consensus analysis
6. Vote for the best answer

### Browser Automation
1. Open a **Browser** tab
2. Enter URL to navigate
3. Use controls to:
   - Click elements
   - Fill forms
   - Extract data
   - Take screenshots
4. AI can automate tasks via natural language

### Background Tasks
1. Start a long research query
2. Click **Run in Background**
3. Continue using other tabs
4. Get notified when complete
5. View results in Task Queue panel

---

## ⚙️ Configuration

### Environment Variables
Create `.env` file in project root:

```env
# Required
VITE_BRAVE_API_KEY=your_brave_api_key

# Optional (for cloud mode)
VITE_KIMI_API_KEY=your_kimi_api_key

# Optional (custom endpoints)
VITE_LOCAL_LLM_URL=http://localhost:1234/v1/chat/completions
```

### Local LLM Setup (Free)

1. **Download LM Studio:** https://lmstudio.ai
2. **Download a model:**
   - Qwen 2.5 14B (recommended)
   - Llama 3.1 8B (faster)
   - DeepSeek-R1 14B (reasoning)
3. **Start server:**
   - Load model in LM Studio
   - Go to Developer tab
   - Start server on port 1234
   - Enable CORS
4. **Select "Local" in Comet Settings**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  React UI   │  │  Browser    │  │  Settings/Config│ │
│  │  (Renderer) │  │  (Playwright)│  │  (Electron Store)│ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────┘ │
│         │                │                              │
│         ▼                ▼                              │
│  ┌─────────────────────────────────┐                   │
│  │      Main Process (Node.js)     │                   │
│  │  ┌──────────┐  ┌──────────────┐ │                   │
│  │  │ChromaDB  │  │Memory Bank   │ │                   │
│  │  │(Vectors) │  │(Embeddings)  │ │                   │
│  │  └──────────┘  └──────────────┘ │                   │
│  └─────────────────────────────────┘                   │
│         │                                               │
│         ▼                                               │
│  ┌─────────────────────────────────┐                   │
│  │   External APIs                 │                   │
│  │   - Brave Search                │                   │
│  │   - Kimi/Moonshot API           │                   │
│  │   - Local LLM (LM Studio)       │                   │
│  └─────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Web dev server
npm run electron:dev     # Electron dev mode

# Building
npm run build            # Build web app
npm run electron:build   # Build Electron app

# Production
npm run electron:preview # Preview production build
```

### Project Structure

```
comet-search/
├── electron/              # Electron main process
│   ├── main.ts           # Main entry point
│   ├── preload.ts        # Preload script (IPC)
│   ├── browser.ts        # Playwright automation
│   └── memory.ts         # ChromaDB integration
├── src/
│   ├── components/       # React components
│   │   ├── TabManager.tsx
│   │   ├── DeepResearch.tsx
│   │   ├── ModelCouncil.tsx
│   │   └── TaskQueue.tsx
│   ├── services/         # Business logic
│   │   ├── search.ts
│   │   ├── deepResearch.ts
│   │   ├── modelCouncil.ts
│   │   ├── backgroundTasks.ts
│   │   └── tabManager.ts
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Main app component
├── dist/                 # Web build output
├── dist-electron/        # Electron build output
└── release/              # Packaged apps
```

---

## 🔒 Privacy & Security

- **Local-first**: All embeddings and memory stored locally
- **No telemetry**: No data sent to developers
- **API keys**: Stored in Electron's secure store
- **Optional cloud**: Can run 100% offline with local LLM
- **Browser isolation**: Playwright runs in sandboxed context

---

## 🐛 Troubleshooting

### Common Issues

**Build fails with "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**ChromaDB errors**
- Ensure memory bank folder has write permissions
- Check disk space (embeddings use ~100MB per 1000 items)

**Playwright browser won't start**
```bash
npx playwright install chromium
```

**Local LLM connection failed**
- Verify LM Studio is running on port 1234
- Check CORS is enabled in LM Studio settings
- Test with: `curl http://localhost:1234/v1/models`

**Kimi API errors**
- Verify API key is correct
- Check internet connection
- Review rate limits on Moonshot dashboard

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- [Perplexity](https://perplexity.ai) - Design inspiration
- [Brave Search](https://brave.com/search/api/) - Search API
- [Moonshot AI](https://moonshot.cn) - Kimi API
- [ChromaDB](https://chromadb.dev) - Vector database
- [Playwright](https://playwright.dev) - Browser automation
- [Xenova](https://xenova.ai) - Local embeddings

---

## 📧 Support

- Issues: [GitHub Issues](https://github.com/veotoolz-droid/ShootingStar/issues)
- Discussions: [GitHub Discussions](https://github.com/veotoolz-droid/ShootingStar/discussions)

---

<p align="center">
  Made with 💜 by the ShootingStar team
</p>
