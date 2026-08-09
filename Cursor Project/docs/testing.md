# Testing & Quality

## Automated validation

The project uses Vitest for domain-level tests.

Domain tests intentionally avoid React and Tauri so business logic can be exercised independently.

Current coverage includes evidence cycling, ghost filtering, and validation behavior such as invalid evidence payload handling.

ESLint uses the flat configuration in `eslint.config.js` with TypeScript and React Hooks rules.

## Important areas to validate

### Domain

- Evidence state transitions
- Confirmed/eliminated filtering
- Mimic fake-orb behavior
- Evidence difficulty modes
- Manual ghost exclusion
- Variable-speed ghost matching
- Timer/deadline behavior
- Footstep speed calculation

### State synchronization

- Main publishes snapshots after preferences hydrate
- Overlay hydrates from `state_changed`
- Overlay does not become an independent source of truth
- Invalid snapshot data is rejected safely
- Sync failures appear in diagnostics without corrupting voice status

### Voice

- Domain phrase → action mapping (`normalizeCommand` / wake-word semantics)
- Sidecar launch
- Missing model/script handling
- Unexpected exit
- Manual restart
- Microphone routing / voice disabled
- Release executable/model discovery

### Overlay

- Transparency
- Click-through behavior
- Always-on-top behavior
- Edit Layout mode
- Restoring click-through after editing
- Correct synchronized content

### Persistence

- Field-level fallback for malformed preferences
- Main window geometry
- Overlay geometry/scale
- Appearance/settings
- Hotkeys
- Theme
- Microphone selection
- Active investigation is not persisted

## Performance expectations

The application avoids unnecessary polling:

- `useClock` defaults to one-second ticks and skips updates while the document is hidden.
- Overlay timer fading uses a timeout rather than a permanent polling loop.
- Overlay toast pruning uses scheduled timeouts.
- Timer blocks own their clocks.
- Framer Motion reduced motion is forced while the document is hidden.

Performance changes should preserve these properties unless there is a measured reason to change them.

## Completion standard

A maintenance change is complete when:

1. The affected code is implemented.
2. Relevant lint/type/build checks pass.
3. Relevant tests pass.
4. The affected runtime behavior has been exercised where practical.
5. Documentation is updated when behavior or architecture changed.
