# ADR 0003 — Transparent Click-Through Overlay

## Status

Accepted

## Decision

Use a dedicated Tauri window for the HUD rather than embedding the overlay into the Main Window.

## Rationale

The in-game HUD needs transparent rendering, always-on-top behavior, no taskbar presence, no focus, and click-through mouse behavior. A dedicated window cleanly isolates those OS-level requirements.

## Consequence

The application must synchronize state between two windows. The Main window publishes investigation snapshots and the Overlay consumes them as a read-only view.
