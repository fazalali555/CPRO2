param(
    [string]$Branch = "main",
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

if (-not $Message) {
    $Message = "auto-update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
}

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
    $fallbackGit = "C:\Program Files\Git\cmd\git.exe"
    if (Test-Path $fallbackGit) {
        $git = $fallbackGit
    } else {
        throw "Git was not found. Install Git or reopen the terminal after installation."
    }
}

& $git fetch origin $Branch
& $git pull --rebase origin $Branch
& $git add -A

& $git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes detected. Already up to date with origin/$Branch."
    exit 0
}

& $git commit -m $Message
& $git push origin $Branch

Write-Host "Done! Your GitHub repo is synced with origin/$Branch."
