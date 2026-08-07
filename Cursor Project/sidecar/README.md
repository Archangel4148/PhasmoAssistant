# Voice Sidecar

## Scripts

| Script | Purpose |
|--------|---------|
| `vosk_listener.py` | Phase 6 default — Vosk + wake word `trigger` |
| `mock_listener.py` | Phase 5 transport mock / forced mock mode |

## Setup

```powershell
pip install -r requirements.txt
```

Download `vosk-model-small-en-us-0.15` into `models/` (see `models/README.md`).

## Behavior

- Wake word: `trigger` (required)
- After wake word, the remainder of the utterance (or the next phrase within ~4s) is emitted as:

```json
{"event":"voice_command","command":"utterance","value":"emf five"}
```

- TypeScript domain (`src/domain/voice`) normalizes utterances into evidence / timer actions.
- Missing model or dependencies → `sidecar_error` + `voice_status: error`, exit 0 (app keeps running).

## Forced mock

```powershell
$env:PHASMO_VOICE_MOCK="1"
```

or Rust fallback when `vosk_listener.py` is unavailable.
