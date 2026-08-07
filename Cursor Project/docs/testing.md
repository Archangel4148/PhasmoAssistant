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

## Automated tests

Domain logic tests live alongside implementation:

- `src/domain/evidence/evidenceRules.test.ts`
- `src/domain/ghosts/filterPossibleGhosts.test.ts`

Run all tests:

```powershell
npm run test
```

Watch mode:

```powershell
npm run test:watch
```

Future phases will add timer, speed, and voice normalization tests as those domains are implemented.

Rust protocol parsing tests:

```powershell
cd src-tauri
cargo test
```
