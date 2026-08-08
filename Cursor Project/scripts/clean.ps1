#Requires -Version 5.1
<#
.SYNOPSIS
  Clear build artifacts so the next `npm run tauri dev` is a clean dev run.

.DESCRIPTION
  Removes frontend dist, Rust target output, PyInstaller build/dist, and staged
  release resources under src-tauri/resources (keeps README + placeholder dirs).

  Does NOT delete:
  - node_modules
  - .venv-sidecar
  - sidecar/models (voice model download)
  - source icons under assets/ or src-tauri/icons/
#>

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Remove-PathSafe([string]$Path, [string]$Label) {
  if (Test-Path $Path) {
    Write-Host "Removing $Label"
    Remove-Item -Recurse -Force $Path
  }
  else {
    Write-Host "Skip $Label (not present)"
  }
}

Write-Host "==> Cleaning Phasmophobia Companion build artifacts" -ForegroundColor Cyan

Remove-PathSafe (Join-Path $Root "dist") "frontend dist/"
Remove-PathSafe (Join-Path $Root "sidecar\dist") "sidecar/dist/"
Remove-PathSafe (Join-Path $Root "sidecar\build") "sidecar/build/"

$Resources = Join-Path $Root "src-tauri\resources"
Remove-PathSafe (Join-Path $Resources "phasmophobia-voice") "staged phasmophobia-voice/"
Remove-PathSafe (Join-Path $Resources "models") "staged models/"

# Restore empty resource placeholders so tauri.conf.json resource paths still exist.
$voicePlaceholder = Join-Path $Resources "phasmophobia-voice"
$modelPlaceholder = Join-Path $Resources "models\vosk-model-small-en-us-0.15"
New-Item -ItemType Directory -Force -Path $voicePlaceholder | Out-Null
New-Item -ItemType Directory -Force -Path $modelPlaceholder | Out-Null
Set-Content -Path (Join-Path $voicePlaceholder ".gitkeep") -Value ""
Set-Content -Path (Join-Path $modelPlaceholder ".gitkeep") -Value ""
Write-Host "Restored src-tauri/resources placeholders"

$CargoToml = Join-Path $Root "src-tauri\Cargo.toml"
if (Test-Path $CargoToml) {
  Write-Host "Running cargo clean"
  cargo clean --manifest-path $CargoToml
  if ($LASTEXITCODE -ne 0) {
    throw "cargo clean failed with exit $LASTEXITCODE"
  }
}

Write-Host ""
Write-Host "Clean complete. Next: npm run tauri dev" -ForegroundColor Green
Write-Host "Note: icons re-embed on the next Rust rebuild; Windows may still cache taskbar icons briefly."
