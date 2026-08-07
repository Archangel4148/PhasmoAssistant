# Voice Protocol

## Status

Phase 5 — mock sidecar transport implemented. Vosk / wake-word arrive in Phase 6.

## Transport

```text
Python sidecar
  → stdout (one JSON object per line)
  → Rust parser (`src-tauri/src/sidecar/protocol.rs`)
  → Tauri events
  → React (`useVoiceSidecarBridge`)
```

Diagnostics / logs from Python must use **stderr** only so they do not corrupt the JSON channel.

## Sidecar stdout events

| `event` | Fields | Meaning |
|---------|--------|---------|
| `voice_status` | `status`: `offline` \| `starting` \| `listening` \| `error` | Lifecycle |
| `voice_command` | `command`: string, `value`?: string | Normalized semantic command |
| `sidecar_error` | `message`: string, `recoverable`?: bool | Recoverable failure |

### Examples

```json
{"event":"voice_status","status":"starting"}
{"event":"voice_status","status":"listening"}
{"event":"voice_command","command":"set_evidence","value":"emf5"}
{"event":"sidecar_error","message":"Simulated sidecar crash","recoverable":true}
```

## Rust → React events

| Event | Payload | Notes |
|-------|---------|-------|
| `voice_status` | `{ status }` | Mirrors sidecar lifecycle |
| `voice_command` | `{ command, value }` | Phase 5: logged in Diagnostics only |
| `sidecar_error` | `{ message, recoverable }` | Does not crash the app |
| `state_changed` | investigation snapshot | Unrelated to voice; Phase 4 sync |

## React → Rust commands

| Command | Purpose |
|---------|---------|
| `get_sidecar_status` | Connection + voice status snapshot |
| `restart_voice_sidecar` | Stop then start the single sidecar process |
| `stop_voice_sidecar` | Kill sidecar; set voice offline |

## Process model

- Exactly **one** sidecar process (`SidecarManager`).
- Phase 5 runs `sidecar/mock_listener.py` via `py -3` / `python` / `python3`.
- Launch failure is reported via `sidecar_error`; the desktop app continues.
- Closing Main stops the sidecar, destroys Overlay, and exits.

### Mock listener flags

```text
--demo-interval 15   # emit demo voice_command lines (0 disables)
--crash-after 0      # optional non-zero exit for failure testing
```
