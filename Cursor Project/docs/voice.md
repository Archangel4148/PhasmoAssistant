# Voice Recognition

## Pipeline

```text
Microphone
  → Python / Vosk (phasmophobia-voice.exe or vosk_listener.py)
  → wake word "trigger"
  → JSON line on stdout
  → Rust sidecar manager
  → typed Tauri events
  → React bridge / stores
  → domain resolveVoiceCommand
  → investigation store applyVoiceAction
```

Voice is entirely local/offline. Diagnostics and logs from the sidecar must use **stderr only** — stdout is the IPC channel.

## Sidecar lifecycle

Exactly one voice sidecar process is supervised by Rust.

Rust responsibilities:

- Launch / stop / restart
- Parse stdout JSON lines
- Emit typed events (`voice_status`, `voice_command`, `sidecar_error`)
- Stop sidecar when Main closes

Tauri commands:

| Command | Purpose |
|---------|---------|
| `get_sidecar_status` | Connection + voice status |
| `restart_voice_sidecar` | Relaunch (`deviceName?` preferred mic label) |
| `stop_voice_sidecar` | Stop process |

## Process selection

1. **Release:** packaged `phasmophobia-voice.exe` + absolute `--model`
2. **Dev (`tauri dev`):** prefer `sidecar/vosk_listener.py` via `py`/`python`
3. **Fallback:** `mock_listener.py` if Vosk unavailable, or `PHASMO_VOICE_MOCK=1`

Windows `\\?\` path prefixes are stripped before spawn — Vosk rejects them.

## JSON protocol (stdout)

One JSON object per line.

| `event` | Fields | Meaning |
|---------|--------|---------|
| `voice_status` | `status`: `offline` \| `starting` \| `listening` \| `error` | Lifecycle |
| `voice_command` | `command`, `value?` | Semantic command or `utterance` |
| `sidecar_error` | `message`, `recoverable?` | Recoverable failure / setup help |

Examples:

```json
{"event":"voice_command","command":"utterance","value":"emf five"}
{"event":"voice_command","command":"set_evidence","value":"emf5"}
{"event":"voice_command","command":"smudge"}
{"event":"voice_status","status":"listening"}
```

## Wake word

Commands are only accepted after wake word **`trigger`**:

- In the same utterance (`trigger emf five`), or
- Within ~4 seconds after a bare `trigger`

Speech without the wake word is ignored.

## Domain resolution

Canonical implementation: `src/domain/voice/normalizeCommand.ts` (`VOICE_COMMAND_CATALOG` is also shown in-app under Diagnostics → **View accepted voice phrases**).

| Input | Action |
|-------|--------|
| Evidence phrase (`emf five`, `spirit box`, `ultraviolet`, `ghost writing`, `orbs`, `freezing`, `dots`, …) | Confirm evidence |
| Negation (`not` / `eliminate` / `no` / `clear` / `rule out` / `ruled out`) + evidence phrase | Eliminate evidence |
| `smudge` / `smudge stick` / `use smudge` | Toggle/start smudge timer |
| `timer` / `timing` / `timing mode` / `start timing` | Toggle timing mode |
| `hunt` / `hunt timer` / `hunt cooldown` / `cooldown` | Toggle/start hunt cooldown |
| `reset hunt` / `clear hunt` (+ timer/cooldown variants) | Reset hunt cooldown idle |
| `clear evidence` / `reset evidence` / `clear investigation` / `reset investigation` | Full investigation reset |
| Unrelated text | Ignored |

Elimination uses the **same** evidence vocabulary with a negation prefix — not a separate phrase list.

Examples: `trigger emf five` → confirm; `trigger not emf five` → eliminate; `trigger clear evidence` → reset.

## Microphone

Settings persist device **label** (browser `deviceId` is not usable by `sounddevice`). Rust passes `--device-name`; the sidecar substring-matches input device names. Empty → system default.

**None (voice disabled)** sets `microphone.enabled = false` and stops the sidecar.

## Release packaging

`npm run sidecar:prepare` (also first step of `npm run tauri:build`):

1. Creates `.venv-sidecar` and installs deps + PyInstaller
2. Downloads `vosk-model-small-en-us-0.15` if missing
3. Freezes `vosk_listener.py` → `sidecar/dist/phasmophobia-voice/`
4. Stages exe + model into `src-tauri/resources/` for the NSIS bundle

End users do not need Python or a separate model download.

## Failure behavior

- Missing model/deps/script → `sidecar_error` + voice error; app remains usable
- Unexpected exit → voice error; Diagnostics can restart
- Main close → sidecar stopped before exit

## Agent guidance

- Keep raw speech recognition outside React
- Preserve single-sidecar lifecycle and stderr/stdout split
- Change phrases only in `normalizeCommand.ts` (catalog stays the single source)
- Update this document when protocol or lifecycle changes
- Test failure/restart paths, not only happy-path recognition
