[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ZipPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$resolvedZip = [IO.Path]::GetFullPath($ZipPath)
$extractPath = Join-Path ([IO.Path]::GetTempPath()) ('moon-leaks-audit-' + [guid]::NewGuid().ToString('N'))
$allowedExtensions = @('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json')
$forbiddenPatterns = @(
  '\bfetch\s*\(',
  'XMLHttpRequest',
  'new\s+WebSocket\s*\(',
  'new\s+EventSource\s*\(',
  'new\s+RTCPeerConnection\s*\(',
  'navigator\.geolocation',
  'navigator\.clipboard',
  'document\.execCommand',
  'navigator\.(bluetooth|usb|hid|serial)',
  'navigator\.(getBattery|connection|credentials|locks)',
  'enumerateDevices',
  'getDisplayMedia',
  'navigator\.storage\.persist',
  'navigator\.serviceWorker',
  'new\s+(Worker|SharedWorker)\s*\(',
  'new\s+(Accelerometer|Gyroscope|Magnetometer)\s*\(',
  'Device(Motion|Orientation)Event',
  'requestFullscreen',
  '\beval\s*\(',
  'new\s+Function\s*\(',
  'WebAssembly',
  'window\.open',
  'window\.prompt',
  'location\.href\s*=',
  'location\.assign\s*\(',
  '<iframe',
  '<object',
  '<base\b',
  '\bdownload\b',
  'target\s*=',
  '\btype\s*=\s*["'']module["'']',
  '\bimport\s+',
  '\bexport\s+',
  'https?://',
  '\son\w+\s*=',
  'javascript:'
)

if (-not (Test-Path -LiteralPath $resolvedZip -PathType Leaf)) {
  throw "ZIP not found: $resolvedZip"
}
if ((Get-Item -LiteralPath $resolvedZip).Length -ge 2MB) {
  throw 'ZIP must stay below the 2MB performance target'
}

$readStream = $null
$readArchive = $null
try {
  $readStream = [IO.File]::OpenRead($resolvedZip)
  $readArchive = [IO.Compression.ZipArchive]::new($readStream, [IO.Compression.ZipArchiveMode]::Read)
  $entryNames = @($readArchive.Entries | ForEach-Object { $_.FullName })
  if ($entryNames -notcontains 'index.html') { throw 'index.html must be at ZIP root' }
  $htmlFiles = @($entryNames | Where-Object { [IO.Path]::GetExtension($_).ToLowerInvariant() -eq '.html' })
  if ($htmlFiles.Count -ne 1) { throw 'ZIP must contain exactly one HTML file' }
  foreach ($entryName in $entryNames) {
    if ($entryName.Contains('\')) { throw "Backslash ZIP entry: $entryName" }
    if ($entryName.StartsWith('/') -or $entryName -match '^[A-Za-z]:') { throw "Absolute ZIP entry: $entryName" }
    if ($entryName.Split('/') -contains '..') { throw "Parent traversal ZIP entry: $entryName" }
  }
}
finally {
  if ($null -ne $readArchive) { $readArchive.Dispose() }
  if ($null -ne $readStream) { $readStream.Dispose() }
}

New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
try {
  [IO.Compression.ZipFile]::ExtractToDirectory($resolvedZip, $extractPath)
  $files = @(Get-ChildItem -LiteralPath $extractPath -Recurse -File)
  $relativeFiles = @($files | ForEach-Object { $_.FullName.Substring($extractPath.Length + 1).Replace('\', '/') })
  $badTypes = @($relativeFiles | Where-Object { [IO.Path]::GetExtension($_).ToLowerInvariant() -notin $allowedExtensions })
  if ($badTypes.Count -gt 0) { throw "Unsupported file type: $($badTypes -join ', ')" }

  $totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
  if ($totalBytes -ge 2MB) { throw "Extracted runtime exceeds 2MB: $totalBytes" }

  $indexPath = Join-Path $extractPath 'index.html'
  $html = Get-Content -LiteralPath $indexPath -Raw
  if ($html -notmatch '<!DOCTYPE html>') { throw 'Missing HTML doctype' }
  if ($html -notmatch 'lang="zh-CN"') { throw 'Missing zh-CN language' }
  if ($html -notmatch 'viewport-fit=cover') { throw 'Missing safe-area viewport rule' }
  if (@(Select-String -InputObject $html -Pattern '<script(?![^>]*\bsrc=)' -AllMatches).Matches.Count -gt 0) { throw 'Inline script found' }

  $textFiles = @($files | Where-Object { $_.Extension.ToLowerInvariant() -in @('.html', '.css', '.js', '.json') })
  foreach ($pattern in $forbiddenPatterns) {
    $matches = @($textFiles | Select-String -Pattern $pattern -CaseSensitive:$false)
    if ($matches.Count -gt 0) { throw "Forbidden pattern matched: $pattern" }
  }

  $resourceMatches = [regex]::Matches($html, '(?:src|href)="([^"#]+)"')
  foreach ($match in $resourceMatches) {
    $resource = $match.Groups[1].Value
    if (-not $resource.StartsWith('./')) { throw "Resource must use ./ relative path: $resource" }
    $resourcePath = Join-Path $extractPath $resource.Substring(2).Replace('/', '\')
    if (-not (Test-Path -LiteralPath $resourcePath -PathType Leaf)) { throw "Referenced resource missing: $resource" }
  }

  Write-Output 'UPLOAD_PREFLIGHT=PASS'
  Write-Output "FILES=$($relativeFiles -join ',')"
  Write-Output "ZIP_BYTES=$((Get-Item -LiteralPath $resolvedZip).Length)"
  Write-Output "EXTRACTED_BYTES=$totalBytes"
}
finally {
  if (Test-Path -LiteralPath $extractPath) {
    Remove-Item -LiteralPath $extractPath -Recurse -Force
  }
}
