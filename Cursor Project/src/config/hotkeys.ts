/**
 * Default global hotkeys. Kept data-driven so Phase 10 can make them configurable.
 */
export const DEFAULT_HOTKEYS = {
  /** Toggle footstep timing mode. */
  toggleTiming: "CommandOrControl+Shift+T",
  /**
   * Record a footstep while timing mode is active.
   * Registered only while timing mode is on so Space is not stolen globally otherwise.
   */
  recordFootstep: ["Space", "num0"] as const,
} as const;
