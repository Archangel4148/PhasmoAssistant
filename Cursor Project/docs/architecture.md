# Architecture

## Phase 1 — Scaffold (complete)

### Stack

- **Desktop:** Tauri v2 (Rust)
- **Frontend:** React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion, Zustand
- **Build:** Vite 7

### Current structure

```text
src/
  components/       # Shared UI (Header, panels, Settings dialog)
  windows/
    Main/           # MainWindow entry component
    Overlay/        # Overlay window (Phase 4)
  domain/
    evidence/       # Evidence state transitions and queries
    ghosts/         # Ghost filtering and display-item builders
  state/            # Zustand stores (synchronized views)
  services/         # Tauri IPC facades (Phase 3+)
  data/             # Static datasets + subsystem placeholders
  hooks/
  types/
  lib/              # Display helpers (formatting)
  styles/           # Tailwind globals

src-tauri/src/
  commands/         # Tauri invoke handlers
  sidecar/          # Voice sidecar process + JSON protocol
  state/            # Investigation snapshot mirror
```

### Decisions

- Rust mirrors investigation snapshots for multi-window sync; TypeScript domain remains the single filtering implementation.
- Tailwind v4 is integrated via `@tailwindcss/vite` (no separate PostCSS config).
- Zustand stores in each window are synchronized views fed by Rust `state_changed` events.

---

## Phase 2 — Main Window UI (complete)

Static mock-data-driven Main Window shell. See git history / prior docs for layout and component breakdown.

---

## Phase 3 — State and Domain Logic (complete)

### Scope

Evidence tracking and ghost filtering via a domain layer and Zustand investigation store. UI reads derived state; components do not implement filtering rules.

### Domain layer

| Module | Responsibility |
|--------|----------------|
| `domain/evidence/evidenceRules.ts` | Cycle evidence states; query confirmed/eliminated ids |
| `domain/evidence/evidenceState.ts` | Evidence map CRUD helpers |
| `domain/ghosts/filterPossibleGhosts.ts` | Determine which ghosts remain possible |
| `domain/ghosts/buildGhostDisplayItems.ts` | Attach `isPossible` to ghost roster (stable order) |

**Filtering rules** (single implementation):

1. A **confirmed** evidence type requires the ghost to include that evidence.
2. An **eliminated** evidence type excludes ghosts that have that evidence.
3. Manually eliminated ghost ids (reserved for future use) exclude those ghosts.

All 24 ghosts remain in the list; impossible entries receive `isPossible: false` for UI de-emphasis.

### State

`src/state/investigationStore.ts`:

- Local investigation view (Rust sync deferred).
- Holds `evidence` / `eliminatedGhostIds` plus derived `evidenceEntries`, `ghosts`, and `possibleGhostCount`.
- Derived fields are recomputed **only when evidence mutations occur** (not on every React render), so Zustand selectors stay referentially stable.
- Actions: `cycleEvidence`, `setEvidenceState`, `resetInvestigation`.
- Filtering always goes through `domain/ghosts` — UI only reads `isPossible`.

Timers still use investigation-store placeholders until Phase 8–9. Voice/diagnostics are live via the sidecar bridge (Phase 5).

### UI wiring

- **Evidence panel:** click cycles unknown → confirmed → eliminated; dispatches `cycleEvidence`.
- **Ghost panel:** renders store `ghosts`; opacity driven by `isPossible` only.
- **Header:** possible-ghost count from store `possibleGhostCount`.

### Testing

Vitest unit tests cover evidence cycling and ghost filtering (`npm run test`). No React/Tauri in domain tests.

### Known limitations (Phase 3)

- Zustand is the local source of truth; not yet synchronized with Rust or overlay window.
- Voice commands do not update evidence (`setEvidenceState` exists for Phase 6).
- Timers, speed calculator, and diagnostics remain static placeholders.
- Overlay window not created.
- Mimic fake-orbs behavior is not special-cased yet (Phase 7 evidence rules).

---

## Phase 4 — Overlay (complete)

### Scope

Second Tauri window: transparent HUD over the game, synchronized with Main investigation state.

### Window configuration

Overlay (`label: overlay`):

- `transparent`, `decorations: false`, `shadow: false`
- `alwaysOnTop`, `skipTaskbar`
- `focus: false`, `focusable: false`
- Maximized by default
- Rust `setup` calls `set_ignore_cursor_events(true)` for click-through
- Closing the Main window destroys the Overlay and exits the process (so the HUD is never left orphaned)

Main remains a normal decorated desktop window.

### State sync

```text
Main Zustand mutation
    → publish_investigation_snapshot (Tauri command)
    → Rust AppState mirror
    → emit state_changed
    → Overlay hydrateFromSnapshot
    → Overlay Zustand view (domain filtering reapplied from evidence)
```

- Ghost filtering still lives only in TypeScript domain code.
- Rust stores a serializable snapshot (evidence map + overlay fields + toasts); it does not reimplement filtering.
- Main is the sync publisher; Overlay is read-only listener (+ initial fetch).

### Overlay UI

| Region | Content |
|--------|---------|
| Top left → right | Horizontal possible-ghost ticker (softer default color; scrolls when overflowing; clears timer corner) |
| Top right | Smudge / hunt timers (idle ~40% opacity, active ~90%) |
| Center | Timing mode pulse (when active) |
| Bottom right | Toasts (~2.5s TTL), e.g. evidence confirmed |

Transparent page background via `html.overlay-window` CSS so chrome outside HUD elements does not paint.

### Overlay appearance settings

Settings → **Overlay HUD** (synced Main → Overlay via the same snapshot):

- Ghost text color (color picker, hex field, soft presets)
- Ticker speed (slider + numeric, 8–80 px/s; default 26)

Defaults use muted slate (`#9aa7b8`) instead of bright white.

### Known limitations (Phase 4)

- Overlay position/scale persistence is deferred (Phase 10).
- Timers/timing mode are synced fields but not yet interactive (Phase 8–9).
- Full Rust-owned mutation path (commands for evidence changes) is still future work; Main mutates locally then publishes.
- Mimic fake-orbs still not special-cased.

---

## Phase 5 — Python Sidecar (complete)

### Scope

Launch and supervise exactly one Python sidecar process. Parse JSON stdout, forward typed events to React, survive sidecar failures, support manual restart.

### Components

| Piece | Role |
|-------|------|
| `sidecar/mock_listener.py` | Mock listener (no Vosk yet); emits status + demo commands |
| `src-tauri/src/sidecar/` | Process manager + JSON protocol |
| Tauri commands | `get_sidecar_status`, `restart_voice_sidecar`, `stop_voice_sidecar` |
| `useVoiceSidecarBridge` | Main-window event subscription |
| `voiceDiagnosticsStore` | Diagnostics / header voice status |

### Failure handling

- Missing Python / script → `sidecar_error` + voice `error`; app UI remains usable.
- Unexpected process exit → error status; **Restart Sidecar** relaunches.
- Closing Main stops the sidecar before process exit.

### Known limitations (Phase 5)

- Mock only — no microphone / Vosk (Phase 6).
- Demo `voice_command` events are logged in Diagnostics but do not mutate evidence yet (Phase 6).
- Packaged PyInstaller binary not yet used (dev runs the `.py` script).
