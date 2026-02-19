# Comet Search v1.0 - Phase 1 Complete

A Perplexity-style AI search interface with real web search, multiple AI providers (Local LLM + Kimi API), and intelligent search modes.

## ✅ Phase 1 Features Implemented

### 🔍 Real Web Search
- **Brave Search API integration** — Live web results with real URLs
- **Source enrichment** — Fetches and extracts content from actual webpages
- **Real citations** — Every answer cites genuine sources with working links

### 🧠 Three Search Modes
| Mode | Description | Sources | Best For |
|------|-------------|---------|----------|
| **Quick** | Fast answers from 1-2 sources | 3 | Simple facts, quick lookups |
| **Deep** | Comprehensive research | 10 | Complex topics, thorough analysis |
| **Reasoning** | Step-by-step analysis | 5 | Problem-solving, comparisons |

### 🤖 Triple Provider System

#### 1. **100% Local** 
- Uses your local LLM (LM Studio, Ollama, etc.)
- Completely private — no data leaves your machine
- Best for: Privacy-sensitive queries

#### 2. **100% Kimi API**
- Uses Moonshot's Kimi K2 model
- Superior reasoning and longer context
- Best for: Complex research, coding questions

#### 3. **Hybrid** (Smart Routing)
- **Quick mode** → Local LLM (fast, private)
- **Deep/Reasoning** → Kimi API (better quality)
- Best for: Balancing speed, cost, and quality

### 🔐 API Key Management
- Brave Search API key (required for web search)
- Kimi API key (optional, for cloud features)
- Secure localStorage with user consent

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Brave Search API key (free tier available)
- (Optional) Kimi API key for cloud features
- (Optional) Local LLM via LM Studio/Ollama

### 1. Get API Keys

**Brave Search API** (Required):
1. Go to [brave.com/search/api](https://brave.com/search/api)
2. Sign up for free tier (2000 queries/month)
3. Copy your API key

**Kimi API** (Optional):
1. Go to [platform.moonshot.cn](https://platform.moonshot.cn/)
2. Create account and generate API key

### 2. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Configure Settings

1. Click the **Settings** (gear) icon
2. Enter your **Brave Search API key**
3. Choose your **Provider Mode**:
   - **Local Only**: Uses your local LLM
   - **Kimi API**: Uses Moonshot's API
   - **Hybrid**: Smart routing between both
4. If using Local/Hybrid, ensure LM Studio is running on port 1234

---

## 📁 Project Structure

```
comet-search/
├── src/
│   ├── App.tsx              # Main application
│   ├── services/
│   │   └── search.ts        # Search logic, Brave API, Kimi integration
│   ├── hooks/
│   │   ├── useStreamingSearch.ts
│   │   ├── useSearchHistory.ts
│   │   └── useTheme.ts
│   ├── main.tsx
│   └── index.css
├── package.json
└── README.md
```

---

## 🎯 How It Works

### Search Flow
1. User enters query + selects mode
2. **Brave Search API** fetches real web results
3. Top results are **enriched** with full page content
4. **Provider selector** chooses Local LLM or Kimi based on mode
5. LLM generates **cited answer** using real sources
6. Results stream in real-time

### Provider Selection Logic (Hybrid Mode)
```
Quick query → Local LLM (fast, free)
Deep research → Kimi API (better synthesis)
Reasoning task → Kimi API (step-by-step logic)
```

---

## 🛣️ Roadmap

### ✅ Phase 1: Core Search (COMPLETE)
- [x] Real web search (Brave API)
- [x] Three search modes (Quick/Deep/Reasoning)
- [x] Kimi API integration
- [x] Provider mode switcher (Local/Kimi/Hybrid)
- [x] Real citations from live sources

### 🔄 Phase 2: Agentic Browser
- [ ] Electron app with real browser tabs
- [ ] Playwright browser automation
- [ ] Tab context awareness
- [ ] Multi-step task execution

### 🔄 Phase 3: Deep Research
- [ ] Iterative search loops
- [ ] Multi-source synthesis
- [ ] Report generation (PDF/Markdown)
- [ ] Background task queue

### 🔄 Phase 4: Intelligence
- [ ] Local vector DB for memory
- [ ] Model Council (multiple local models)
- [ ] BrowseSafe security layer
- [ ] Cross-session personalization

---

## 🔒 Privacy

- **Local mode**: Zero data leaves your machine
- **Hybrid mode**: Only Deep/Reasoning queries go to Kimi
- **API keys**: Stored locally in your browser
- **Search history**: Stored locally, never uploaded

---

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Brave Search API
- Kimi API (Moonshot)
- Lucide Icons

---

## 📝 License

MIT License — feel free to use for personal or commercial projects.

---

## 🙏 Acknowledgments

- Design inspired by [Perplexity AI](https://perplexity.ai)
- Icons by [Lucide](https://lucide.dev)
- Search powered by [Brave Search API](https://brave.com/search/api/)
- Cloud AI by [Moonshot Kimi](https://platform.moonshot.cn/)
