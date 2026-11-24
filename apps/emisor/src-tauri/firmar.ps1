# Firma de código del emisor (Authenticode). Tauri lo llama con cada archivo a firmar: el .exe y los instaladores.
# Sin certificado configurado no hace nada (solo avisa): así se puede compilar en cualquier PC.
#
# Con un certificado de firma de código instalado en Windows (por ejemplo Certum SimplySign, Sectigo,
# o un token USB), definir antes de compilar:
#   $env:EMISOR_FIRMA_HUELLA = "<huella SHA1 del certificado>"   # certlm/certmgr → Detalles → Huella digital
#   $env:EMISOR_FIRMA_SELLO  = "http://time.certum.pl"           # opcional: servidor de sellado de tiempo
# Con un archivo .pfx en vez del almacén de Windows:
#   $env:EMISOR_FIRMA_PFX = "C:\ruta\certificado.pfx"; $env:EMISOR_FIRMA_PFX_CLAVE = "..."
param([Parameter(Mandatory = $true)][string]$Archivo)

$ErrorActionPreference = 'Stop'
# Tauri puede pasar la ruta entre comillas
$Archivo = $Archivo.Trim('"')
$huella = $env:EMISOR_FIRMA_HUELLA
$pfx = $env:EMISOR_FIRMA_PFX
if (-not $huella -and -not $pfx) {
  Write-Host "[firma] Sin certificado configurado: $([IO.Path]::GetFileName($Archivo)) queda sin firmar (Windows mostrará «editor desconocido»)."
  exit 0
}

# signtool viene con el SDK de Windows (Visual Studio Build Tools)
$signtool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
if (-not $signtool) { throw 'No se encontró signtool.exe. Instala el SDK de Windows 10/11 (Visual Studio Installer → componentes individuales).' }

$sello = if ($env:EMISOR_FIRMA_SELLO) { $env:EMISOR_FIRMA_SELLO } else { 'http://time.certum.pl' }
$argumentos = @('sign', '/fd', 'SHA256', '/td', 'SHA256', '/tr', $sello, '/d', 'Emisor La Luz del Tiempo')
if ($pfx) { $argumentos += @('/f', $pfx, '/p', $env:EMISOR_FIRMA_PFX_CLAVE) } else { $argumentos += @('/sha1', $huella) }
$argumentos += $Archivo

& $signtool @argumentos
if ($LASTEXITCODE -ne 0) { throw "signtool falló con el código $LASTEXITCODE al firmar $Archivo" }
Write-Host "[firma] Firmado: $([IO.Path]::GetFileName($Archivo))"
