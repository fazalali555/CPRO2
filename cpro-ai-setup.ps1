$ErrorActionPreference = "Continue"

Write-Host "🚀 CPRO AI setup starting..." -ForegroundColor Green

$project = Get-Location
Write-Host "📁 Project: $project" -ForegroundColor Cyan

# Create folders safely
New-Item -ItemType Directory -Force -Path ".agents\skills" | Out-Null
New-Item -ItemType Directory -Force -Path ".agents\memory" | Out-Null
New-Item -ItemType Directory -Force -Path ".gemini" | Out-Null

# Install Gemini CLI
Write-Host "📦 Installing Gemini CLI..." -ForegroundColor Yellow
npm install -g @google/gemini-cli@latest

# Prepare skills CLI
npx -y skills --help | Out-Null

function Install-Skill {
    param (
        [string]$repo,
        [string]$skill
    )

    Write-Host "📦 Installing $skill from $repo"
    npx -y skills add $repo -a gemini-cli --copy -y --skill $skill
}

# Core skills (safe subset)
Install-Skill "vercel-labs/agent-skills" "react-best-practices"
Install-Skill "vercel-labs/agent-skills" "web-design-guidelines"
Install-Skill "obra/superpowers" "systematic-debugging"
Install-Skill "obra/superpowers" "writing-plans"
Install-Skill "obra/superpowers" "verification-before-completion"
Install-Skill "anthropics/skills" "pdf"
Install-Skill "anthropics/skills" "docx"
Install-Skill "anthropics/skills" "xlsx"
Install-Skill "google-gemini/gemini-skills" "gemini-api-dev"

# Clerk Pro governance skill
New-Item -ItemType Directory -Force -Path ".agents\skills\clerk-pro-governance" | Out-Null

@"
---
name: clerk-pro-governance
description: Clerk Pro governance rules
---

# Clerk Pro Rules

- Do not modify Employee core data without approval
- Keep pension logic safe and auditable
- Always inspect before editing
"@ | Set-Content -Encoding UTF8 ".agents\skills\clerk-pro-governance\SKILL.md"

# MCP config
@"
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
"@ | Set-Content -Encoding UTF8 ".gemini\settings.json"

Write-Host "✅ Setup finished successfully." -ForegroundColor Green
Write-Host "👉 Next: run 'gemini'" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
