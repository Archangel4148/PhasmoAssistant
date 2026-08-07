# Testing

## Phase 1 checks

Run from the project root:

```powershell
npm run typecheck
cd src-tauri; cargo check
```

Manual verification:

```powershell
npm run tauri dev
```

### Acceptance criteria (Phase 1)

- [ ] Application launches (`npm run tauri dev`)
- [ ] Main window renders with scaffold UI
- [ ] TypeScript strict mode passes (`npm run typecheck`)
- [ ] Rust checks successfully (`cargo check` in `src-tauri`)

## Future automated tests

Domain logic (evidence filtering, ghost filtering, speed calculations, timer semantics, voice normalization) will use unit tests independent of React/Tauri. Details will be added in Phase 3+.
