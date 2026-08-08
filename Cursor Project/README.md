# Phasmophobia Companion

Offline desktop companion and click-through overlay for [Phasmophobia](https://store.steampowered.com/app/739630/Phasmophobia/). Track evidence, filter ghosts, run smudge/hunt timers, time footsteps, and drive actions with a local wake-word voice sidecar — no cloud, no game memory reading, no telemetry.

**Product name:** Phasmophobia Companion  
**Platform:** Windows (Tauri v2 + NSIS installer)  
**Version:** 0.1.0

---

## What it does

- **Evidence board** with confirm / eliminate cycling and difficulty modes (Amateur–Professional through Apocalypse)
- **Ghost roster** filtered by evidence rules (single domain implementation)
- **Smudge & hunt cooldown** timers with auto-smudge duration when possible ghosts agree
- **Footstep timing** (hotkeys + overlay HUD) mapped to ghost speed profiles
- **Transparent always-on-top overlay** (click-through in play; editable layout from Settings)
- **Local voice control** via wake word `trigger` (Vosk), packaged into the release installer
- **Persisted preferences** (windows, theme, accent, mic, hotkeys) — investigation session state is not persisted

---

## Architecture (short)

```text
React UI  →  Zustand views  →  Domain (TS)  →  Data
                ↑ sync
            Rust / Tauri  →  Voice sidecar (PyInstaller exe or Python script)
```

Non-negotiables (see `AGENTS.md` + `SPEC.md`):

1. Rust coordinates windows / sidecar / persistence; React stores are synced views
2. Domain logic is UI-independent and tested without Tauri
3. One implementation per business rule (no duplicated filter/voice logic)
4. Exactly one voice sidecar process; React never talks to Python
5. Overlay never owns authoritative persistent state

Docs:

| Doc | Purpose |
|-----|---------|
| [`SPEC.md`](SPEC.md) | Product source of truth |
| [`AGENTS.md`](AGENTS.md) | AI / contributor operating contract |
| [`docs/architecture.md`](docs/architecture.md) | Implementation decisions by phase |
| [`docs/voice-protocol.md`](docs/voice-protocol.md) | Sidecar JSON protocol + phrases |
| [`docs/testing.md`](docs/testing.md) | Manual + automated verification |

---

## Repository layout

```text
src/                 React UI, Zustand, domain, data, services
src-tauri/           Tauri/Rust host, sidecar manager, NSIS bundle config
sidecar/             vosk_listener.py, mock listener, PyInstaller spec
scripts/             prepare-sidecar.ps1 (release freeze + model fetch)
assets/              App icon masters (app-icon.png, app-icon-rounded.png)
docs/                Architecture / voice / testing notes
public/              Favicon + static web assets
```

---

## Prerequisites (developers)

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/learn/get-started) + Windows MSVC toolchain
- [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/)
- **Python 3** on PATH (`py` or `python`) for local voice *or* run `npm run sidecar:prepare` once to freeze the sidecar
- Microphone permission when testing voice

End users of the **NSIS installer** do **not** need Python, Node, or Rust.

---

## Quick start (development)

```powershell
npm install
npm run tauri dev
```

Optional voice setup without packaging:

```powershell
pip install -r sidecar/requirements.txt
# Place vosk-model-small-en-us-0.15 under sidecar/models/
# or: npm run sidecar:prepare
```

Forced mock voice (no mic):

```powershell
$env:PHASMO_VOICE_MOCK="1"
npm run tauri dev
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Full desktop app (Main + Overlay) |
| `npm run clean` | Wipe build artifacts (dist, Rust target, staged release sidecar) for a fresh dev run |
| `npm run dev` | Vite only (no Tauri windows) |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run lint` | ESLint on `src/` |
| `npm run test` | Vitest domain/unit tests |
| `npm run build` | Production frontend build |
| `npm run sidecar:prepare` | Venv + model + PyInstaller + stage into `src-tauri/resources/` |
| `npm run tauri:build` | Prepare sidecar, then build Windows **NSIS** installer |

---

## Release / distribution

Build a one-click Windows installer (bundles app + `phasmophobia-voice.exe` + Vosk model):

```powershell
npm run tauri:build
```

Installer output (typical):

```text
src-tauri/target/release/bundle/nsis/Phasmophobia Companion_0.1.0_x64-setup.exe
```

Clean PCs: install the setup EXE — no Python/pip/model download required. SmartScreen may warn until the installer is code-signed.

### Icons

| File | Role |
|------|------|
| `assets/app-icon-transparent.png` | Master transparent icon (`npx tauri icon assets/app-icon-transparent.png`) |
| `assets/app-icon.png` | Same master (alias) |
| `assets/app-icon-rounded.png` | Rounded marketing / optional variant |
| `src-tauri/icons/*` | Generated desktop / installer icons |
| `public/favicon.png` / `favicon.ico` | Webview favicon |

---

## Voice commands (summary)

Wake word: **`trigger`**, then a phrase. Examples:

- `trigger emf five` — confirm evidence  
- `trigger not emf five` — eliminate evidence (negation + same evidence phrase)  
- `trigger smudge` / `trigger hunt` / `trigger timer`  
- `trigger reset hunt` / `trigger clear evidence`  

Full catalog: Diagnostics → **View accepted voice phrases**, or `docs/voice-protocol.md`.

---

## Verification before shipping

```powershell
npm run typecheck
npm run lint
npm run test
cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```

Also walk through [`docs/testing.md`](docs/testing.md) (overlay edit mode, geometry restore, voice disable, packaged install smoke).

---

## Contributing notes

1. Read `SPEC.md` and `AGENTS.md` before structural changes  
2. Prefer extending existing domain modules over parallel implementations  
3. Keep voice protocol stdout JSON-only (logs on stderr)  
4. Do not add cloud/telemetry/online speech without an explicit product decision  
5. Investigation session state stays ephemeral unless the SPEC changes

---

## License / ownership

Private project (`package.json` `"private": true`). Adjust licensing before a public release if needed.
