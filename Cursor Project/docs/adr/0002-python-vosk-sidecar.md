# ADR 0002 — Python/Vosk Voice Sidecar

## Status

Accepted

## Decision

Run local Vosk voice recognition in a single Python sidecar process managed by Rust.

## Rationale

Vosk provides offline speech recognition, while Python keeps the recognition implementation isolated from the Tauri application. Rust is responsible for lifecycle and IPC, keeping React independent of the process boundary.

The release process freezes the Python implementation with PyInstaller so users do not need Python installed.

## Consequence

The application has an additional process boundary and packaging step, but voice recognition remains offline, replaceable, and isolated from UI failures.
