# State & Persistence

## State ownership

The application uses synchronized Zustand views across windows.

The current model is:

- Main Zustand — local investigation mutation + sync publication
- Rust AppState — serializable cross-window synchronization mirror
- Overlay Zustand — read-only synchronized view plus domain-derived presentation

The domain layer remains the single source of truth for business rules such as filtering and evidence semantics.

## Investigation state

Investigation state includes transient information such as:

- Evidence states
- Manually eliminated ghosts
- Running timers
- Timing timestamps/results
- Toasts

This state is **not persisted** across application launches.

## Derived state

Ghost presentation is derived from evidence using domain functions. The UI should consume derived values rather than reimplementing filtering.

Evidence difficulty is also represented in the domain/state model.

Current modes include:

| Mode | Journal evidence | Forced-evidence behavior |
|---|---:|---|
| Amateur–Professional | 3 | Base confirm/eliminate rules |
| Nightmare | 2 | Once ≥2 confirmed, forced evidence must be among them |
| Insanity | 1 | Forced ghosts may only show forced journal evidence |
| Apocalypse | 0 | Evidence ignored; Exclude / behavior only |

Mimic's fake Ghost Orbs remain an `alwaysPresentsEvidence` condition.

## Persistence

Tauri Store (`preferences.json`) persists user preferences, not active investigations.

Persisted categories include:

- Main window geometry
- Overlay geometry and HUD scale
- Overlay appearance
- Investigation settings
- Hotkeys
- Theme
- Microphone selection

Preferences use field-level safe fallbacks through `resolvePersistedPreferences`.

Main waits for preference hydration before becoming the investigation sync publisher. Disk writes for synchronized appearance/settings/timer-default changes are performed by the Main publisher.

## Synchronization hardening

Snapshot hydration validates:

- Evidence payloads
- Eliminated ghost IDs
- Timestamps
- Toast shapes

Sync/publish failures are reported through application diagnostics without incorrectly changing voice status to an error state.

## Agent guidance

When changing state:

- Determine whether the state is authoritative, synchronized, derived, or persistent before adding it.
- Do not create duplicate derived state merely for convenience.
- Keep business rules in the domain layer.
- Update this document when state ownership or persistence semantics change.
