param(
    [string]$Branch = "main",
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

if (-not $Message) {
    $Message = "sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
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
    Write-Host "No local changes to commit. Working tree is already synced with origin/$Branch."
    exit 0
}

& $git commit -m $Message
& $git push origin $Branch

Write-Host "Synced successfully with origin/$Branch."
