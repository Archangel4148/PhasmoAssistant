# Staged release resources

This folder is filled by `npm run sidecar:prepare` (or `npm run tauri:build`).

Contents after prepare:

- `phasmophobia-voice/` — PyInstaller onedir for the voice sidecar
- `models/vosk-model-small-en-us-0.15/` — Vosk speech model

Do not commit the binary/model trees; they are gitignored. Tauri bundles them into the NSIS installer via `tauri.conf.json` → `bundle.resources`.
