param(
  [string]$ApiUrl = "https://unitrack.sbs/api",
  [string]$JuryEmail = $env:JURY_EMAIL,
  [string]$JuryPassword = $env:JURY_PASSWORD,
  [switch]$SkipBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$steps = [System.Collections.Generic.List[object]]::new()

function Run-Step {
  param([string]$Name, [scriptblock]$Command)
  $started = Get-Date
  try {
    & $Command | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Comanda a ieșit cu codul $LASTEXITCODE." }
    $steps.Add([pscustomobject]@{ name=$Name; status="success"; durationMs=[int]((Get-Date)-$started).TotalMilliseconds })
  } catch {
    $steps.Add([pscustomobject]@{ name=$Name; status="failed"; durationMs=[int]((Get-Date)-$started).TotalMilliseconds; error=$_.Exception.Message })
    throw
  }
}

try {
  Run-Step "build-and-syntax" { npm run check }
  if (-not $SkipBrowser) {
    $env:PLAYWRIGHT_USE_SYSTEM_CHROME = "1"
    Run-Step "browser-e2e" { npm run test:e2e }
  }
  $env:JURY_BASE_URL = $ApiUrl
  if ($JuryEmail) { $env:JURY_EMAIL = $JuryEmail }
  if ($JuryPassword) { $env:JURY_PASSWORD = $JuryPassword }
  Run-Step "live-api" { npm run jury:demo }
} catch {
  [pscustomobject]@{
    success = $false
    finishedAt = (Get-Date).ToUniversalTime().ToString("o")
    steps = $steps
    errors = @($_.Exception.Message)
  } | ConvertTo-Json -Depth 8
  exit 1
}

[pscustomobject]@{
  success = $true
  finishedAt = (Get-Date).ToUniversalTime().ToString("o")
  steps = $steps
  errors = @()
} | ConvertTo-Json -Depth 8
