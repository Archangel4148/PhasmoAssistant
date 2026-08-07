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
