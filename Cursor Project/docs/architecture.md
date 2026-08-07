# Architecture

## Phase 1 — Scaffold (complete)

### Stack

- **Desktop:** Tauri v2 (Rust)
- **Frontend:** React 19, TypeScript (strict), Tailwind CSS v4, Framer Motion, Zustand
- **Build:** Vite 7

### Current structure

```text
src/
  components/       # Shared UI (empty — Phase 2+)
  windows/
    Main/           # MainWindow entry component
    Overlay/        # Overlay window (Phase 4)
  domain/           # Pure business logic (Phase 3+)
  state/            # Zustand stores (synchronized views)
  services/         # Tauri IPC facades (Phase 3+)
  data/             # Static datasets (Phase 3+)
  hooks/
  types/
  lib/
  styles/           # Tailwind globals

src-tauri/src/
  commands/         # Tauri invoke handlers
  state/            # Authoritative Rust application state (Phase 3+)
```

### Decisions

- Rust will own authoritative state; Zustand stores in each window are synchronized views (not yet wired in Phase 1).
- Tailwind v4 is integrated via `@tailwindcss/vite` (no separate PostCSS config).
- The default Tauri template `greet` command remains as a placeholder IPC example until real commands are added in later phases.

### Known limitations (Phase 1)

- Single main window only; overlay window not created yet.
- No domain logic, persistence, voice sidecar, or real application state.
- Bundle icons use the default Tauri scaffold assets.
