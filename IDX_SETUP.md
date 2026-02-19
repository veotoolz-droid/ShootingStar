# Quick Summary for IDX

1. **Create Workspace:**
   - Go to [https://idx.google.com](https://idx.google.com/)
   - Import from GitHub: `veotoolz-droid/ShootingStar`

2. **Install Dependencies:**
   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Add API Keys:**
   Create `.env` file:
   ```env
   VITE_BRAVE_API_KEY=your_key_here
   VITE_KIMI_API_KEY=optional_key_here
   ```

4. **Run:**
   ```bash
   npm run dev
   ```

# What IDX Will Set Up

- ✅ Full development environment
- ✅ All dependencies installed
- ✅ TypeScript + React + Vite configured
- ✅ Preview panel for testing
- ✅ Terminal access

# Limitations in Cloud

- ⚠️ Electron desktop mode (needs local machine)
- ⚠️ Local LLM connection (needs LM Studio running locally)
- ✅ Web version works fully

# To Use in IDX

Copy and paste this into your IDX terminal after creating the workspace:

```bash
# 1. Clone and setup
git clone https://github.com/veotoolz-droid/ShootingStar.git
cd ShootingStar
npm install

# 2. Add your Brave API key to .env
echo "VITE_BRAVE_API_KEY=your_key_here" > .env

# 3. Run
npm run dev
```
