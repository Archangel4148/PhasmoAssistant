# Architecture

## 1. System overview

The application is a Tauri v2 desktop application with two synchronized webview windows:

- **Main Window** — full investigation/control UI (typically a second monitor).
- **Overlay Window** — transparent, click-through HUD for in-game use.

The frontend is React/TypeScript. Business rules are isolated in a UI-independent TypeScript domain layer. Rust handles Tauri commands, cross-window synchronization, and voice-sidecar process management.

```text
                     ┌──────────────────────┐
                     │ Python / Vosk         │
                     │ voice sidecar         │
                     └──────────┬───────────┘
                                │ JSON stdout
                                ▼
                     ┌──────────────────────┐
                     │ Rust / Tauri         │
                     │ sidecar + sync       │
                     └──────────┬───────────┘
                                │
                       state_changed / commands
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
        Main Zustand view              Overlay Zustand view
                 │                             │
                 ▼                             ▼
           Main Window                    Overlay Window

                 └──── TypeScript domain ────┘
                   evidence / ghosts / timers /
                   speed / voice normalize
```

## 2. Product constraints

- Offline after installation (no cloud, accounts, or telemetry).
- No remote speech recognition.
- No game memory reading, game file modification, input injection, or automation.
- Optional subsystems (voice) must fail closed without breaking the rest of the app.

## 3. Dependency direction

```text
React/UI → State → Domain → Data
Rust/Tauri → Domain (snapshot/events; no duplicated filters)
Overlay UI → State (synced view only)
```

Forbidden: React → Python; parallel business-rule implementations; Overlay as an independent investigation authority.

## 4. Technology

- Tauri v2 / Rust
- React 19, TypeScript strict, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion, Zustand
- Python + Vosk; PyInstaller for release sidecar packaging
- Tauri Store; `tauri-plugin-global-shortcut`
- Vitest; NSIS installer

## 5. Frontend structure

```text
src/
  components/       Shared UI
  windows/
    Main/           Main window entry/UI
    Overlay/        Overlay window entry/UI
  domain/
    evidence/       Evidence state/rules
    ghosts/         Ghost filtering/display builders
    timers/         Deadline-based timer logic
    speed/          Footstep timing / comparison
    voice/          Phrase → action normalization
  state/            Zustand synchronized views
  services/         Tauri IPC facades
  data/             Static datasets (ghosts, etc.)
  hooks/
  types/
  config/           Defaults (e.g. hotkeys)
  lib/              Display/formatting helpers
  styles/           Global CSS/design tokens
```

## 6. Rust structure

```text
src-tauri/src/
  commands/         Tauri invoke handlers
  sidecar/          Voice process manager + JSON protocol
  state/            Investigation snapshot mirror
```

## 7. Domain ownership

The domain layer is the single implementation of business rules:

- Evidence state transitions and validation
- Ghost filtering and display-item construction
- Evidence difficulty behavior
- Timer/deadline logic
- Footstep speed calculation and profile comparison
- Voice utterance → action normalization (`src/domain/voice`)

React components consume resulting state; they do not reimplement filtering.

## 8. Cross-window state synchronization

```text
Main Zustand mutation
    ↓
publish_investigation_snapshot (Tauri command)
    ↓
Rust AppState mirror
    ↓
state_changed event
    ↓
Overlay hydrateFromSnapshot
    ↓
Overlay Zustand view
    ↓
domain filtering reapplied from evidence
```

Main is the sync publisher. Overlay is a read-only listener plus initial snapshot consumer.

Rust stores a serializable snapshot (evidence map, overlay fields, toasts, timers, etc.). Rust does **not** reimplement TypeScript ghost filtering.

**Open item:** a full Rust-owned mutation path for evidence is not implemented; Main mutates locally and publishes.

## 9. Voice architecture

Exactly one voice sidecar process. Pipeline: mic → Vosk → JSON stdout → Rust → typed events → React → domain `resolveVoiceCommand` → investigation store.

Wake word, protocol shapes, and phrase map: `docs/voice.md`.

## 10. Overlay architecture

Separate Tauri window: transparent, undecorated, always-on-top, skip taskbar, non-focusable, click-through. Edit Layout temporarily enables interaction; play mode restores click-through.

Defaults and layout: `docs/overlay.md`.

## 11. Persistence

Tauri Store (`preferences.json`) persists preferences and layout — **not** active investigation state.

Details: `docs/state.md`.

## 12. Hotkeys (defaults)

| Action | Default |
|--------|---------|
| Toggle footstep timing | `CommandOrControl+Shift+T` |
| Record footstep (while timing armed) | `Space`, `Numpad0` |

Configurable via Settings (toggle timing accelerator). See `src/config/hotkeys.ts`.

## 13. Design system

CSS tokens for surfaces, text, accent (mist/steel), success/warning/danger. Overlay uses quieter glass styling. Fonts: Source Sans 3 Variable, IBM Plex Mono (bundled offline).

## 14. Important current limitations

- Full Rust-owned evidence mutation path not implemented.
- Apocalypse mode disables evidence cycling (Exclude / behavior only).
- Some ghost behavioral notes remain informational (not full hunt simulation).

Do not treat `archived_old_docs/SPEC.md` as authoritative where this document describes later implementation.
