# Creates/renames MoTR Spotlight Vercel projects via REST API.
# Requires: VERCEL_TOKEN (https://vercel.com/account/tokens)
#
# Usage (PowerShell):
#   $env:VERCEL_TOKEN = "your_token"
#   .\scripts\setup-vercel-projects.ps1
#
# Optional:
#   $env:VERCEL_TEAM_ID = "team_..."   # if projects live under a team
#   $env:GITHUB_REPO = "vkuperman/MoTR_spotlight"

param(
  [string]$Token = $env:VERCEL_TOKEN,
  [string]$TeamId = $env:VERCEL_TEAM_ID,
  [string]$GitHubRepo = $(if ($env:GITHUB_REPO) { $env:GITHUB_REPO } else { "vkuperman/MoTR_spotlight" }),
  [string]$OldProjectName = "mo-tr-spotlight"
)

$ErrorActionPreference = "Stop"

if (-not $Token) {
  Write-Host @"

VERCEL_TOKEN is missing. Run ONE of these (two separate lines; do not use >>):

  PowerShell:
    `$env:VERCEL_TOKEN = 'your_token'
    scripts\setup-vercel-projects.cmd

  Or pass token as argument:
    powershell -ExecutionPolicy Bypass -File .\scripts\setup-vercel-projects.ps1 -Token 'your_token'

Token: https://vercel.com/account/tokens

"@
  exit 1
}

$headers = @{
  Authorization = "Bearer $Token"
  "Content-Type"  = "application/json"
}

function Invoke-Vercel {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [switch]$AllowError
  )
  $uri = "https://api.vercel.com$Path"
  if ($TeamId) { $sep = if ($Path -match '\?') { '&' } else { '?' }; $uri += "${sep}teamId=$TeamId" }
  $params = @{ Method = $Method; Headers = $headers; Uri = $uri }
  if ($null -ne $Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
  try {
    return Invoke-RestMethod @params
  } catch {
    if ($AllowError) { return $null }
    throw
  }
}

function Get-ProjectByName {
  param([string]$Name)
  $direct = Invoke-Vercel -Method GET -Path "/v9/projects/$Name" -AllowError
  if ($direct -and $direct.name) { return $direct }

  $encoded = [uri]::EscapeDataString($Name)
  $list = Invoke-Vercel -Method GET -Path "/v9/projects?search=$encoded&limit=100"
  if ($list.projects) {
    foreach ($p in $list.projects) {
      if ($p.name -eq $Name) { return $p }
    }
  }
  return $null
}

function Ensure-Project {
  param(
    [string]$Name,
    [string]$SpotlightApp,
    [string]$ResultsPath
  )

  $existing = Get-ProjectByName -Name $Name
  if (-not $existing) {
    Write-Host "Creating project: $Name"
    $body = @{
      name = $Name
      framework = $null
    }
    if ($GitHubRepo -match '^([^/]+)/([^/]+)$') {
      $body.gitRepository = @{
        type = "github"
        repo = $GitHubRepo
      }
    }
    try {
      $existing = Invoke-Vercel -Method POST -Path "/v11/projects" -Body $body
    } catch {
      $msg = $_.Exception.Message
      if ($msg -match 'conflict|already exists') {
        Write-Host "Project already exists (reusing): $Name"
        $existing = Get-ProjectByName -Name $Name
        if (-not $existing) { throw }
      } else {
        throw
      }
    }
  } else {
    Write-Host "Project exists: $Name ($($existing.id))"
  }

  $projectId = $existing.id
  if (-not $projectId) {
    $projectId = (Get-ProjectByName -Name $Name).id
  }
  if (-not $projectId) {
    throw "Could not resolve project id for $Name"
  }

  Write-Host "Updating build settings for $Name (production branch: main, SPOTLIGHT_APP=$SpotlightApp)"
  Invoke-Vercel -Method PATCH -Path "/v9/projects/$projectId" -Body @{
    buildCommand      = "node scripts/vercel-build.cjs"
    outputDirectory   = ".vercel-build-output/dist"
    ignoreCommand     = "sh scripts/vercel-ignore-build.sh"
    rootDirectory     = $null
    productionBranch  = "main"
  } | Out-Null

  $envKeys = @(
    @{ key = "SPOTLIGHT_APP"; value = $SpotlightApp; target = @("production", "preview", "development") }
    @{ key = "GITHUB_REPO"; value = $GitHubRepo; target = @("production", "preview", "development") }
    @{ key = "GITHUB_RESULTS_PATH"; value = $ResultsPath; target = @("production", "preview", "development") }
    @{ key = "GITHUB_BRANCH"; value = "results"; target = @("production", "preview", "development") }
  )

  foreach ($ev in $envKeys) {
    Write-Host "  env $($ev.key)=$($ev.value)"
    try {
      Invoke-Vercel -Method POST -Path "/v10/projects/$projectId/env" -Body @{
        key    = $ev.key
        value  = $ev.value
        type   = "encrypted"
        target = $ev.target
      } | Out-Null
    } catch {
      Write-Warning "  Could not set $($ev.key) (may already exist): $($_.Exception.Message)"
    }
  }

  return $projectId
}

# Rename legacy single project only if SONA name is not already taken
$sonaExisting = Get-ProjectByName -Name "mo-tr-spotlight-sona"
$legacy = Get-ProjectByName -Name $OldProjectName
if ($legacy -and -not $sonaExisting -and $legacy.name -eq $OldProjectName) {
  Write-Host "Renaming $OldProjectName -> mo-tr-spotlight-sona"
  Invoke-Vercel -Method PATCH -Path "/v9/projects/$($legacy.id)" -Body @{ name = "mo-tr-spotlight-sona" } | Out-Null
} elseif ($legacy -and $sonaExisting) {
  Write-Host ""
  Write-Host "WARNING: Both '$OldProjectName' and 'mo-tr-spotlight-sona' exist as separate projects."
  Write-Host "  Live SONA app is usually at: https://mo-tr-spotlight.vercel.app"
  Write-Host "  Broken/empty subdomain:     https://mo-tr-spotlight-sona.vercel.app"
  Write-Host "  Fix: delete the empty mo-tr-spotlight-sona project in Vercel UI, then re-run this script."
  Write-Host ""
}

$sonaId = Ensure-Project `
  -Name "mo-tr-spotlight-sona" `
  -SpotlightApp "SONA" `
  -ResultsPath "run_motr_in_magpie/Results/spotlight_SONA"

$prolificId = Ensure-Project `
  -Name "mo-tr-spotlight-prolific" `
  -SpotlightApp "PROLIFIC" `
  -ResultsPath "run_motr_in_magpie/Results/spotlight_PROLIFIC"

# Legacy project name (still used by mo-tr-spotlight.vercel.app)
if ($legacy) {
  Write-Host "Updating legacy project: $OldProjectName (SPOTLIGHT_APP=SONA)"
  Invoke-Vercel -Method PATCH -Path "/v9/projects/$($legacy.id)" -Body @{
    buildCommand      = "node scripts/vercel-build.cjs"
    outputDirectory   = ".vercel-build-output/dist"
    ignoreCommand     = "sh scripts/vercel-ignore-build.sh"
    productionBranch  = "main"
  } | Out-Null
  try {
    Invoke-Vercel -Method POST -Path "/v10/projects/$($legacy.id)/env" -Body @{
      key    = "SPOTLIGHT_APP"
      value  = "SONA"
      type   = "encrypted"
      target = @("production", "preview", "development")
    } | Out-Null
  } catch {
    Write-Warning "  Could not set SPOTLIGHT_APP on legacy project (may already exist)"
  }
  try {
    Invoke-Vercel -Method POST -Path "/v10/projects/$($legacy.id)/env" -Body @{
      key    = "GITHUB_RESULTS_PATH"
      value  = "run_motr_in_magpie/Results/spotlight_SONA"
      type   = "encrypted"
      target = @("production", "preview", "development")
    } | Out-Null
  } catch {
    Write-Warning "  Could not set GITHUB_RESULTS_PATH on legacy project (may already exist)"
  }
}

Write-Host ""
Write-Host "Done."
Write-Host "  SONA:     https://mo-tr-spotlight.vercel.app (legacy; rename to mo-tr-spotlight-sona when duplicate project is removed)"
Write-Host "  Prolific: https://mo-tr-spotlight-prolific.vercel.app"
Write-Host ""
Write-Host "Add GITHUB_TOKEN in each project's Environment Variables (Vercel UI) if not already set."
Write-Host "Redeploy both projects after env changes."
