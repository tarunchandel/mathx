param (
    [string]$Track = "internal",
    [string]$KeyPath = "android/app/service-account.json"
)

# Step 1: Ensure JSON key exists
if (!(Test-Path $KeyPath)) {
    Write-Error "Service account key not found at $KeyPath. Please place your service-account.json in the android/app/ directory."
    exit 1
}

Write-Host "Starting Production Build and Upload Process..." -ForegroundColor Cyan

# Step 2: Build Web Assets
Write-Host "Building web assets..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -Command "npm run build"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 3: Capacitor Sync
Write-Host "Syncing with Capacitor..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -Command "npx cap sync android"
if ($LASTEXITCODE -ne 0) { exit 1 }

# Step 4: Build and Publish Bundle
Write-Host "Building and Publishing AAB to Play Console ($Track track)..." -ForegroundColor Yellow
cd android
.\gradlew.bat publishBundle --track $Track
if ($LASTEXITCODE -ne 0) { 
    Write-Error "Failed to publish bundle to Play Store."
    exit 1
}

Write-Host "Successfully published to Google Play Console!" -ForegroundColor Green
