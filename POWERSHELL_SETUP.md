# Antigravity PowerShell Setup Instructions

## For: ShootingStar / Comet Search
## Repository: https://github.com/veotoolz-droid/ShootingStar

---

## Prerequisites

Ensure you have installed:
- Git for Windows (https://git-scm.com/download/win)
- Node.js 18+ (https://nodejs.org)
- PowerShell 5.1 or PowerShell Core 7+

---

## Step 1: Clone Repository

Open PowerShell as Administrator and run:

```powershell
# Navigate to your projects folder (change as needed)
cd C:\Users\$env:USERNAME\Projects

# Clone the repository
git clone https://github.com/veotoolz-droid/ShootingStar.git

# Enter project directory
cd ShootingStar
```

---

## Step 2: Install Dependencies

```powershell
# Install npm dependencies
npm install

# Install Playwright browsers (required for browser automation)
npx playwright install chromium

# Verify installation
npm list
```

---

## Step 3: Configure Environment Variables

### Option A: Create .env file

```powershell
# Create .env file with your API keys
@"
VITE_BRAVE_API_KEY=your_brave_api_key_here
VITE_KIMI_API_KEY=your_kimi_api_key_here
"@ | Out-File -FilePath .env -Encoding UTF8
```

### Option B: Set System Environment Variables

```powershell
# Set user environment variables (persistent)
[Environment]::SetEnvironmentVariable("VITE_BRAVE_API_KEY", "your_brave_api_key_here", "User")
[Environment]::SetEnvironmentVariable("VITE_KIMI_API_KEY", "your_kimi_api_key_here", "User")

# Reload environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
```

---

## Step 4: Get API Keys

### Brave Search API (Required)

```powershell
# Open browser to get API key
Start-Process "https://brave.com/search/api/"

# Steps:
# 1. Sign up for free account
# 2. Navigate to API keys section
# 3. Generate new key
# 4. Copy key and paste into .env file
```

### Kimi API (Optional - for cloud mode)

```powershell
# Open browser
Start-Process "https://platform.moonshot.cn/"

# Steps:
# 1. Create account
# 2. Generate API key
# 3. Add to .env file
```

---

## Step 5: Run the Application

### Development Mode (Web)

```powershell
cd C:\Users\$env:USERNAME\Projects\ShootingStar
npm run dev
```

Access at: http://localhost:5173

### Electron Desktop Mode

```powershell
cd C:\Users\$env:USERNAME\Projects\ShootingStar
npm run electron:dev
```

### Build for Production

```powershell
# Build web version
npm run build

# Build Electron app for Windows
npm run electron:build
```

Built app will be in `release/` folder.

---

## Step 6: Setup Local LLM (Optional - 100% Free)

### Download LM Studio

```powershell
# Open browser to download
Start-Process "https://lmstudio.ai/"

# Download and install LM Studio for Windows
```

### Configure LM Studio

1. Open LM Studio
2. Download a model (Qwen 2.5 14B recommended)
3. Go to "Developer" tab
4. Click "Start Server"
5. Set port to 1234
6. Enable CORS
7. Keep LM Studio running

### Configure Comet to Use Local LLM

1. Open Comet Search
2. Click Settings (gear icon)
3. Select "Local" provider mode
4. URL: `http://localhost:1234/v1/chat/completions`
5. Model: `qwen2.5-14b` (or your downloaded model)

---

## Full One-Line Setup Script

Save this as `setup-shootingstar.ps1` and run in PowerShell:

```powershell
# ShootingStar Setup Script for Windows
param(
    [string]$BraveApiKey = "",
    [string]$KimiApiKey = "",
    [string]$InstallPath = "$env:USERPROFILE\Projects"
)

Write-Host "🚀 Setting up ShootingStar / Comet Search..." -ForegroundColor Cyan

# Create projects directory if not exists
if (!(Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force
}

# Clone repository
Write-Host "📥 Cloning repository..." -ForegroundColor Yellow
cd $InstallPath
git clone https://github.com/veotoolz-droid/ShootingStar.git
cd ShootingStar

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Install Playwright
Write-Host "🎭 Installing Playwright browsers..." -ForegroundColor Yellow
npx playwright install chromium

# Create .env file
Write-Host "⚙️ Creating configuration..." -ForegroundColor Yellow
$envContent = @"
VITE_BRAVE_API_KEY=$BraveApiKey
VITE_KIMI_API_KEY=$KimiApiKey
"@
$envContent | Out-File -FilePath .env -Encoding UTF8

# Build project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your Brave API key to .env file" -ForegroundColor White
Write-Host "2. Run: npm run electron:dev" -ForegroundColor White
Write-Host ""
Write-Host "Project location: $(Get-Location)" -ForegroundColor Gray
```

### Run the Setup Script

```powershell
# Save the script first, then run:
.\setup-shootingstar.ps1 -BraveApiKey "your_key_here" -KimiApiKey "your_key_here"
```

---

## Verification Commands

```powershell
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Verify project structure
Get-ChildItem -Path C:\Users\$env:USERNAME\Projects\ShootingStar

# Test build
npm run build
```

---

## Troubleshooting

### Build Fails

```powershell
# Clear cache and reinstall
cd C:\Users\$env:USERNAME\Projects\ShootingStar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Playwright Issues

```powershell
# Reinstall Playwright browsers
npx playwright install --force chromium
```

### Permission Denied

```powershell
# Run PowerShell as Administrator
# Or use this to bypass execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Port Already in Use

```powershell
# Find process using port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess

# Kill the process
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

---

## Keyboard Shortcuts (Windows)

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` | New tab |
| `Ctrl + W` | Close tab |
| `Ctrl + Shift + T` | Reopen closed tab |
| `Ctrl + K` | Focus search |
| `Ctrl + Shift + P` | Command palette |
| `Ctrl + Tab` | Next tab |
| `Ctrl + Shift + Tab` | Previous tab |
| `Ctrl + ,` | Settings |

---

## Quick Start After Setup

```powershell
# Daily usage - just these commands:
cd C:\Users\$env:USERNAME\Projects\ShootingStar
npm run electron:dev
```

---

## Update to Latest Version

```powershell
cd C:\Users\$env:USERNAME\Projects\ShootingStar
git pull origin main
npm install
npm run build
```

---

## Uninstall

```powershell
# Remove project folder
Remove-Item -Recurse -Force C:\Users\$env:USERNAME\Projects\ShootingStar

# Optional: Remove environment variables
[Environment]::SetEnvironmentVariable("VITE_BRAVE_API_KEY", $null, "User")
[Environment]::SetEnvironmentVariable("VITE_KIMI_API_KEY", $null, "User")
```

---

## Support

- GitHub Issues: https://github.com/veotoolz-droid/ShootingStar/issues
- Documentation: See README.md in project folder

---

**Last Updated:** February 2026
