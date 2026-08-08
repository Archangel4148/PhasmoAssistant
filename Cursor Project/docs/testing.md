# Testing

## Phase 1 checks

```powershell
npm install
npm run typecheck
cd src-tauri; cargo check
```

Manual: `npm run tauri dev`

### Acceptance criteria (Phase 1)

- [x] Application launches
- [x] Main window renders
- [x] TypeScript strict mode passes
- [x] Rust checks successfully

---

## Phase 2 checks

```powershell
npm run typecheck
```

Manual: `npm run tauri dev` — verify complete static Main UI and responsive layout.

### Acceptance criteria (Phase 2)

- [x] Main UI looks complete with mock data
- [x] Responsive layout
- [x] No TypeScript errors

---

## Phase 3 checks

```powershell
npm run typecheck
npm run test
cd src-tauri; cargo check
```

Manual verification (`npm run tauri dev`):

- Click evidence tiles — state cycles unknown → confirmed → eliminated
- Possible-ghost count in header updates as evidence changes
- Ghost cards de-emphasize (~20% opacity) when ruled out but remain visible
- All 24 ghosts stay in stable grid positions

### Acceptance criteria (Phase 3)

- [x] Evidence changes update possible ghosts
- [x] Impossible ghosts remain visible but de-emphasized
- [x] Domain tests pass (`npm run test`)
- [x] UI contains no ghost-filtering logic

---

## Phase 4 checks

```powershell
npm run typecheck
npm run test
cd src-tauri; cargo check
npm run tauri dev
```

Manual verification:

- Overlay window appears (frameless, always on top, not in taskbar)
- Overlay background is transparent over the desktop/game
- Mouse clicks pass through the overlay (click-through)
- Changing evidence in Main updates Overlay possible-ghost list
- Confirming evidence shows a toast on the Overlay that fades after ~2.5s
- Overlay does not steal focus from other apps when created

### Acceptance criteria (Phase 4)

- [x] Transparent
- [x] Frameless
- [x] Always on top
- [x] Click-through
- [x] Non-focusable
- [x] Does not appear in taskbar
- [x] Main and Overlay reflect the same state
- [x] Overlay looks correct over arbitrary backgrounds

---

## Phase 5 checks

```powershell
npm run typecheck
npm run test
cd src-tauri
cargo test
cargo check
npm run tauri dev
```

Requires Python 3 on PATH (`py -3`, `python`, or `python3`).

Manual verification:

- App launches even if sidecar fails (optional subsystem)
- Diagnostics shows sidecar connected and voice status transitioning to Listening
- Recent events list fills with status / demo commands
- **Restart Sidecar** kills and relaunches the process
- Killing Python externally shows an error state without crashing the app
- Closing Main also stops the sidecar

### Acceptance criteria (Phase 5)

- [x] Rust can launch the sidecar
- [x] Rust receives structured JSON
- [x] Sidecar failure does not crash the application
- [x] Manual restart works

---

## Phase 6 checks

```powershell
pip install -r sidecar/requirements.txt
# Place vosk-model-small-en-us-0.15 under sidecar/models/
npm run typecheck
npm run test
cd src-tauri; cargo test; cargo check
npm run tauri dev
```

Manual verification:

- Without model: Diagnostics shows setup error; app otherwise works
- With model: say `trigger emf five` → EMF confirms + overlay toast
- Speech without `trigger` does nothing
- `trigger smudge` / `trigger timer` update tools state
- Voice status visible in header/Diagnostics
- Restart Sidecar recovers after fixing model/deps

### Acceptance criteria (Phase 6)

- [x] Listener recognizes wake word
- [x] Commands are ignored without wake word
- [x] Supported commands update application state
- [x] Voice status is visible
- [x] Missing model is handled gracefully

---

## Phase 7 checks

```powershell
npm run typecheck
npm run test
```

Manual verification (`npm run tauri dev`):

- Confirming Ghost Orbs keeps Mimic possible even though Orbs are not in its journal triple
- Eliminating Ghost Orbs rules out Mimic
- Confirming UV + Orbs + DOTS leaves only Banshee
- New ghosts (Obambo, Gallu, Dayan, Kormos, Aswang, Deildegast) appear in the grid
- Impossible ghosts stay visible at ~20% opacity with stable positions
- Exclude/Include on a card manually removes/restores that ghost
- Evidence chips on cards highlight confirmed/eliminated states

### Acceptance criteria (Phase 7)

- [x] Filtering is correct for the complete dataset
- [x] Ghost logic exists in data/domain code rather than UI components

---

## Phase 8 checks

```powershell
npm run typecheck
npm run test
cd src-tauri; cargo check
npm run tauri dev
```

Manual verification:

- Start Smudge → count-up from 00:00; turns amber after the selected end threshold
- Re-trigger Start/Stop or `trigger hunt` while running → timer stops and resets
- Switch window focus / minimize briefly → elapsed time stays correct (no drift)
- Overlay top-right mirrors Main stopwatch without republishing every tick
- Duration presets (60/90/180 and 15/20/25) set the end threshold

### Acceptance criteria (Phase 8)

- [x] Timers remain accurate while application focus changes
- [x] Timers do not drift significantly
- [x] Timers correctly expire

---

## Phase 9 checks

```powershell
npm run typecheck
npm run test
cd src-tauri; cargo check
npm run tauri dev
```

Manual verification:

- Ctrl+Shift+T toggles timing mode (toast + Overlay indicator)
- With timing on, Space / Numpad 0 record up to 5 steps with live speed/BPM; 5th step auto-ends timing
- Overlay top-right (under timers) shows live speed, then fades the held result after Settings hide delay
- Settings → Ghost Speed Mode (50–150%) normalizes results; Timing Result Overlay hide delay (5–15s)
- Reset clears steps/speed; Start Timing begins a new session (clears prior result)
- Close-match possible ghosts listed under the speed readout
- `trigger timer` voice command toggles timing

### Acceptance criteria (Phase 9)

- [x] Five timestamps can be captured
- [x] Speed calculation matches the specified formula
- [x] Timing state is synchronized across windows
- [x] Reset/new sessions work correctly

---

## Phase 10 checks

```powershell
npm run typecheck
npm run test
cd src-tauri; cargo check
npm run tauri dev
```

Manual verification:

- Move/resize Main → quit → relaunch restores geometry
- Change Settings (theme, ghost speed, hide delay, overlay scale, toggle hotkey, mic) → relaunch restores them
- Start an investigation (evidence/timers/timing) → quit → relaunch shows a clean investigation
- Corrupt/`null` store values fall back to defaults without crashing
- Overlay scale slider updates HUD live; Reset overlay layout restores maximized overlay

### Acceptance criteria (Phase 10)

- [x] Settings survive application restart
- [x] Active investigation state does not persist by default
- [x] Invalid stored data falls back safely

---

## Phase 11 checks

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
cd src-tauri; cargo check
```

Manual verification:

- Idle Main + Overlay: CPU stays low with no active timers/timing (hidden windows quieter)
- Corrupt investigation sync payloads do not crash Overlay (evidence/toasts fall back)
- Kill/restart voice sidecar from Diagnostics — investigation UI remains usable
- Force a sync failure (overlay without main briefly) — warning appears in diagnostics, voice status not falsely set to error
- Open Settings repeatedly — drafts reset cleanly; no lint/type regressions

### Acceptance criteria (Phase 11)

- [x] No known type, lint, build, or test errors remain
- [x] Recoverable failures do not destabilize unrelated features
- [x] Idle clocks/animations pause or slow when the document is hidden

---

## Phase 12 checks

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
cd src-tauri; cargo check
```

Manual verification:

- Main + Overlay share mist/steel accent language; timing still reads amber
- Light theme updates panel chrome (not only page background)
- Keyboard: Tab shows focus rings; Settings closes on Escape
- Zero possible ghosts shows empty-state copy; Overlay ticker shows “No matches”
- Animations feel short/subtle; reduced-motion / hidden document still quiet

### Acceptance criteria (Phase 12)

- [x] Main Window and Overlay feel like one cohesive product
- [x] Visual hierarchy is clear
- [x] Animations remain subtle and performant
- [x] No major usability issues remain in polished surfaces

---

## Post-phase UX backlog checks

Manual verification:

- Settings → **Edit overlay layout**: overlay unmaximizes, drag bar moves it, edge grips resize; Done/Close restores click-through
- Overlay HUD scale slider updates Overlay live
- HUD element toggles hide ghosts/timers/timing/toasts on Overlay
- Maximize Main on a secondary monitor → quit → relaunch restores maximized on that monitor
- Voice: `trigger not emf five` eliminates; `trigger reset hunt` clears hunt cooldown
- Microphone **None** stops voice; selecting a mic restarts it
- Accent color updates Main header/panel accents + overlay ghost text
- Diagnostics → View accepted voice phrases lists catalog entries
- Packaged app uses the custom ghost orb icons (`src-tauri/icons`)

## Automated tests

Domain logic tests live alongside implementation:

- `src/domain/evidence/evidenceRules.test.ts`
- `src/domain/ghosts/filterPossibleGhosts.test.ts` (includes evidence difficulty + Mimic Orbs)
- `src/domain/ghosts/unanimousSmudge.test.ts`
- `src/domain/timers/timerState.test.ts`
- `src/domain/speed/calculateSpeed.test.ts`
- `src/domain/voice/normalizeCommand.test.ts`
- `src/types/persistedPreferences.test.ts`

Run all checks:

```powershell
npm run typecheck
npm run lint
npm run test
```

Watch mode:

```powershell
npm run test:watch
```

Rust protocol parsing tests:

```powershell
cd src-tauri
cargo test
```
