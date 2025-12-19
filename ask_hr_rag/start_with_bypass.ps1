param(
    [string]$Port = "5100",
    [switch]$Headless
)

$ErrorActionPreference = "Stop"

$root = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location $root

# Opt-in TLS bypass (for local debugging only)
$env:RAG_DISABLE_SSL_VERIFY = "true"

# Browser settings for Selenium (if you add browser-based flows later)
$env:ASKHR_BROWSER = "edge"
$env:ASKHR_HEADLESS = $(if ($Headless) { "true" } else { "false" })

Write-Host "Starting Ask HR RAG server with TLS bypass enabled on port $Port"

& "$root\.venv\Scripts\python.exe" -m uvicorn server:app --host 127.0.0.1 --port $Port
