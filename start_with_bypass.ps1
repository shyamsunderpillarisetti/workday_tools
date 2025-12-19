param(
    [string]$Port = "5000",
    [string]$Browser = "edge",
    [switch]$Headless
)

$ErrorActionPreference = "Stop"

$root = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location $root

# Opt-in TLS bypass (for local debugging only)
$env:ASKHR_DISABLE_SSL_VERIFY = "true"

# Selenium browser settings
$env:ASKHR_BROWSER = $Browser
$env:ASKHR_HEADLESS = $(if ($Headless) { "true" } else { "false" })

# Prepend cached Edge driver if present (adjust path if you use Chrome)
$edgeDriver = Join-Path $env:USERPROFILE ".cache\selenium\msedgedriver\win64\143.0.3650.80"
if (Test-Path $edgeDriver) {
    $env:PATH = "$edgeDriver;$env:PATH"
}

Write-Host "Starting AskHR server with TLS bypass enabled on port $Port (browser=$Browser, headless=$($Headless.IsPresent))"

& "$root\.venv\Scripts\python.exe" -m uvicorn server:app --host 127.0.0.1 --port $Port
