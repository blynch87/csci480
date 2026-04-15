$ErrorActionPreference = "Stop"

$server = "blynch@blynch.cs.unca.edu"
$projectRoot = "C:\Users\benja\Desktop\csci480"
$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"

Write-Host "=== Building frontend ===" -ForegroundColor Cyan
Set-Location $frontendPath
npm run build

Write-Host "=== Uploading frontend files ===" -ForegroundColor Cyan
scp -r dist\* ${server}:/home/blynch/transfer-frontend/

Write-Host "=== Uploading backend files ===" -ForegroundColor Cyan
Set-Location $backendPath
scp -r . ${server}:/home/blynch/transfer-backend/

Write-Host "=== Fixing permissions ===" -ForegroundColor Cyan
ssh $server "
chmod o+x /home/blynch &&
chmod 755 /home/blynch/transfer-frontend /home/blynch/transfer-frontend/assets &&
chmod 644 /home/blynch/transfer-frontend/index.html /home/blynch/transfer-frontend/assets/*
"

Write-Host "=== Restarting backend ===" -ForegroundColor Cyan
ssh -t $server "sudo systemctl restart transfer-backend"

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor Yellow