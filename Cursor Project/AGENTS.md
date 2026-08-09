# AGENTS.md

This repository contains a production desktop application. Treat the **current implementation** and **current documentation** (`ARCHITECTURE.md`, `docs/`, this file) as the source of truth. `archived_old_docs/` is historical only.

## Before changing code

1. Read the relevant sections of `ARCHITECTURE.md` and the applicable `docs/` files.
2. Inspect all files directly related to the change before modifying architecture or shared behavior.
3. Extend existing abstractions when they already solve the problem.
4. Preserve existing behavior unless the task intentionally changes it.
5. Do not replace established architecture with generated boilerplate.

## Product constraints

Do not introduce:

- Cloud services, online APIs, accounts, or telemetry
- Remote speech recognition
- Game-memory reading, game-file modification, input injection, or game automation

The app must remain usable when optional subsystems (especially voice) fail.

## Dependency direction

```text
React / UI  →  State (Zustand views)  →  Domain  →  Data
Rust / Tauri  →  Domain (via snapshot/events; no reimplemented filters)
Overlay UI  →  State (synced view only)
```

Never create:

- React → Python
- React → Rust implementation-detail coupling outside the defined Tauri command/event boundary
- Parallel copies of ghost data, filtering, timer semantics, or voice parsing

## Non-negotiable architecture

- Rust owns the cross-window synchronization mirror and application infrastructure (sidecar, window lifecycle, persistence plugin wiring).
- Zustand stores are synchronized window views, not independent application architectures.
- Domain/business logic remains UI-independent and testable without React/Tauri/hardware.
- Ghost filtering has one TypeScript implementation in the domain layer.
- The Overlay does not own persistent or authoritative investigation state.
- Exactly one voice sidecar process may run at a time.
- React must not parse raw voice recognition output; it consumes typed events / domain actions.
- Do not create parallel implementations of existing business rules.

Read `ARCHITECTURE.md` for implementation-specific details.

## Type safety

Never suppress TypeScript, Rust, or lint errors merely to make code compile.

Do not use `any`, unsafe casts, broad lint disables, or ignore directives as escape hatches. If the type system exposes a design problem, redesign the implementation.

## Validation

Before declaring a change complete:

- Run TypeScript/lint checks (`npm run typecheck`, `npm run lint`).
- Run Rust checks/build when relevant (`cargo check` / `tauri` build path).
- Run relevant tests (`npm run test`).
- Exercise the affected behavior when practical.
- Fix known errors before proceeding.

## Documentation

When architecture, IPC, persistence, release behavior, or externally meaningful behavior changes:

- Update the relevant `docs/` file.
- Update `ARCHITECTURE.md` when the high-level design changes.
- Add or update an ADR under `docs/adr/` for an important architectural decision.
- Update `CHANGELOG.md` for user-visible or release-relevant changes.

Keep documentation concise and based on the actual implementation.

## Scope

Avoid unrelated refactors, unnecessary dependencies, speculative TODOs, dead code, and parallel implementations.

This is maintenance/versioning work. Prefer small, reversible changes over broad rewrites.
