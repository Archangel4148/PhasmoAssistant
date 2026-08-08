# Voice Sidecar

## Scripts

| Script | Purpose |
|--------|---------|
| `vosk_listener.py` | Default listener — Vosk + wake word `trigger` |
| `mock_listener.py` | Transport mock / forced mock mode |
| `phasmophobia-voice.spec` | PyInstaller onedir freeze for release builds |

## Development setup

```powershell
pip install -r requirements.txt
# or: npm run sidecar:prepare  (also downloads the model + freezes the exe)
```

Download `vosk-model-small-en-us-0.15` into `models/` (see `models/README.md`), **or** let `npm run sidecar:prepare` fetch it.

`npm run tauri dev` launches `vosk_listener.py` via `py`/`python` when no packaged exe is present.

## Release / one-click install

```powershell
npm run sidecar:prepare   # venv + model + PyInstaller + stage into src-tauri/resources
npm run tauri:build       # prepare + Tauri NSIS installer
```

Installer output: `src-tauri/target/release/bundle/nsis/`

Packaged layout inside the app:

- `phasmophobia-voice/phasmophobia-voice.exe`
- `models/vosk-model-small-en-us-0.15/`

Rust prefers the packaged exe and passes `--model <absolute path>`. End users do **not** need Python.

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

or Rust fallback when neither packaged exe nor `vosk_listener.py` is available.
