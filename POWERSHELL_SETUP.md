# PowerShell Setup Instructions

## 1. Automated Setup (Recommended)
Run the included PowerShell script to install everything automatically.

```powershell
.\setup-shootingstar.ps1 -BraveApiKey "YOUR_BRAVE_KEY" -KimiApiKey "YOUR_KIMI_KEY"
```

## 2. Manual Setup
If you prefer to run commands manually:

### Clone and Enter Directory
```powershell
git clone https://github.com/veotoolz-droid/ShootingStar.git
cd ShootingStar
```

### Install Dependencies
```powershell
npm install
# Note: Playwright is optional if not using browsing agent features immediately
npx playwright install chromium
```

### Configure Environment
Create a `.env` file with your API keys:
```powershell
@"
VITE_BRAVE_API_KEY=your_key_here
VITE_KIMI_API_KEY=optional_key_here
"@ | Out-File -FilePath .env -Encoding UTF8
```

### Run Application
Start the Electron development environment:
```powershell
npm run electron:dev
```
