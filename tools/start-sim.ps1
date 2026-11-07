# Starts the latest app build as an isolated simulator server on 5570, for the
# website's screenshots. Its own data root, no frame replay (autofocus needs
# stars that change with focus), the sky imagery through a brand-free junction.
# Never touches 5544 (the desk rig) or 5560/5561 (the manual's sims).
$port = 5570
$owner = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($id in $owner) { $pr = Get-Process -Id $id -ErrorAction SilentlyContinue; if ($pr -and $pr.ProcessName -eq 'AstroControl.Api') { Stop-Process -Id $id -Force; Start-Sleep -Seconds 2 } }
$env:ALANASTRO_DATA_ROOT = 'D:\tmp\site-sim-data'
$env:ALANASTRO_URL = "http://127.0.0.1:$port"
Remove-Item Env:\ALANASTRO_SIM_REPLAY -ErrorAction SilentlyContinue
$env:ALANASTRO_SKY_CACHE = 'D:\tmp\sky-imagery'
$proj = 'D:\tmp\site-shots\backend\AstroControl.Api'
$exe = Join-Path $proj 'bin\Debug\net10.0-windows\win-x64\AstroControl.Api.exe'
$p = Start-Process -FilePath $exe -WorkingDirectory $proj -RedirectStandardOutput 'D:\tmp\site-sim-data\stdout.log' -RedirectStandardError 'D:\tmp\site-sim-data\stderr.log' -WindowStyle Hidden -PassThru
"PID $($p.Id)"
