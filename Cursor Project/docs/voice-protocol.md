# Voice Protocol

## Status

Not implemented — Phase 5/6.

## Planned transport

Python Vosk sidecar → **stdout** (one JSON object per line) → Rust parser → Tauri events → React.

## Planned event types

| Event | Direction | Purpose |
|-------|-----------|---------|
| `voice_command` | Sidecar → Rust → React | Normalized semantic command |
| `voice_status` | Sidecar → Rust → React | Lifecycle: offline, starting, listening, error |
| `sidecar_error` | Sidecar → Rust → React | Recoverable sidecar failure |

See `SPEC.md` §11–13 for full requirements. This document will be updated when the protocol is implemented.
