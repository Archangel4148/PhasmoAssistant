# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added

- Maintenance documentation set (`ARCHITECTURE.md`, topic `docs/`, ADRs, this changelog)
- `npm run clean` for resetting build artifacts

### Changed

- Documentation source of truth moved off the build-phase SPEC (`archived_old_docs/`)

## [0.1.0] — 2026-08-08

Initial production release.

### Added

- Main investigation UI: evidence, ghosts, timers, footstep timing, settings, diagnostics
- Transparent click-through Overlay HUD with synced state
- Evidence difficulty modes (Amateur–Professional, Nightmare, Insanity, Apocalypse)
- Local Vosk voice sidecar (wake word `trigger`) with packaged PyInstaller binary for release
- Preference persistence (windows, overlay appearance, hotkeys, theme, microphone)
- NSIS one-click Windows installer bundling app + voice exe + Vosk model
- Application icon set from project assets

[Unreleased]: #unreleased
[0.1.0]: #010--2026-08-08
