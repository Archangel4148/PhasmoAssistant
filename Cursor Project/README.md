# Phasmophobia Companion & Overlay

Offline-first Windows companion for **Phasmophobia**: investigation control panel + synchronized transparent overlay HUD.

**Version:** 0.1.0 · **Status:** production / maintenance

## What it provides

- Evidence tracking and automatic ghost filtering (Amateur–Professional through Apocalypse)
- Footstep speed timing and ghost-speed comparison
- Smudge and hunt timers
- Local Vosk voice recognition (wake word + phrases)
- Transparent, click-through overlay HUD with editable layout
- Configurable hotkeys, microphone, appearance, and overlay scale
- Diagnostics and sidecar recovery
- Persistent preferences — active investigations are **not** persisted

## Architecture at a glance

```text
Python / Vosk sidecar
        │ JSON stdout
        ▼
Rust / Tauri (sidecar manager + sync mirror)
        │ events + snapshot
        ▼
React / TypeScript — Main + Overlay (Zustand views)
        │
        └── TypeScript domain (evidence, ghosts, timers, speed, voice normalize)
```

Business rules live in the TypeScript domain layer. Rust synchronizes windows and owns process/infrastructure; it does not reimplement ghost filtering.

## Product constraints

- Entirely offline after install (no cloud, accounts, or telemetry)
- No remote speech recognition
- No game-memory reading, game-file modification, input injection, or automation

## Quick start

**Prerequisites:** Node.js (LTS), Rust + Windows MSVC, [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). Python 3 is needed for local voice *or* run `npm run sidecar:prepare` once.

```powershell
npm install
npm run tauri dev
```

Optional voice without packaging:

```powershell
pip install -r sidecar/requirements.txt
# model under sidecar/models/vosk-model-small-en-us-0.15/  — or: npm run sidecar:prepare
```

Mock voice (no mic): `$env:PHASMO_VOICE_MOCK="1"` then `npm run tauri dev`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Full desktop app (Main + Overlay) |
| `npm run clean` | Wipe build artifacts for a fresh dev run |
| `npm run typecheck` / `lint` / `test` | Validation |
| `npm run build` | Frontend production build |
| `npm run sidecar:prepare` | Freeze voice sidecar + stage Vosk model |
| `npm run tauri:build` | Prepare sidecar, then NSIS installer |

Installer output (typical): `src-tauri/target/release/bundle/nsis/`.

## Documentation map

| Doc | Purpose |
|-----|---------|
| [`AGENTS.md`](AGENTS.md) | Rules for AI coding agents / contributors |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Current system design |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |
| [`docs/voice.md`](docs/voice.md) | Sidecar lifecycle, protocol, phrases |
| [`docs/overlay.md`](docs/overlay.md) | Overlay window and layout |
| [`docs/state.md`](docs/state.md) | State ownership and persistence |
| [`docs/build.md`](docs/build.md) | Dev + release / versioning process |
| [`docs/testing.md`](docs/testing.md) | What to validate |
| [`docs/adr/`](docs/adr/) | Architectural decision records ([index](docs/adr/README.md)) |

`archived_old_docs/` holds the original build-phase SPEC and phase notes. It is **historical only** — not the source of truth for current behavior.

## Repository layout

```text
src/                 React UI, Zustand, domain, data, services
src-tauri/           Tauri/Rust host, sidecar manager, NSIS bundle
sidecar/             vosk_listener.py, mock listener, PyInstaller spec
scripts/             clean.ps1, prepare-sidecar.ps1
assets/              App icon masters
docs/                Topic docs + ADRs
```
