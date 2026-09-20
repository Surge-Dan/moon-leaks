[CmdletBinding()]
param(
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $projectRoot '..\moon-leaks-tool-upload.zip'
}
$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
$outputParent = Split-Path -Parent $resolvedOutput
$runtimePaths = @('index.html', 'assets\style.css', 'assets\editorial.css', 'assets\mooncake-whole.webp', 'assets\mooncake-cut-lotus.webp', 'assets\mooncake-cut-sesame.webp', 'assets\mooncake-cut-osmanthus.webp', 'assets\mooncake-cut-custard.webp', 'assets\mooncake-cut-coffee.webp', 'assets\filling-lotus.webp', 'assets\filling-sesame.webp', 'assets\filling-osmanthus.webp', 'assets\filling-custard.webp', 'assets\filling-coffee.webp', 'assets\content.js', 'assets\engine.js', 'assets\visuals.js', 'assets\app.js')

foreach ($relativePath in $runtimePaths) {
  $sourcePath = Join-Path $projectRoot $relativePath
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Runtime file missing: $relativePath"
  }
}

if (-not (Test-Path -LiteralPath $outputParent)) {
  New-Item -ItemType Directory -Path $outputParent -Force | Out-Null
}
if (Test-Path -LiteralPath $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Force
}

$stream = $null
$archive = $null
try {
  $stream = [IO.File]::Open($resolvedOutput, [IO.FileMode]::CreateNew)
  $archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
  foreach ($relativePath in $runtimePaths) {
    $sourcePath = Join-Path $projectRoot $relativePath
    $entryName = $relativePath.Replace('\', '/')
    $entry = $archive.CreateEntry($entryName, [IO.Compression.CompressionLevel]::Optimal)
    $sourceStream = [IO.File]::OpenRead($sourcePath)
    $entryStream = $entry.Open()
    try {
      $sourceStream.CopyTo($entryStream)
    }
    finally {
      $entryStream.Dispose()
      $sourceStream.Dispose()
    }
  }
}
finally {
  if ($null -ne $archive) { $archive.Dispose() }
  if ($null -ne $stream) { $stream.Dispose() }
}

$bytes = (Get-Item -LiteralPath $resolvedOutput).Length
Write-Output "UPLOAD_ZIP=$resolvedOutput"
Write-Output "UPLOAD_BYTES=$bytes"
