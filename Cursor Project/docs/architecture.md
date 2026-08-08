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

Timers use deadline-based domain state (`domain/timers`); see Phase 8. Voice/diagnostics are live via the sidecar bridge (Phase 5).

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
- Full Rust-owned mutation path (commands for evidence changes) is still future work; Main mutates locally then publishes.

---

## Phase 7 — Ghost Filtering (complete)

### Scope

Finalize the complete 24-ghost dataset, data-driven evidence rules (including Mimic fake orbs), possible/impossible presentation, and domain tests.

### Dataset corrections

- Roster expanded to **30 ghosts** (classic 24 + Obambo, Gallu, Dayan, Kormos, Aswang, Deildegast).
- **Banshee / Jinn** evidence triples corrected.
- **Mimic:** journal triple + `alwaysPresentsEvidence: ["ghostOrbs"]`.
- Smudge durations corrected (most 90s; Spirit 180s; Demon 60s).
- Speeds/notes refreshed from current guides; `forcedEvidence` markers for Goryo, Deogen, Moroi, Hantu, Obake.

### Filtering rules (domain only)

Effective evidence = journal evidence ∪ `alwaysPresentsEvidence`.

1. Confirmed evidence requires the ghost’s effective set to include it.
2. Eliminated evidence excludes ghosts that effectively present it (so ruling out Orbs eliminates Mimic).
3. Manual `eliminatedGhostIds` still force-exclude.

### UI

- Ghost cards fade/scale when ruled out; positions stay stable (`layout`).
- Evidence chips reflect confirmed/eliminated investigation state.
- Mimic shows `Orbs*` chip for always-presented fake orbs.
- **Exclude / Include** toggles manual elimination (no filtering logic in the component).

### Known limitations (Phase 7)

- Reduced-evidence difficulty modes (Nightmare/Insanity) are not filtered yet; `forcedEvidence` is stored for future use.
- Wiki pages were cross-checked via community cheat sheets where fandom.com blocked automated fetches.
- Ghost behavioral rules beyond evidence filtering remain informational notes until later hunt/speed phases.

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

---

## Phase 6 — Voice Recognition (complete)

### Scope

Vosk-based local recognition with wake word `trigger`, domain command normalization, and investigation state updates.

### Pipeline

```text
vosk_listener.py → JSON utterance → Rust event → resolveVoiceCommand → applyVoiceAction
```

- Wake word gating lives in Python.
- Phrase → action mapping lives in `src/domain/voice` (tested; UI does not parse speech).
- Missing model/deps disable voice only; Diagnostics shows setup text.

### Known limitations (Phase 6)

- Microphone device picker not implemented (Phase 10 settings).
- PyInstaller packaging still deferred.
- Small English Vosk model must be downloaded manually into `sidecar/models/`.

---

## Phase 8 — Timers (complete)

### Scope

Stopwatch-style smudge and hunt-cooldown timers with Main/Overlay count-up UI, start/stop toggle, and end-threshold presets.

### Semantics

```text
Idle → start → Running (count up) → past threshold → Expired color (still counting)
         ↘ re-trigger / Stop → Idle (reset)
```

- Authoritative state: `InvestigationTimer { durationSeconds, startedAtMs }`.
- Elapsed time is **derived** from `Date.now()` via `domain/timers` (never incremented in the store).
- `durationSeconds` is the threshold (“end”); after it, the display keeps counting but switches color.
- Re-trigger (UI Start/Stop or voice) while active stops and resets to idle.
- Snapshot sync carries start timestamps (`smudgeTimer` / `huntTimer`), not tick-by-tick elapsed seconds.

### UI

- Investigation Tools: Start/Stop, Reset, duration presets (smudge 60/90/180; hunt 15/20/25).
- Overlay top-right shows count-up (amber after the end threshold).
- Voice `trigger smudge` / hunt phrases toggle timers using the configured threshold.

### Configuration persistence

Duration presets live in session store and sync Main ↔ Overlay. Disk persistence of settings is Phase 10.

### Known limitations (Phase 8)

- Expired timers stay past-threshold (amber, still counting) until Stop/Reset.
- Auto-selecting smudge threshold from remaining ghosts is not implemented (manual presets).

---

## Phase 9 — Footstep Timing (complete)

### Scope

Timing mode with global hotkey, Space/Numpad 0 footstep capture (up to 5 timestamps), SPEC speed formula, ghost comparison, and Overlay display.

### Domain

`src/domain/speed`:

- `calculateFootstepSpeed` / `calculateGhostSpeedMps` — average interval → SPS → × 0.85 m/s, then ÷ ghost speed multiplier for base journal comparison
- `compareSpeedToPossibleGhosts` — match normalized speed to possible ghosts within ±0.2 m/s of `referenceSpeedMps`

### State / sync

- `timingMode`, `timingTimestampsMs` (authoritative); `currentGhostSpeedMps` derived with ghost-speed multiplier
- `settings.ghostSpeedMultiplier` (50/75/100/125/150%) normalizes observed speed to base journal m/s
- `settings.timingResultHideAfterSeconds` (5–15, default 7) controls Overlay result fade
- Enabling timing clears timestamps (new session); stopping keeps last result; Reset clears taps/speed
- Completing 5 footsteps turns timing mode off; Overlay shows live speed while timing and fades the held result after the configured delay
- Snapshot syncs timestamps + settings so Overlay derives the same speed/BPM/matches

### Hotkeys

- `Ctrl+Shift+T` / `CommandOrControl+Shift+T` — toggle timing (`tauri-plugin-global-shortcut`)
- While timing is on: global `Space` and `num0` record footsteps (unregistered when idle so Space is not stolen)
- Defaults live in `src/config/hotkeys.ts` for Phase 10 configurability
- Local keydown fallback when the plugin is unavailable

### UI

- Investigation Tools: Start/Stop Timing, Reset, live speed/BPM, close-match ghost names
- Overlay **top-right under timers**: live speed while armed; after completion, held result then fade
- Settings: Ghost Speed Mode radios + Timing Result Overlay hide delay
- Voice `trigger timer` toggles timing mode

### Known limitations (Phase 9)

- Variable-speed ghosts (ranges / null reference) are skipped or matched only on a single reference value.
- Hotkey bindings are not yet user-configurable (Phase 10).
- Global Space while timing will intercept Space system-wide (by design for in-game capture).
