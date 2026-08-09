# ADR 0005 — NSIS Installer With Packaged Voice Sidecar

## Status

Accepted

## Decision

Distribute the Windows application through a Tauri NSIS installer containing the PyInstaller-built voice sidecar and Vosk model.

## Rationale

The application should be usable by end users without requiring Python, Vosk, or a separately downloaded model. Packaging the sidecar and model makes installation self-contained.

## Consequence

Release preparation must build/stage the sidecar and model before Tauri packaging. The installer is responsible for delivering all required runtime resources.
