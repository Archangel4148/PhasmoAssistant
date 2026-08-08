#Requires -Version 5.1
<#
.SYNOPSIS
  Prepare the packaged voice sidecar for Tauri release builds.

.DESCRIPTION
  - Creates .venv-sidecar and installs vosk/sounddevice + PyInstaller
  - Downloads the Vosk model if missing
  - Freezes vosk_listener.py into sidecar/dist/phasmophobia-voice/
  - Stages exe + model into src-tauri/resources/ for clean Tauri resource paths
#>

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$SidecarDir = Join-Path $Root "sidecar"
$VenvDir = Join-Path $Root ".venv-sidecar"
$ModelName = "vosk-model-small-en-us-0.15"
$ModelDir = Join-Path (Join-Path $SidecarDir "models") $ModelName
$ModelZipUrl = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
$DistDir = Join-Path (Join-Path $SidecarDir "dist") "phasmophobia-voice"
$ExePath = Join-Path $DistDir "phasmophobia-voice.exe"
$ResourcesDir = Join-Path (Join-Path $Root "src-tauri") "resources"
$StagedExeDir = Join-Path $ResourcesDir "phasmophobia-voice"
$StagedModelDir = Join-Path (Join-Path $ResourcesDir "models") $ModelName

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-PythonVenv {
  Write-Step "Ensuring sidecar virtualenv at .venv-sidecar"
  if (-not (Test-Path $VenvDir)) {
    $created = $false
    foreach ($launcher in @(
      @{ Cmd = "py"; Args = @("-3", "-m", "venv", $VenvDir) },
      @{ Cmd = "python"; Args = @("-m", "venv", $VenvDir) },
      @{ Cmd = "python3"; Args = @("-m", "venv", $VenvDir) }
    )) {
      if (Get-Command $launcher.Cmd -ErrorAction SilentlyContinue) {
        & $launcher.Cmd @($launcher.Args)
        if ($LASTEXITCODE -eq 0 -and (Test-Path $VenvDir)) {
          $created = $true
          break
        }
      }
    }
    if (-not $created) {
      throw "Could not create virtualenv. Install Python 3 and ensure py/python is on PATH."
    }
  }

  $script:Python = Join-Path (Join-Path $VenvDir "Scripts") "python.exe"
  if (-not (Test-Path $script:Python)) {
    throw "Virtualenv python missing at $($script:Python)"
  }

  Write-Step "Installing sidecar requirements + PyInstaller"
  & $script:Python -m pip install --upgrade pip
  if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed" }
  & $script:Python -m pip install -r (Join-Path $SidecarDir "requirements.txt") "pyinstaller>=6.0"
  if ($LASTEXITCODE -ne 0) { throw "pip install failed" }
}

function Ensure-VoskModel {
  $marker = Join-Path (Join-Path $ModelDir "am") "final.mdl"
  if ((Test-Path $ModelDir) -and (Test-Path $marker)) {
    Write-Step "Vosk model already present"
    return
  }

  Write-Step "Downloading Vosk model $ModelName"
  $modelsParent = Join-Path $SidecarDir "models"
  New-Item -ItemType Directory -Force -Path $modelsParent | Out-Null
  $zipPath = Join-Path $modelsParent "$ModelName.zip"

  Invoke-WebRequest -Uri $ModelZipUrl -OutFile $zipPath -UseBasicParsing

  if (Test-Path $ModelDir) {
    Remove-Item -Recurse -Force $ModelDir
  }

  Expand-Archive -Path $zipPath -DestinationPath $modelsParent -Force
  Remove-Item -Force $zipPath

  if (-not (Test-Path $marker)) {
    throw "Model download/extract failed - expected $marker"
  }
}

function Build-PyInstaller {
  Write-Step "Building phasmophobia-voice with PyInstaller (onedir)"
  Push-Location $SidecarDir
  try {
    & $script:Python -m PyInstaller --noconfirm --clean "phasmophobia-voice.spec"
    if ($LASTEXITCODE -ne 0) { throw "PyInstaller failed with exit $LASTEXITCODE" }
  }
  finally {
    Pop-Location
  }

  if (-not (Test-Path $ExePath)) {
    throw "Expected packaged exe at $ExePath"
  }
}

function Stage-Resources {
  Write-Step "Staging Tauri resources under src-tauri/resources"
  New-Item -ItemType Directory -Force -Path $ResourcesDir | Out-Null

  if (Test-Path $StagedExeDir) {
    Remove-Item -Recurse -Force $StagedExeDir
  }
  New-Item -ItemType Directory -Force -Path (Split-Path $StagedExeDir -Parent) | Out-Null
  Copy-Item -Recurse -Force $DistDir $StagedExeDir

  $stagedModelsParent = Join-Path $ResourcesDir "models"
  New-Item -ItemType Directory -Force -Path $stagedModelsParent | Out-Null
  if (Test-Path $StagedModelDir) {
    Remove-Item -Recurse -Force $StagedModelDir
  }
  Copy-Item -Recurse -Force $ModelDir $StagedModelDir

  $stagedExe = Join-Path $StagedExeDir "phasmophobia-voice.exe"
  if (-not (Test-Path $stagedExe)) {
    throw "Staged exe missing at $stagedExe"
  }
  if (-not (Test-Path (Join-Path (Join-Path $StagedModelDir "am") "final.mdl"))) {
    throw "Staged model incomplete at $StagedModelDir"
  }
}

Ensure-PythonVenv
Ensure-VoskModel
Build-PyInstaller
Stage-Resources

Write-Host ""
Write-Host "Sidecar prepare complete." -ForegroundColor Green
Write-Host "  Exe:   $ExePath"
Write-Host "  Model: $ModelDir"
Write-Host "  Stage: $ResourcesDir"
