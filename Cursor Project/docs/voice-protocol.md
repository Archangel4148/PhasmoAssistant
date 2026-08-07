# Voice Protocol

## Status

Phase 6 — Vosk listener with wake word. Domain normalizes utterances into investigation actions.

## Transport

```text
Microphone
  → Vosk (sidecar/vosk_listener.py)
  → wake word "trigger"
  → voice_command utterance
  → Rust event
  → TypeScript domain resolveVoiceCommand
  → investigation store applyVoiceAction
```

Diagnostics / logs from Python must use **stderr** only.

## Sidecar stdout events

| `event` | Fields | Meaning |
|---------|--------|---------|
| `voice_status` | `status`: `offline` \| `starting` \| `listening` \| `error` | Lifecycle |
| `voice_command` | `command`, `value?` | Semantic or `utterance` payload |
| `sidecar_error` | `message`, `recoverable?` | Recoverable failure / setup help |

### Vosk utterance example

```json
{"event":"voice_command","command":"utterance","value":"emf five"}
```

### Semantic examples (mock / tests)

```json
{"event":"voice_command","command":"set_evidence","value":"emf5"}
{"event":"voice_command","command":"smudge"}
{"event":"voice_command","command":"timer"}
```

## Wake word

Commands are only emitted after `trigger` in the same utterance, or within ~4 seconds after a bare `trigger`.

Ignored without wake word.

## Domain resolution (`src/domain/voice`)

| Input | Action |
|-------|--------|
| evidence phrases (`emf five`, `spirit box`, …) | confirm evidence (voiceConfirmed) |
| `smudge` | start smudge timer (180s) |
| `timer` / timing phrases | toggle timing mode |
| `hunt cooldown` phrases | start hunt cooldown (25s) |
| unrelated text | ignored |

## Missing model / deps

Sidecar emits `sidecar_error` with setup instructions, sets `voice_status: error`, exits 0. App UI remains usable. Use **Restart Sidecar** after installing:

```powershell
pip install -r sidecar/requirements.txt
# extract vosk-model-small-en-us-0.15 into sidecar/models/
```

## React → Rust commands

| Command | Purpose |
|---------|---------|
| `get_sidecar_status` | Connection + voice status |
| `restart_voice_sidecar` | Relaunch single sidecar process |
| `stop_voice_sidecar` | Stop sidecar |

## Process selection

1. `sidecar/vosk_listener.py` (default)
2. `mock_listener.py` if Vosk script missing or `PHASMO_VOICE_MOCK=1`
