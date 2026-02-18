# Comet Search

A Perplexity-style AI search interface built with React, TypeScript, and Tailwind CSS.

![Comet Search Screenshot](./screenshot.png)

## Features

- 🔍 **AI-Powered Search** - Natural language queries with intelligent responses
- 📚 **Cited Sources** - Every answer includes verifiable sources
- 💫 **Streaming Text** - Real-time response generation effect
- 🌓 **Dark/Light Mode** - Automatic theme switching with persistence
- 📜 **Search History** - Local storage of recent searches
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance
- 🤖 **Multiple AI Providers** - Support for LM Studio, OpenAI, and custom APIs

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/comet-search.git
cd comet-search

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## AI Provider Setup

### Option 1: Mock Mode (Default)
No setup required. Uses pre-written responses for demo purposes.

### Option 2: LM Studio (Recommended for Local)

**Best models for this project:**

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **Qwen 2.5 Instruct** | 7B-14B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Best overall balance |
| **Llama 3.1 Instruct** | 8B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Fast, general queries |
| **Mistral Nemo Instruct** | 12B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Complex reasoning |
| **Phi-4 Instruct** | 14B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Microsoft's best |

**Setup steps:**

1. Download [LM Studio](https://lmstudio.ai)
2. Download one of the recommended models above from HuggingFace
3. Load the model in LM Studio
4. Go to **Developer** tab → Start server on port 1234
5. Enable **CORS** in server settings
6. Select "LM Studio" in Comet Search settings

### Option 3: OpenAI

1. Get an API key from [OpenAI](https://platform.openai.com)
2. Select "OpenAI" in Comet Search settings
3. Add your API key (stored locally)

### Option 4: Custom API

Supports any OpenAI-compatible API endpoint:
- Ollama (`http://localhost:11434/v1/chat/completions`)
- LocalAI
- Custom endpoints

## Project Structure

```
comet-search/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles + Tailwind
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Model Recommendations Explained

### Qwen 2.5 (7B or 14B) ⭐ Top Pick
- **Why:** Best instruction following, fast responses, excellent for search-style Q&A
- **Download:** `qwen2.5-7b-instruct` or `qwen2.5-14b-instruct` on HuggingFace
- **VRAM:** 7B needs ~6GB, 14B needs ~10GB

### Llama 3.1 (8B)
- **Why:** Very fast, good quality, widely supported
- **Best for:** Quick queries, lower-end hardware
- **VRAM:** ~6GB

### Mistral Nemo (12B)
- **Why:** Excellent reasoning, 128k context window
- **Best for:** Complex multi-step questions
- **VRAM:** ~8GB

### Phi-4 (14B)
- **Why:** Microsoft's latest, great at following instructions
- **Best for:** Technical queries, coding questions
- **VRAM:** ~10GB

## Hardware Requirements

| GPU VRAM | Recommended Models |
|----------|-------------------|
| 4-6 GB | Llama 3.1 8B, Qwen 2.5 7B |
| 8-12 GB | Qwen 2.5 14B, Mistral Nemo |
| 16+ GB | Multiple models, larger quants |

No GPU? Use mock mode or OpenAI API.

## Theming

Colors are defined in `src/index.css` using CSS variables. Modify the `:root` and `.dark` selectors to customize the theme.

## License

MIT License - feel free to use this for personal or commercial projects.

## Acknowledgments

- Design inspired by [Perplexity AI](https://perplexity.ai)
- Icons by [Lucide](https://lucide.dev)