# Phasmophobia Companion & Overlay
## Product Specification

**Document:** `SPEC.md`  
**Status:** Initial implementation specification  
**Target:** Cursor coding agent  
**Primary goal:** Build a polished, lightweight, offline-first Phasmophobia companion application with a desktop control panel and synchronized transparent overlay.

---

# 1. Product Overview

Build a Windows desktop companion application for **Phasmophobia**.

The application consists of two synchronized windows:

### Main Window

A full-featured control panel intended primarily for a second monitor.

It provides:

- Ghost/evidence tracking
- Possible-ghost filtering
- Footstep speed calculator
- Investigation timers
- Voice-recognition status
- Settings
- Diagnostics
- Configuration and persistence

### Overlay Window

A minimal HUD displayed over the game.

It must be:

- Transparent
- Frameless
- Always on top
- Click-through
- Non-focusable
- Hidden from the taskbar
- Visually unobtrusive
- Lightweight enough to have negligible impact on game performance

The overlay displays only information that is useful during active gameplay:

- Timers
- Remaining possible ghosts
- Footstep timing state/results
- Voice confirmations
- Small status indicators

The application must operate entirely offline after installation.

---

# 2. Product Priorities

Prioritize requirements in this order:

1. Correctness
2. Reliability
3. Maintainability
4. Responsive UI
5. Low CPU/memory usage
6. Smooth animations
7. Visual polish

The application must remain usable when optional subsystems fail.

For example, a voice-recognition failure must not crash or disable the rest of the application.

---

# 3. Technology Stack

Use the following stack unless a requirement makes it genuinely impossible:

### Desktop

- Tauri v2
- Rust backend

### Frontend

- React
- TypeScript
- TypeScript strict mode
- Tailwind CSS
- Framer Motion

### State

- Zustand

### Voice Recognition

- Python
- Vosk
- PyInstaller-built sidecar executable

### Persistence

- Tauri Store plugin

### Global Hotkeys

- `tauri-plugin-global-shortcut`

### General Requirements

- No cloud services
- No online API dependency
- No account/login system
- No telemetry
- No remote speech recognition
- No game-memory reading
- No game-file modification
- No game input injection
- No game automation

---

# 4. Architectural Principles

The application must follow these principles:

- Domain/business logic must be independent of React.
- UI components must not contain business rules.
- Application state must have one authoritative source.
- Communication between processes/windows must be explicit and strongly typed.
- Prefer event-driven communication over polling.
- Prefer composition over inheritance.
- Avoid unnecessary dependencies.
- Keep pure logic deterministic and independently testable.
- A failure in an optional subsystem must degrade gracefully rather than crash the application.

---

# 5. Dependency Graph

The following dependency direction is the architectural baseline:

```text
React / UI
    ↓
State
    ↓
Domain
    ↓
Data

Rust / Tauri
    ↓
Domain

Overlay UI
    ↓
State
```

Allowed dependencies must flow toward lower-level responsibilities. In particular:

- React may depend on application state and domain-facing interfaces.
- State may depend on domain types/operations.
- Domain logic may depend on structured data.
- Rust may depend on domain logic and coordinate application infrastructure.
- Overlay UI may consume state but must not become an independent source of truth.

The following dependency directions are forbidden:

- React → Python
- React → Rust implementation details
- UI components → domain implementation details
- Multiple independent implementations of the same business rule
- Multiple authoritative state owners
- Direct UI parsing of raw voice recognition output

React should communicate with the backend through the defined Tauri command/event boundary rather than coupling UI components directly to Rust implementation details.

# 6. High-Level Architecture

The intended architecture is:

```text
                       ┌─────────────────────┐
                       │     Game / User     │
                       └──────────┬──────────┘
                                  │
                    Voice / Hotkeys / User Input
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ▼                                       ▼
       Python Vosk Sidecar                       Tauri/Rust
              │                                       │
          stdout JSON                         Application Engine
              │                                       │
              └───────────────────┬───────────────────┘
                                  │
                           Authoritative State
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
              Main Window                 Overlay Window
                  React                       React
                    │                           │
                Zustand                    Zustand
```

The exact internal implementation may differ, but these architectural boundaries must remain intact.

---

# 10. State Ownership

There must be **one authoritative application state**.

Because Tauri windows are separate webview instances, do not assume that a Zustand store instance is automatically shared between windows.

The implementation must ensure that Main and Overlay always represent the same logical application state.

## Recommended model

Rust/Tauri owns the authoritative application state.

Each React window may maintain a synchronized local Zustand representation for rendering, but neither window may become an independent source of truth.

Conceptually:

```text
                 Rust Application State
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Main Window              Overlay Window
       Zustand store            Zustand store
             │                       │
          React UI                React UI
```

Any state synchronization mechanism is acceptable as long as:

- State cannot diverge silently.
- There is no duplicated business logic.
- Both windows update consistently.
- State mutations have a clear owner.

---

# 10. Domain Layer

Business logic must be isolated from UI code.

Create a domain/application layer containing pure or mostly pure logic for:

- Evidence tracking
- Ghost filtering
- Footstep speed calculations
- Timer state
- Voice command normalization
- Future sanity calculations
- Future hunt calculations

Domain functions should be testable without:

- A browser/webview
- React
- Tauri runtime
- Microphone hardware
- Python
- Filesystem access

For example:

```text
domain/
  evidence/
  ghosts/
  speed/
  timers/
  voice/
```

The exact folder organization is up to the agent if it preserves these boundaries.

---

# 11. Communication Architecture

Communication must be strongly typed.

## Python → Rust

The Python Vosk sidecar communicates with Rust using **stdout only**.

Each line must contain one JSON message.

Example:

```json
{
  "event": "voice_command",
  "command": "set_evidence",
  "value": "emf5"
}
```

Python should emit semantic commands rather than arbitrary raw speech wherever practical.

### Supported voice events

At minimum:

- `voice_command`
- `voice_status`
- `sidecar_error`

The exact TypeScript/Rust representations are up to the implementation, but equivalent strongly typed schemas must exist on both sides.

## Rust → React

Use Tauri events for asynchronous notifications and state synchronization.

At minimum support:

- `voice_command`
- `voice_status`
- `timing_mode`
- `smudge_started`
- `ghost_speed`
- `sidecar_error`
- `state_changed`

All event payloads must be strongly typed.

## React → Rust

Use Tauri commands for actions/state mutations that require backend coordination.

Examples:

- Toggle timing mode
- Start/restart timer
- Change settings
- Change overlay visibility
- Restart voice sidecar
- Persist window configuration

Do not create an ad-hoc IPC protocol when an existing Tauri command/event mechanism is sufficient.

---

# 12. Voice Recognition

Voice recognition must run locally using Vosk.

The Python sidecar must be packaged as an executable using PyInstaller.

## Voice pipeline

```text
Microphone
    ↓
Vosk speech recognition
    ↓
Wake-word detection
    ↓
Command parsing
    ↓
Normalized semantic command
    ↓
JSON stdout
    ↓
Rust
```

## Wake word

The listener should only execute commands after hearing:

> `trigger`

Examples:

```text
"trigger emf five"
"trigger spirit box"
"trigger ghost orbs"
"trigger smudge"
```

Unrelated speech must be ignored.

## Supported commands

At minimum:

- `emf five`
- `spirit box`
- `fingerprints`
- `ultraviolet`
- `freezing`
- `ghost orbs`
- `dots`
- `ghost writing`
- `smudge`
- `timer`

Equivalent natural phrasing may be supported if it does not make command recognition unreliable.

The command parser should normalize variants into canonical values.

Example:

```text
"EMF five"
"emf 5"
"level five emf"
```

may all normalize to:

```text
emf5
```

## Voice lifecycle

The sidecar must communicate its state:

```text
offline
starting
listening
error
```

The exact state model may be extended if useful.

Voice recognition must continue indefinitely until explicitly stopped.

---

# 13. Voice Sidecar Failure Handling

The sidecar is optional.

If it crashes:

1. The application must remain running.
2. The UI must show that voice recognition is disconnected.
3. The error must be logged.
4. The user must be able to restart the sidecar manually.
5. All non-voice features must continue working.

If the Vosk model is missing:

1. Do not crash.
2. Disable voice features.
3. Show clear setup instructions.
4. Allow all other features to continue working.

---

# 14. Application State

The logical application state must contain equivalents of:

```ts
interface AppState {
  evidence: {
    emf5: boolean;
    spiritBox: boolean;
    fingerprints: boolean;
    ghostWriting: boolean;
    ghostOrbs: boolean;
    freezing: boolean;
    dots: boolean;
  };

  eliminatedGhosts: string[];

  possibleGhosts: Ghost[];

  timingMode: boolean;

  currentGhostSpeed: number | null;

  smudgeTimer: number | null;

  voiceStatus: "offline" | "starting" | "listening" | "error";

  overlayVisible: boolean;

  settings: UserSettings;
}
```

The implementation may refine these types.

Avoid storing derived values when they can be safely calculated from authoritative state.

For example, `possibleGhosts` may be derived from evidence rather than independently mutated.

---

# 15. Evidence Tracking

Evidence can be:

- Unknown
- Confirmed
- Eliminated

The initial minimal data model may represent confirmed evidence using booleans and eliminated ghosts separately, but the implementation may use a richer representation if it makes the domain model clearer.

Voice commands must be able to mark supported evidence.

Evidence changes must trigger ghost filtering automatically.

---

# 16. Ghost Data

Ghost information must be data-driven.

Do not hardcode ghost-specific behavior inside React components.

Use structured data equivalent to:

```ts
interface Ghost {
  name: string;
  evidence: Evidence[];
  speedProfile: SpeedProfile;
  smudgeDuration: number;
  notes: string[];
}
```

The exact schema may be expanded to support special behaviors.

Ghost data should live separately from UI components, for example:

```text
data/
  ghosts.ts
  evidence.ts
```

or an equivalent structure.

The complete ghost dataset must be represented as structured data rather than scattered conditional logic.

---

# 17. Ghost Filtering

Whenever evidence changes:

1. Recalculate which ghosts remain possible.
2. Do not remove impossible ghosts from the UI.
3. Impossible ghosts must remain visible at approximately 20% opacity.
4. Possible ghosts remain visually prominent.
5. Ghost card positions must remain stable when filtering changes.

Filtering must be implemented in the domain layer.

The UI should receive/render the result rather than independently implementing filtering rules.

---

# 18. Footstep Speed Calculator

The application must provide a ghost-speed calculator.

## Activation

The calculator may be activated by:

- Voice command
- Global hotkey
- UI control

## Input

The user taps:

- Space
- Numpad 0

for each observed ghost footstep.

Store up to **five timestamps**.

Five timestamps produce up to four intervals:

```text
t1 → t2
t2 → t3
t3 → t4
t4 → t5
```

Calculate:

```text
averageDelta = sum(intervals) / intervals.length
SPS = 1 / averageDelta
metersPerSecond = SPS × 0.85
```

Display the resulting speed in meters per second.

Example:

```text
2.4 m/s
```

The UI should compare the measured speed against the reference speed data for the remaining possible ghosts where practical.

## Requirements

The implementation must clearly handle:

- Fewer than two timestamps
- Exactly two timestamps
- Five timestamps
- Resetting timing
- Starting/stopping timing
- Repeated timing sessions

The implementation must not divide by zero or produce invalid numeric output.

---

# 19. Global Hotkeys

Default hotkey:

```text
Ctrl + Shift + T
```

Purpose:

> Toggle Timing Mode

Use:

`tauri-plugin-global-shortcut`

The architecture must allow additional hotkeys to become configurable in the future.

Hotkeys must not interfere with normal application operation.

---

# 20. Timers

The application must support investigation timers.

At minimum:

- Smudge timer
- Hunt cooldown timer

Timers must be represented as explicit state rather than relying on UI animation timing.

A timer must have clear lifecycle semantics equivalent to:

```text
Idle
  ↓ start
Running
  ↓ reaches zero
Expired
```

The UI must remain correct if the application loses focus.

Do not implement timer correctness using `setInterval`-driven decrementing state alone.

Prefer storing timestamps/deadlines and deriving remaining time from the current clock.

This prevents timer drift.

---

# 21. Main Window

The Main Window is a standard desktop window.

Requirements:

- Resizable
- Normal title bar
- Normal focus behavior
- Position persisted
- Size persisted

The main UI should provide the following logical areas:

### Header

- Application status
- Voice status
- Settings access

### Evidence Panel

- All supported evidence
- Current evidence state
- Clear visual distinction between unknown/confirmed/eliminated
- Voice confirmation feedback

### Ghost Panel

- All ghosts
- Possible ghosts emphasized
- Eliminated/impossible ghosts de-emphasized
- Evidence information available

### Investigation Tools

- Footstep speed calculator
- Smudge timer
- Hunt cooldown

### Diagnostics

- Sidecar status
- Microphone status
- Voice recognition status
- Recent voice commands/events
- Error information

The exact component hierarchy and visual implementation are left to the agent.

---

# 22. Overlay Window

The overlay must be:

- Transparent
- Always-on-top
- Frameless
- No decorations
- Hidden from taskbar
- Non-focusable
- Click-through
- Ignore cursor events
- Not capture mouse input
- Not capture keyboard input
- Fully transparent outside UI elements

The game must continue receiving mouse and keyboard input normally.

The overlay must not require the user to click it.

---

# 23. Overlay Layout

Use the following conceptual layout:

```text
┌───────────────────────────────────────────────┐
│                              Timers            │
│                         Smudge: 00:42          │
│                         Hunt:  01:13           │
│                                               │
│                 Possible Ghosts               │
│                 ┌─────────────┐               │
│                 │ Spirit      │               │
│                 │ Revenant    │               │
│                 │ Thaye       │               │
│                 └─────────────┘               │
│                                               │
│                 [ TIMING MODE ]               │
│                                               │
│                              ✓ EMF 5 Logged   │
│                              ✓ Speed: 2.4 m/s │
└───────────────────────────────────────────────┘
```

### Top Right

Timers.

Idle opacity: approximately 40%.

Active opacity: approximately 90%.

### Top Center

Remaining possible ghosts.

Use smooth fade transitions when their status changes.

### Bottom Right

Toast notifications.

Examples:

```text
✓ EMF Level 5 Logged
✓ Spirit Box Logged
✓ Timing Started
✓ Speed: 2.4 m/s
```

Toasts disappear after approximately 2.5 seconds.

### Center

Timing Mode indicator.

Only visible while timing is active.

Use a subtle pulse animation.

---

# 24. Overlay Position and Scale

The overlay must support persisted:

- Position
- Scale

The exact UI for configuring these values is up to the implementation.

The overlay should remain usable at common resolutions and DPI scaling levels.

---

# 25. Visual Design

The application should feel like a **professional paranormal investigation tool**, not a generic CRUD dashboard.

Desired visual direction:

- Dark interface
- High information density
- Strong visual hierarchy
- Compact cards/panels
- Restrained accent color
- Subtle glass/transparency effects where appropriate
- Clean typography
- Minimal unnecessary decoration
- Atmospheric but functional
- Clear states for confirmed, unknown, impossible, active, and error conditions

The overlay should be significantly more restrained than the Main Window.

Do not sacrifice readability for visual effects.

The visual design should feel polished enough to be used during an actual investigation.

---

# 26. Animations

Use Framer Motion.

Only animate:

- `opacity`
- `transform`

Avoid animating:

- `width`
- `height`
- `top`
- `left`

Animations should be GPU-friendly and should not cause layout thrashing.

Animations should be:

- Smooth
- Short
- Purposeful
- Subtle enough not to distract during gameplay

Avoid excessive animation.

---

# 27. Persistence

Persist:

- Main window position
- Main window size
- Overlay position
- Overlay scale
- Settings
- Microphone selection
- Hotkey configuration
- Theme
- Other user preferences

Do **not** persist an active investigation by default.

After restarting the application, investigation-specific state should begin clean unless the user explicitly enables a future persistence option.

Use the Tauri Store plugin.

---

# 28. Performance

Performance targets:

### CPU

Idle CPU usage should be below approximately **5%** on a typical modern desktop.

### UI

- 60 FPS animations where possible
- No unnecessary polling
- Event-driven updates
- Avoid excessive React rerenders

### Game Impact

The overlay should have no noticeable impact on game FPS during normal use.

### Voice

Voice recognition may consume more CPU than the UI, but should avoid unnecessary processing and should not continuously perform expensive work unrelated to recognition.

Do not prematurely optimize at the expense of correctness.

---

# 29. Error Handling

The application must fail gracefully.

### Sidecar crash

- Detect it.
- Update voice status.
- Log the error.
- Show a clear diagnostic.
- Provide manual restart.
- Continue operating normally otherwise.

### Missing Vosk model

- Detect it.
- Disable voice functionality.
- Explain how to install/configure the model.
- Continue running all non-voice functionality.

### Invalid persisted settings

- Detect invalid data.
- Fall back to safe defaults.
- Do not crash.

### IPC failure

- Log useful diagnostics.
- Keep the UI usable where possible.
- Avoid silently losing important state.

### Unexpected errors

Avoid crashing the entire application because of a recoverable feature-level failure.

---

# 30. TypeScript Standards

Use strict TypeScript.

Requirements:

- `"strict": true`
- No `any`
- Avoid unsafe type assertions
- Explicitly type public interfaces
- Strongly typed event payloads
- Strongly typed application state
- Functional React components only
- No React class components

Prefer:

```ts
type Evidence = ...
```

and discriminated unions where appropriate.

Avoid stringly-typed application logic when a union/enum can provide stronger guarantees.

---

# 31. React Standards

React should primarily render state and dispatch actions.

React components must not contain core business logic such as:

- Ghost filtering
- Speed calculations
- Timer semantics
- Voice parsing
- Ghost-specific rules

Avoid unnecessary effects.

Avoid excessive local component state when state belongs to the application/domain layer.

Create reusable components and hooks where reuse is meaningful.

Do not over-abstract simple UI.

---

# 32. Rust Standards

Rust should provide:

- Tauri commands
- Tauri event handling
- Application-level coordination
- Sidecar lifecycle management
- State synchronization
- Persistence integration where appropriate
- Global hotkey integration
- Window management

Use idiomatic Rust.

Avoid putting large amounts of UI-specific logic into Rust.

---

# 33. Python Sidecar Standards

The Python sidecar should:

- Run independently
- Read microphone input locally
- Use Vosk
- Emit one JSON event per stdout line
- Never write diagnostic logging to stdout if stdout is the IPC channel
- Write diagnostics to stderr or another appropriate logging mechanism
- Exit cleanly when requested
- Handle missing models gracefully

The JSON protocol must remain stable and documented.

---

# 34. Suggested Project Structure

The agent may adjust this structure if necessary, but preserve architectural separation.

```text
/
├── src/
│   ├── components/
│   ├── windows/
│   │   ├── Main/
│   │   └── Overlay/
│   ├── domain/
│   │   ├── evidence/
│   │   ├── ghosts/
│   │   ├── speed/
│   │   ├── timers/
│   │   └── voice/
│   ├── state/
│   ├── services/
│   ├── data/
│   ├── hooks/
│   ├── types/
│   ├── lib/
│   └── styles/
│
├── src-tauri/
│
├── sidecar/
│   ├── vosk_listener.py
│   └── models/
│
├── assets/
│
├── docs/
│   ├── architecture.md
│   ├── voice-protocol.md
│   └── testing.md
│
├── SPEC.md
└── AGENTS.md
```

---

# 35. Development Phases

Implement the project incrementally, one phase at a time.

Do not attempt to implement every feature in one pass.

## Phase 1 — Scaffold

Create:

- Tauri v2 project
- React + TypeScript frontend
- Tailwind
- Framer Motion
- Zustand
- Basic Rust structure
- Basic project structure

Acceptance criteria:

- Application launches.
- Main window renders.
- TypeScript passes.
- Rust checks/builds successfully.

---

## Phase 2 — Main Window UI

Build a polished static Main Window using mock data.

Implement:

- Header
- Evidence panel
- Ghost cards
- Investigation tools
- Diagnostics area
- Settings entry point

No real backend functionality required yet.

Acceptance criteria:

- Main UI looks complete with mock data.
- Responsive layout.
- No TypeScript errors.

---

## Phase 3 — State and Domain Logic

Implement:

- Zustand state
- Evidence state
- Ghost data
- Ghost filtering
- Domain-layer tests

Acceptance criteria:

- Evidence changes update possible ghosts.
- Impossible ghosts remain visible but de-emphasized.
- Domain tests pass.
- UI contains no ghost-filtering logic.

---

## Phase 4 — Overlay

Implement the second Tauri window.

Acceptance criteria:

- Transparent.
- Frameless.
- Always on top.
- Click-through.
- Non-focusable.
- Does not appear in taskbar.
- Main and Overlay reflect the same state.
- Overlay looks correct over arbitrary backgrounds.

---

## Phase 5 — Python Sidecar

Implement:

- Sidecar process launch
- Shutdown
- stdout reading
- JSON parsing
- Error handling
- Status reporting

Initially, use a mock Python listener if necessary before connecting Vosk.

Acceptance criteria:

- Rust can launch the sidecar.
- Rust receives structured JSON.
- Sidecar failure does not crash the application.
- Manual restart works.

---

## Phase 6 — Voice Recognition

Implement Vosk integration.

Acceptance criteria:

- Listener recognizes wake word.
- Commands are ignored without wake word.
- Supported commands update application state.
- Voice status is visible.
- Missing model is handled gracefully.

---

## Phase 7 — Ghost Filtering

Finalize:

- Complete ghost dataset
- Evidence rules
- Possible/impossible states
- UI transitions

Acceptance criteria:

- Filtering is correct for the complete dataset.
- Ghost logic exists in data/domain code rather than UI components.

---

## Phase 8 — Timers

Implement:

- Smudge timer
- Hunt cooldown
- Countdown UI
- Start/reset behavior
- Persistence of timer configuration where applicable

Acceptance criteria:

- Timers remain accurate while application focus changes.
- Timers do not drift significantly.
- Timers correctly expire.

---

## Phase 9 — Footstep Timing

Implement:

- Timing mode
- Global hotkey
- Space/Numpad 0 capture
- Timestamp storage
- Speed calculation
- Ghost comparison
- Overlay display

Acceptance criteria:

- Five timestamps can be captured.
- Speed calculation matches the specified formula.
- Timing state is synchronized across windows.
- Reset/new sessions work correctly.

---

## Phase 10 — Persistence

Implement Tauri Store persistence for:

- Window geometry
- Overlay geometry
- Settings
- Microphone
- Hotkeys
- Theme

Acceptance criteria:

- Settings survive application restart.
- Active investigation state does not persist by default.
- Invalid stored data falls back safely.

---

## Phase 11 — Quality

Focus on functional quality:

- CPU usage
- React rerender behavior
- Overlay performance
- Error states
- Startup behavior
- Type safety
- Test coverage
- Long-session reliability
- Recovery from subsystem failures

Do not refactor working architecture merely for stylistic reasons.

Acceptance criteria:

- Functional requirements remain correct after extended use.
- No known type, lint, build, or test errors remain.
- Recoverable failures do not destabilize unrelated features.
- Performance targets remain reasonable.

---

## Phase 12 — Polish

Focus on user-facing refinement:

- Animation smoothness
- Visual consistency
- Typography
- Spacing
- Accessibility/readability
- Empty/loading/error states
- Micro-interactions
- Overall visual cohesion

Do not change functional behavior merely to achieve visual polish.

Acceptance criteria:

- Main Window and Overlay feel like one cohesive product.
- Visual hierarchy is clear.
- Animations remain subtle and performant.
- No major usability issues remain.

---

# 36. Testing Requirements

At the end of each phase, perform applicable checks.

At minimum:

1. TypeScript typecheck
2. Rust check/build
3. Relevant automated tests
4. Manual verification for OS/window behavior

Prioritize automated tests for:

- Evidence filtering
- Ghost filtering
- Speed calculations
- Timer semantics
- Voice command normalization
- JSON protocol parsing
- State transitions

Manual tests are appropriate for:

- Window transparency
- Click-through behavior
- Always-on-top behavior
- Taskbar behavior
- Global hotkeys
- Microphone operation
- Visual appearance

---

# 37. Acceptance Criteria

The project is complete when all of the following are true:

## Core

- [ ] Application launches reliably.
- [ ] Main Window is fully functional.
- [ ] Overlay Window is fully functional.
- [ ] Both windows remain synchronized.
- [ ] Application works offline.

## Ghost Investigation

- [ ] Evidence can be tracked.
- [ ] Complete ghost data is represented.
- [ ] Possible ghosts are calculated correctly.
- [ ] Impossible ghosts remain visible but de-emphasized.

## Voice

- [ ] Vosk runs locally.
- [ ] Wake word is required.
- [ ] Supported commands work.
- [ ] Voice status is visible.
- [ ] Sidecar failure is recoverable.
- [ ] Missing model is handled gracefully.

## Timing

- [ ] Global timing hotkey works.
- [ ] Footsteps can be captured.
- [ ] Speed is calculated correctly.
- [ ] Speed is shown in the overlay.
- [ ] Smudge timer works.
- [ ] Hunt cooldown works.

## Overlay

- [ ] Transparent.
- [ ] Click-through.
- [ ] Always on top.
- [ ] Non-focusable.
- [ ] Not in taskbar.
- [ ] Minimal gameplay distraction.
- [ ] No noticeable game performance impact.

## Persistence

- [ ] Window geometry persists.
- [ ] Settings persist.
- [ ] Hotkeys persist.
- [ ] Microphone selection persists.
- [ ] Theme persists.
- [ ] Active investigation does not persist by default.

## Quality

- [ ] TypeScript strict mode passes.
- [ ] No `any`.
- [ ] Rust checks/builds successfully.
- [ ] Domain logic has meaningful tests.
- [ ] No major business logic resides in React components.
- [ ] No unnecessary polling.
- [ ] No unnecessary network dependency.

---

# 38. AI Agent Operating Rules

The coding agent must follow these rules while implementing the project.

## Before coding

1. Read this entire specification.
2. Inspect the existing repository.
3. Inspect installed dependency versions.
4. Before modifying code, inspect all files directly related to the feature or architectural boundary being changed.
5. Understand the existing architecture before modifying it.
6. Extend existing abstractions when they already solve the relevant problem.
7. Implement only the current development phase.
8. Do not replace established project architecture with generated boilerplate.

## During coding

1. Do not refactor unrelated code.
2. Do not duplicate business logic.
3. Do not create parallel implementations when an existing abstraction can be extended.
4. Do not weaken requirements to make an implementation easier.
5. Do not silently remove functionality.
6. Do not introduce unnecessary dependencies.
7. Prefer small, cohesive changes.
8. Preserve strong typing.
9. Keep domain logic independent of UI.
10. Prefer reusable components when reuse is real.
11. Avoid unnecessary placeholder implementations, speculative TODOs, and dead code.
12. Do not over-engineer trivial features.

## Type Safety

Never suppress TypeScript, Rust, or lint errors merely to make the project compile or pass a superficial check.

Do not use:

- `any` as an escape hatch
- Unnecessary `@ts-ignore` / `@ts-expect-error`
- Broad lint disables
- Unsafe casts used only to silence errors
- Rust warnings/errors hidden solely to avoid fixing the underlying design

When a type or lint error exposes a design problem, redesign the implementation instead of weakening type safety.

## Validation

After each meaningful implementation step:

1. Run TypeScript checks.
2. Run Rust checks where relevant.
3. Run lint checks where configured.
4. Run relevant tests.
5. Fix errors before proceeding.
6. Verify that the implementation still satisfies this specification.

Do not proceed while known compilation, type, lint, or test errors remain unless the error is explicitly documented as an unavoidable external issue.

## Documentation

Maintain:

- `docs/architecture.md`
- `docs/voice-protocol.md`
- `docs/testing.md`

At the end of every completed phase, update the relevant documentation with important:

- Implementation decisions
- Assumptions
- Architectural changes
- Protocol changes
- Deviations from this specification
- Known limitations

Keep documentation concise and accurate.

## Decision-making

The agent may make reasonable implementation decisions for:

- Component decomposition
- File naming
- Internal helper functions
- CSS implementation
- Internal data structures
- Testing framework configuration
- Non-user-visible implementation details

The agent must stop and request clarification before making a decision that would:

- Change the technology stack
- Change the fundamental IPC architecture
- Add an online/cloud dependency
- Add telemetry
- Change persistence semantics
- Remove or weaken a stated requirement
- Change important user-visible behavior
- Require game-memory access, game modification, input injection, or automation

For non-critical ambiguity:

> Make the most reasonable engineering decision and document it.

For critical ambiguity:

> Ask for clarification rather than inventing a product requirement.

## Completion

At the end of each phase, report:

- What was implemented
- Files changed
- Tests/checks performed
- Known limitations
- Any decisions made due to ambiguity
- What remains for the next phase

Do not claim a feature is complete if it is only mocked or partially implemented.

---

# 39. Definition of Done

A feature is considered complete only when:

1. Its implementation exists.
2. It integrates with the existing architecture.
3. It is strongly typed.
4. Relevant tests/checks pass.
5. Failure cases have been considered.
6. The UI reflects the correct state.
7. The feature does not introduce unrelated regressions.
8. The implementation satisfies the corresponding acceptance criteria.

A feature that merely renders a mock UI is not considered implemented unless the current phase explicitly calls for mock UI.

---

# 40. Guiding Principle

The agent is responsible for determining **how** to implement the requirements.

This document defines **what the product must do and the architectural boundaries it must respect**.

Do not over-constrain implementation details unnecessarily.

When multiple implementations satisfy the specification, prefer the solution that is:

1. Simple
2. Maintainable
3. Testable
4. Performant
5. Idiomatic for the selected technology
6. Easy for another developer to understand

The final application should feel like a cohesive, polished desktop product rather than a collection of independently generated features.
