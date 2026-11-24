# Compila los instaladores del emisor para Windows (NSIS y MSI) listos para publicar.
#
# Uso (desde apps\emisor, en PowerShell):
#   .\compilar.ps1                                        # panel de producción (https://api.laluzdeltiempo.org)
#   .\compilar.ps1 -Panel http://192.168.1.11:4000        # pruebas contra el panel de la red local
#
# Necesita la clave de actualizaciones en %USERPROFILE%\.tauri\emisor-actualizaciones.key (respáldala:
# sin ella no se pueden publicar actualizaciones para los emisores ya instalados).
# Si hay certificado de firma de código configurado (ver src-tauri\firmar.ps1), también firma el .exe.
param([string]$Panel = '')

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$clave = Join-Path $env:USERPROFILE '.tauri\emisor-actualizaciones.key'
if (-not (Test-Path $clave)) { throw "Falta la clave de actualizaciones en $clave" }
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content $clave -Raw).Trim()
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''
if ($Panel) { $env:EMISOR_PANEL_URL = $Panel.TrimEnd('/') } else { Remove-Item Env:EMISOR_PANEL_URL -ErrorAction SilentlyContinue }
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"

# Tauri escribe su progreso por stderr: en Windows PowerShell 5.1 eso no debe cortar el script
$ErrorActionPreference = 'Continue'
npx -y pnpm@10.18.3 tauri build --bundles msi --bundles nsis 2>&1 | ForEach-Object { "$_" }
if ($LASTEXITCODE -ne 0) { throw 'La compilación falló.' }
$ErrorActionPreference = 'Stop'

$nsis = Join-Path $PSScriptRoot 'src-tauri\target\release\bundle\nsis'
Write-Host ''
Write-Host 'Listo. Para publicar la versión en el panel (Configuración de radio, Emisor de Windows) sube:'
Get-ChildItem $nsis -Filter '*-setup.exe*' | ForEach-Object { Write-Host "  $($_.FullName)" }
