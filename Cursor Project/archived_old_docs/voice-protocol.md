# Voice Protocol

## Status

Phase 6 — Vosk listener with wake word. Domain normalizes utterances into investigation actions.

## Transport

```text
Microphone
  → Vosk (packaged phasmophobia-voice.exe or vosk_listener.py)
  → wake word "trigger"
  → voice_command utterance
  → Rust event
  → TypeScript domain resolveVoiceCommand
  → investigation store applyVoiceAction
```

Diagnostics / logs from the sidecar must use **stderr** only.

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
| negation (`not` / `eliminate` / `no` / `clear` / `rule out` / `ruled out`) + evidence phrase | eliminate that evidence |
| `smudge` | start smudge timer |
| `timer` / timing phrases | toggle timing mode |
| `hunt cooldown` phrases | start hunt cooldown |
| `reset hunt` / `clear hunt` phrases | reset hunt cooldown timer |
| `clear evidence` / `reset evidence` / `clear investigation` / `reset investigation` | reset full investigation state |
| unrelated text | ignored |

Elimination is the same evidence vocabulary with a negation prefix — not a separate phrase list. Accepted phrases are listed in-app under Diagnostics → **View accepted voice phrases** (`VOICE_COMMAND_CATALOG`).

Microphone Settings includes **None (voice disabled)** (`microphone.enabled = false`), which stops the sidecar.

## Missing model / deps

Sidecar emits `sidecar_error` with setup instructions, sets `voice_status: error`, exits 0. App UI remains usable.

**Development:**

```powershell
pip install -r sidecar/requirements.txt
# extract vosk-model-small-en-us-0.15 into sidecar/models/
# or: npm run sidecar:prepare
```

**Packaged installs:** model + runtime ship inside the NSIS installer; errors ask the user to Restart Sidecar or reinstall (no pip).

## React → Rust commands

| Command | Purpose |
|---------|---------|
| `get_sidecar_status` | Connection + voice status |
| `restart_voice_sidecar` | Relaunch single sidecar process (`deviceName?` preferred mic label) |
| `stop_voice_sidecar` | Stop sidecar |
| `set_overlay_interactive` | Toggle overlay click-through / focusable / resizable for layout edit |

### Microphone selection

Browser `deviceId` is not usable by sounddevice. The UI persists the device **label**; Rust passes `--device-name` to the sidecar, which substring-matches `sounddevice` input names. Empty/null → system default. Changing the mic in Settings (or Restart Sidecar) relaunches with the preferred label.

## Process selection

1. Packaged `phasmophobia-voice.exe` (resource/staged/dist) with absolute `--model`
2. `sidecar/vosk_listener.py` via `py`/`python` (development)
3. `mock_listener.py` if Vosk unavailable or `PHASMO_VOICE_MOCK=1`
