# Build & Release

## Development stack

Frontend: Vite 7. Backend: Tauri v2 / Rust. Tailwind CSS v4 via `@tailwindcss/vite`.

### Common commands

```powershell
npm install
npm run tauri dev          # daily development
npm run clean              # wipe dist / Rust target / staged release sidecar
npm run typecheck
npm run lint
npm run test
cargo check --manifest-path src-tauri/Cargo.toml
```

Voice in development uses `sidecar/vosk_listener.py` when Python is available. Mock: `$env:PHASMO_VOICE_MOCK="1"`.

## Sidecar preparation

```powershell
npm run sidecar:prepare
```

Also runs automatically as the first step of `npm run tauri:build`.

Preparation:

1. Creates `.venv-sidecar`
2. Installs `sidecar/requirements.txt` + PyInstaller
3. Downloads `vosk-model-small-en-us-0.15` if missing
4. Freezes `vosk_listener.py` into `sidecar/dist/phasmophobia-voice/`
5. Stages exe + model into `src-tauri/resources/`

## Tauri packaging

Release target: **NSIS**.

Bundled resources:

```text
$RESOURCE/phasmophobia-voice/phasmophobia-voice.exe
$RESOURCE/models/vosk-model-small-en-us-0.15/
```

Typical installer path:

```text
src-tauri/target/release/bundle/nsis/Phasmophobia Companion_<version>_x64-setup.exe
```

End users do not need Python or a separately downloaded Vosk model.

## Sidecar selection

| Mode | Preference |
|------|------------|
| Release | Packaged exe + absolute `--model` |
| `tauri dev` | Python `vosk_listener.py` (avoids staged release artifacts) |
| Fallback | `mock_listener.py` / `PHASMO_VOICE_MOCK=1` |

Windows `\\?\` prefixes are stripped before spawn (Vosk rejects them).

## Persistence

Tauri Store file: `preferences.json` (window geometry, overlay, settings, hotkeys, theme, microphone). Active investigations are not persisted.

## Versioning & release process

Use **semver** on `package.json` / `src-tauri/tauri.conf.json` `version` (keep them aligned).

1. Land changes on the maintenance branch; update docs/ADRs as needed.
2. Add a `CHANGELOG.md` entry under the new version (Added / Changed / Fixed).
3. Bump version in `package.json` and `src-tauri/tauri.conf.json`.
4. Validate:

```powershell
npm run typecheck
npm run lint
npm run test
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```

5. Smoke-test the NSIS install on a clean machine when practical:
   - App starts without Python on PATH
   - Voice reaches listening (or recoverable mic error — not “install Python”)
   - Overlay click-through
   - Preferences survive restart
   - Sidecar restart from Diagnostics

6. Tag the release (`vX.Y.Z`) and distribute the setup EXE.

Do not rewrite historical `archived_old_docs/`; record release changes in `CHANGELOG.md`.

## Icons

Master: `assets/app-icon-transparent.png`. Regenerate with `npx tauri icon`, then copy favicons into `public/` (see `assets/README.md`). After icon changes, `npm run clean` (or `cargo clean`) so the next build re-embeds the ICO.
