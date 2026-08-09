# ADR 0001 — Rust Sync Mirror, TypeScript Domain Logic

## Status

Accepted

## Decision

Use Rust as the cross-window synchronization mirror while keeping business/domain logic such as ghost filtering in TypeScript.

## Rationale

The application has multiple Tauri windows that need synchronized state, while the frontend already contains the domain model used to derive ghost presentation. Reimplementing filtering in Rust would create two business-rule implementations and increase drift risk.

Rust therefore stores a serializable snapshot for synchronization, while TypeScript reapplies domain-derived presentation from synchronized evidence.

## Consequence

- Rust handles synchronization/infrastructure.
- TypeScript owns filtering semantics.
- Overlay can remain a synchronized view without becoming a second business-logic implementation.
- A full Rust-owned mutation path for evidence remains a future architectural option, not the current implementation.
