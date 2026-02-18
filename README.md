# Comet Search

A Perplexity-style AI search interface built with React, TypeScript, and Tailwind CSS.

## Features

- 🔍 **AI-Powered Search** - Natural language queries with intelligent responses
- 📚 **Cited Sources** - Every answer includes verifiable sources
- 💫 **Streaming Text** - Real-time response generation effect
- 🌓 **Dark/Light Mode** - Automatic theme switching with persistence
- 📜 **Search History** - Local storage of recent searches
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Fast & Lightweight** - Built with Vite for optimal performance
- 🤖 **Multiple AI Providers** - Support for LM Studio, OpenAI, and custom APIs

## Getting Started

```bash
npm install
npm run dev
```

## AI Provider Setup

### LM Studio (Recommended for Local)

1. Download LM Studio (https://lmstudio.ai/)
2. Download Qwen 2.5 7B (or another recommended model)
3. Load it → Developer tab → Start server on port 1234
4. Enable CORS in settings
5. Select "LM Studio" in Comet Search settings

### Recommended Models

• Qwen 2.5 (7B) - Best balance of speed and quality
• Llama 3.1 (8B) - Fast, good for most queries
• Mistral Nemo (12B) - Excellent reasoning
• Phi-4 (14B) - Microsoft's best small model
