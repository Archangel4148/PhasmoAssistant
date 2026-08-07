# AGENTS.md — Phasmophobia Companion

This file is the short-form operating contract for AI coding agents.

`SPEC.md` is the product source of truth. Read it before implementation. This file summarizes the non-negotiable rules that should remain active throughout long coding sessions.

## Non-Negotiable Architecture

1. **Rust owns authoritative application state.**
   - React/Zustand stores are synchronized views, not independent sources of truth.
   - The Overlay never owns persistent or authoritative state.

2. **Domain logic is UI-independent.**
   - Ghost filtering, evidence rules, speed calculations, timers, and voice normalization belong outside React components.
   - Domain logic must be testable without React, Tauri webviews, or hardware.

3. **One implementation per business rule.**
   - Never duplicate ghost data, filtering logic, derived state, timer semantics, or voice parsing.

4. **Exactly one voice sidecar process.**
   - Python/Vosk communicates with Rust through the defined JSON stdout protocol.
   - React must never parse raw speech or communicate directly with Python.

5. **Respect dependency direction.**
   - React/UI → State → Domain → Data
   - Rust/Tauri → Domain
   - Overlay UI → State
   - Never create React → Python, React → Rust implementation-detail, or parallel ownership paths.

## Agent Workflow

### Before changing code

- Read the relevant portions of `SPEC.md`.
- Inspect the existing repository and **all files directly related to the change**.
- Inspect existing abstractions before creating new ones.
- Extend an existing abstraction when it already solves the problem.
- Do not replace established architecture with generated boilerplate.

### While implementing

- Work on **one phase at a time**.
- Do not refactor unrelated code.
- Do not create parallel implementations.
- Do not introduce unnecessary dependencies.
- Avoid placeholder implementations, speculative TODOs, and dead code.
- Preserve existing behavior unless the current phase explicitly changes it.

### Type safety

Never suppress TypeScript, Rust, or lint errors merely to make code compile.

Do not use `any`, unsafe casts, broad lint disables, or ignore directives as escape hatches.

If the type system exposes a design problem, **redesign the implementation instead of weakening type safety**.

### Validation

Before declaring a phase complete:

- Run TypeScript checks.
- Run Rust checks/build where relevant.
- Run lint checks where configured.
- Run relevant tests.
- Fix known errors before proceeding.

Do not claim functionality is complete when it is only mocked unless the current phase explicitly calls for mock behavior.

### Documentation

After every completed phase, update the relevant documentation with important:

- Implementation decisions
- Assumptions
- Architectural/protocol changes
- Deviations from `SPEC.md`
- Known limitations

Keep `docs/architecture.md`, `docs/voice-protocol.md`, and `docs/testing.md` concise and accurate.

### Decision boundary

The agent may choose implementation details that do not change product behavior or architecture.

Stop and ask before:

- Changing the technology stack
- Changing the fundamental IPC architecture
- Adding cloud/online dependencies or telemetry
- Changing persistent-state semantics
- Removing or weakening a requirement
- Changing important user-visible behavior

For non-critical ambiguity, make the most reasonable engineering decision and document it.
