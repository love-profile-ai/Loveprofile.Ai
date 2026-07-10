# GitHub push helper for love-profile-ai/Loveprofile.Ai
#
# 1. Sign in to GitHub as love-profile-ai
# 2. Create a token: Settings → Developer settings → Personal access tokens → Tokens (classic)
#    Scopes: repo (full control of private repositories)
# 3. Run in PowerShell:
#
#   $env:GITHUB_TOKEN = "ghp_your_token_here"
#   .\scripts\github-push.ps1
#
# Or one-time push:
#   git push https://love-profile-ai:$env:GITHUB_TOKEN@github.com/love-profile-ai/Loveprofile.Ai.git main

param(
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
  Write-Host "Missing GITHUB_TOKEN environment variable." -ForegroundColor Red
  Write-Host ""
  Write-Host "Create a PAT at https://github.com/settings/tokens (classic, repo scope)"
  Write-Host "Then run:"
  Write-Host '  $env:GITHUB_TOKEN = "ghp_..."'
  Write-Host "  .\scripts\github-push.ps1"
  exit 1
}

$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

git remote set-url origin "https://github.com/love-profile-ai/Loveprofile.Ai.git"

$pushUrl = "https://love-profile-ai:$($env:GITHUB_TOKEN)@github.com/love-profile-ai/Loveprofile.Ai.git"
git push $pushUrl $Branch

Write-Host "Pushed to love-profile-ai/Loveprofile.Ai ($Branch)" -ForegroundColor Green
