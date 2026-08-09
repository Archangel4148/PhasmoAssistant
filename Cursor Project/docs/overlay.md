# Overlay

## Purpose

The Overlay is the minimal in-game HUD. It is a separate Tauri window and must remain unobtrusive while providing high-value investigation information.

## Window behavior

The Overlay is configured with:

- Transparent background
- No decorations
- No shadow
- Always on top
- Skipped taskbar
- Non-focusable
- Click-through
- Maximized by default

Rust enables click-through with `set_ignore_cursor_events(true)`.

Closing the Main window destroys the Overlay and exits the application so the HUD cannot remain orphaned.

## Layout

```text
Top left → right
    Possible-ghost ticker

Top right
    Smudge / hunt timers
    Timing result/status beneath timers

Center
    Timing mode pulse

Bottom right
    Toast notifications
```

The ghost ticker scrolls when it overflows. Timer elements use approximately 40% idle opacity and 90% active opacity. Toasts have approximately a 2.5-second lifetime.

## Synchronization

The Overlay is a synchronized view, not an independent investigation-state owner.

```text
Main Zustand
  ↓
publish_investigation_snapshot
  ↓
Rust AppState
  ↓
state_changed
  ↓
Overlay hydrateFromSnapshot
```

The Overlay reapplies TypeScript domain filtering from synchronized evidence rather than receiving a second copy of filtering logic from Rust.

## Appearance settings

The Main Settings UI controls:

- Ghost text color
- Ticker speed (8–80 px/s; default 26)
- HUD scale (75–150%)
- Visibility toggles
- Layout/geometry

The default ghost text uses muted slate (`#9aa7b8`) rather than bright white.

## Edit Layout mode

During normal play the Overlay remains click-through.

Edit Layout temporarily:

- Unmaximizes the Overlay
- Enables focus/resize interaction via `set_overlay_interactive`
- Allows move/resize/scale adjustment
- Restores click-through when finished; geometry may be persisted

Reset Layout maximizes the Overlay and clears saved geometry.

## Visual system

The Overlay intentionally uses quieter glass styling than the Main Window. Shared CSS tokens still provide product-wide consistency.

Animations should remain lightweight and use opacity/transform-based motion where possible.

## Agent guidance

Do not add input capture, focus, or persistent investigation state to the Overlay without reconsidering the architecture and documenting the decision.
