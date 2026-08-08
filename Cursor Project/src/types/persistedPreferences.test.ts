import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERSISTED_PREFERENCES,
  resolvePersistedPreferences,
} from "./persistedPreferences";

describe("resolvePersistedPreferences", () => {
  it("returns defaults for invalid payloads", () => {
    expect(resolvePersistedPreferences(null)).toEqual(
      DEFAULT_PERSISTED_PREFERENCES,
    );
    expect(resolvePersistedPreferences("nope")).toEqual(
      DEFAULT_PERSISTED_PREFERENCES,
    );
  });

  it("keeps valid fields and repairs invalid ones", () => {
    const resolved = resolvePersistedPreferences({
      version: 99,
      theme: "light",
      mainWindow: { x: 10, y: 20, width: 1280, height: 800 },
      overlay: { scale: 2.5, geometry: { x: 0, y: 0, width: 100, height: 100 } },
      investigationSettings: {
        ghostSpeedMultiplier: 0.5,
        timingResultHideAfterSeconds: 99,
      },
      hotkeys: { toggleTiming: "  Alt+T  ", recordFootstep: ["Space"] },
      microphone: { deviceId: "mic-1", label: "Headset" },
      overlayAppearance: {
        ghostTextColor: "#ff00aa",
        tickerSpeedPxPerSec: 40,
      },
      smudgeDurationSeconds: 180,
      huntCooldownDurationSeconds: 15,
      garbage: true,
    });

    expect(resolved.theme).toBe("light");
    expect(resolved.mainWindow).toEqual({
      x: 10,
      y: 20,
      width: 1280,
      height: 800,
      maximized: false,
    });
    expect(resolved.overlay.scale).toBe(1.5);
    expect(resolved.overlay.geometry).toBeNull(); // height too small
    expect(resolved.investigationSettings.ghostSpeedMultiplier).toBe(0.5);
    expect(resolved.investigationSettings.timingResultHideAfterSeconds).toBe(
      15,
    );
    expect(resolved.investigationSettings.evidenceDifficulty).toBe("standard");
    expect(resolved.hotkeys.toggleTiming).toBe("Alt+T");
    expect(resolved.hotkeys.recordFootstep).toEqual(["Space"]);
    expect(resolved.microphone).toEqual({
      deviceId: "mic-1",
      label: "Headset",
      enabled: true,
    });
    expect(resolved.overlayAppearance.ghostTextColor).toBe("#ff00aa");
    expect(resolved.overlayAppearance.hudScale).toBe(1.5);
    expect(resolved.overlayAppearance.showGhosts).toBe(true);
    expect(resolved.smudgeDurationSeconds).toBe(180);
    expect(resolved.huntCooldownDurationSeconds).toBe(15);
  });
});
