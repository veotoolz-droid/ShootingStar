param (
    [string]$BraveApiKey = "",
    [string]$KimiApiKey = ""
)

Write-Host "🌟 Starting ShootingStar Setup..." -ForegroundColor Cyan

# 1. Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# 2. Install Dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies."
    exit 1
}

# 3. Create .env file
Write-Host "🔑 Configuring environment..." -ForegroundColor Yellow
$envContent = ""
if ($BraveApiKey) {
    $envContent += "VITE_BRAVE_API_KEY=$BraveApiKey`n"
}
if ($KimiApiKey) {
    $envContent += "VITE_KIMI_API_KEY=$KimiApiKey`n"
}

if ($envContent) {
    $envContent | Out-File -FilePath .env -Encoding UTF8
    Write-Host "Created .env file." -ForegroundColor Green
} else {
    Write-Host "No API keys provided. Skipping .env creation." -ForegroundColor Gray
}

# 4. Instructions
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "To start the app, run:" -ForegroundColor Cyan
Write-Host "npm run electron:dev" -ForegroundColor White
