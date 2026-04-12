$ErrorActionPreference = "Stop"

$sourceDir = Join-Path $PSScriptRoot "src"
$outputFile = Join-Path $PSScriptRoot "trustpilot-plugin.zip"

$files = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object { $_.Extension -notin @('.svg', '.sh') }

if ($files.Count -eq 0) {
    Write-Error "No files found to package"
}

$tempDir = Join-Path $PSScriptRoot ".pack-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

$srcInZip = Join-Path $tempDir "src"
New-Item -ItemType Directory -Path $srcInZip -Force | Out-Null

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1)
    $destPath = Join-Path $srcInZip $relativePath
    $destFolder = Split-Path $destPath -Parent

    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    }

    Copy-Item $file.FullName -Destination $destPath
}

Copy-Item (Join-Path $PSScriptRoot "manifest.json") -Destination $tempDir

if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $outputFile

Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Packaged $($files.Count) files to: $outputFile"
