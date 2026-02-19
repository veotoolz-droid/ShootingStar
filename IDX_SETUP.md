# Google IDX Setup Instructions

## Project: ShootingStar / Comet Search

Repository: https://github.com/veotoolz-droid/ShootingStar

---

## Step 1: Create New Workspace

1. Go to https://idx.google.com
2. Click "Create New Workspace"
3. Select "Import from GitHub"
4. Enter repository URL: `https://github.com/veotoolz-droid/ShootingStar`
5. Click "Create"

---

## Step 2: Configure Environment

Once the workspace loads, open the terminal and run:

```bash
# Install dependencies
npm install

# Install Playwright browsers (required for agentic browsing)
npx playwright install chromium
```

---

## Step 3: Configure API Keys

Create a `.env` file in the project root:

```bash
# Required - Get free key at https://brave.com/search/api/
VITE_BRAVE_API_KEY=your_brave_api_key_here

# Optional - For cloud mode (https://platform.moonshot.cn/)
VITE_KIMI_API_KEY=your_kimi_api_key_here
```

To add your Brave API key:
1. Visit https://brave.com/search/api/
2. Sign up for free tier (10,000 queries/month)
3. Copy your API key
4. Paste into `.env` file

---

## Step 4: Run the Application

### Development Mode (Web)
```bash
npm run dev
```
Preview will be available in the IDX preview panel.

### Desktop Mode (Electron)
```bash
# Note: Electron may not work in cloud environments
# Use this for local development instead
npm run electron:dev
```

### Build for Production
```bash
npm run build
```

---

## Step 5: Configure for Local LLM (Optional)

To use 100% local AI (no cloud):

1. **Download LM Studio** on your local machine:
   - https://lmstudio.ai

2. **Download a model**:
   - Qwen 2.5 14B (recommended)
   - Llama 3.1 8B (faster)

3. **Start the server**:
   - Load model in LM Studio
   - Go to Developer tab → Start Server
   - Enable CORS
   - Port: 1234

4. **In Comet Settings**:
   - Select "Local" provider mode
   - URL: `http://localhost:1234/v1/chat/completions`

---

## Project Structure

```
comet-search/
├── electron/           # Electron main process
│   ├── main.ts        # Main entry
│   ├── preload.ts     # IPC bridge
│   ├── browser.ts     # Playwright automation
│   └── memory.ts      # ChromaDB integration
├── src/
│   ├── components/    # React components
│   │   ├── TabManager.tsx
│   │   ├── DeepResearch.tsx
│   │   ├── ModelCouncil.tsx
│   │   ├── TaskQueue.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── ToastContainer.tsx
│   │   └── ExportPanel.tsx
│   ├── hooks/         # Custom hooks
│   ├── services/      # Business logic
│   └── App.tsx        # Main app
├── dist/              # Web build output
└── dist-electron/     # Electron build output
```

---

## Features Available

### Phase 1: Core Search ✅
- Real web search (Brave API)
- Multiple search modes (Quick/Standard/Deep/Reasoning)
- Kimi API integration
- Local LLM support
- Hybrid provider mode

### Phase 2: Agentic Foundation ✅
- Electron desktop app
- Playwright browser automation
- Memory Bank (ChromaDB)
- Custom folders

### Phase 3: Advanced Features ✅
- Multi-tab workspace
- Deep Research with iterative queries
- Background tasks
- Model Council (multi-model comparison)

### Phase 4: UI/UX Enhancements ✅
- Toast notifications
- Keyboard shortcuts
- Command palette (Cmd+Shift+P)
- Export (PDF/Markdown/HTML)
- Page summarization
- Custom AI commands (/explain, /translate)
- Loading skeletons
- Error boundaries
- Request caching
- Auto-retry

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + T` | New tab |
| `Cmd/Ctrl + W` | Close tab |
| `Cmd/Ctrl + Shift + T` | Reopen closed tab |
| `Cmd/Ctrl + K` | Focus search |
| `Cmd/Ctrl + Shift + P` | Command palette |
| `Cmd/Ctrl + Arrow Right` | Next tab |
| `Cmd/Ctrl + Arrow Left` | Previous tab |

---

## Custom Commands

Type in search box:
- `/explain` - Explain like I'm 5
- `/translate` - Translate to Chinese
- `/summarize` - Brief summary
- `/code` - Code explanation
- `/proscons` - Balanced analysis
- `/steps` - Step-by-step guide

---

## Troubleshooting

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### ChromaDB errors
- Check disk space
- Ensure memory bank folder is writable

### Playwright issues
```bash
npx playwright install chromium
```

---

## Next Steps

1. Add your API keys to `.env`
2. Run `npm run dev` to start
3. Try a search query
4. Explore different modes (Quick/Deep/Reasoning)
5. Test Model Council with multiple models
6. Try Deep Research on a complex topic

---

## Support

- GitHub Issues: https://github.com/veotoolz-droid/ShootingStar/issues
- Documentation: See README.md in repository

---

**Note**: This is a feature-rich AI search browser. Some features (like Electron desktop mode) work best when run locally rather than in cloud environments.
