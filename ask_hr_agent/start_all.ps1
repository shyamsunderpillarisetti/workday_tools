$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ragDir = Join-Path $root "rag_agent"
$workdayDir = Join-Path $root "workday_tools_agent"
$frontendDir = Join-Path $root "frontend"
$defaultQuotaProject = "prj-dev-ai-vertex-bryz"
$defaultCaBundle = Join-Path $root "certs\combined-ca-bundle.pem"

function Start-ServiceWindow($title, $command) {
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($command)
    $encoded = [Convert]::ToBase64String($bytes)
    Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $encoded -WindowStyle Normal -ErrorAction Stop | Out-Null
    Write-Host "Started $title window"
}

function Stop-Ports($ports) {
    foreach ($port in $ports) {
        try {
            $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $pids) {
                if ($pid -and $pid -ne 0) {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        } catch {
            # Ignore failures; ports may not be bound.
        }
    }
}

Write-Host "Stopping existing services on ports 8000, 5001, 5173..."
Stop-Ports @(8000, 5001, 5173)

Write-Host "ADC check skipped. If needed, run: gcloud auth application-default login --project $defaultQuotaProject"

Write-Host "Starting RAG backend (port 8000)..."
$ragCommand = @'
Set-Location "{0}"
$env:WORKDAY_TOOLS_URL = "http://localhost:5001"
$env:ASKHR_RAG_MODEL = "gemini-2.5-pro"
$env:REQUESTS_CA_BUNDLE = "{1}\certs\combined-ca-bundle.pem"
$env:SSL_CERT_FILE = "{1}\certs\combined-ca-bundle.pem"
$env:GRPC_DEFAULT_SSL_ROOTS_FILE_PATH = "{1}\certs\combined-ca-bundle.pem"
$env:RAG_RELAX_SSL = "true"
if (-not $env:GOOGLE_CLOUD_QUOTA_PROJECT) {{ $env:GOOGLE_CLOUD_QUOTA_PROJECT = "{2}" }}
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
'@ -f $ragDir, $root, $defaultQuotaProject
Start-ServiceWindow "RAG Backend" $ragCommand

Write-Host "Starting Workday tools backend (port 5001)..."
# Clear cached tokens/flags so OAuth prompts on first request
Get-ChildItem $workdayDir -Filter ".token_cache.*" -ErrorAction SilentlyContinue | Remove-Item -ErrorAction SilentlyContinue
Get-ChildItem $workdayDir -Filter ".evl_sent.flag" -ErrorAction SilentlyContinue | Remove-Item -ErrorAction SilentlyContinue
# Start from repo root so package imports work; set headless env so OAuth pops a browser; use Python 3.12 venv
$workdayCommand = @'
Set-Location "{0}"
$env:PYTHONPATH = "{0}"
$env:ASKHR_WORKDAY_MODEL = "gemini-2.5-pro"
$env:ASKHR_CHROMEDRIVER_PATH = "{0}\workday_tools_agent\drivers\chromedriver.exe"
$env:ASKHR_HEADLESS = "false"
$env:ASKHR_BROWSER = "chrome"
$env:ASKHR_SELENIUM_TIMEOUT = "120"
$env:ASKHR_SELENIUM_DEBUG = "true"
$env:PATH = "{0}\workday_tools_agent\drivers;{0}\workday_tools_agent;" + $env:PATH
.\workday_tools_agent\.venv\Scripts\python.exe -m uvicorn workday_tools_agent.server:app --host 0.0.0.0 --port 5001
'@ -f $root
Start-ServiceWindow "Workday Tools Backend" $workdayCommand

Write-Host "Starting frontend dev server (vite)..."
$frontendCommand = @'
Set-Location "{0}"
npm run dev
'@ -f $frontendDir
Start-ServiceWindow "Frontend" $frontendCommand

Write-Host "All services launched in separate windows."
