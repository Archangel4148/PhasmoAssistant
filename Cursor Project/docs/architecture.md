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
  state/            # Authoritative Rust application state (future)
```

### Decisions

- Rust will own authoritative state; Zustand stores in each window are synchronized views (Rust sync not yet wired).
- Tailwind v4 is integrated via `@tailwindcss/vite` (no separate PostCSS config).
- The default Tauri template `greet` command remains as a placeholder IPC example until real commands are added in later phases.

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

Timers, voice, and diagnostics still use `src/data/mockSubsystems.ts` placeholders.

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
