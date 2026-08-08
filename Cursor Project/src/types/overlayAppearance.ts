/** Soft muted slate — readable on dark games without harsh white flash. */
export const DEFAULT_OVERLAY_GHOST_TEXT_COLOR = "#9aa7b8";

/** Gentler default ticker pace (px/sec). */
export const DEFAULT_OVERLAY_TICKER_SPEED_PX_PER_SEC = 26;

export const OVERLAY_TICKER_SPEED_MIN = 8;
export const OVERLAY_TICKER_SPEED_MAX = 80;

export const OVERLAY_HUD_SCALE_MIN = 0.75;
export const OVERLAY_HUD_SCALE_MAX = 1.5;
export const DEFAULT_OVERLAY_HUD_SCALE = 1;

export interface OverlayAppearanceSettings {
  /** Accent + overlay ghost ticker color. */
  ghostTextColor: string;
  tickerSpeedPxPerSec: number;
  /** CSS HUD scale (does not change OS window size). Synced Main → Overlay. */
  hudScale: number;
  showGhosts: boolean;
  showTimers: boolean;
  showTiming: boolean;
  showToasts: boolean;
  /** Temporary layout edit mode (drag/resize); gameplay stays click-through when false. */
  layoutEditMode: boolean;
}

export const DEFAULT_OVERLAY_APPEARANCE: OverlayAppearanceSettings = {
  ghostTextColor: DEFAULT_OVERLAY_GHOST_TEXT_COLOR,
  tickerSpeedPxPerSec: DEFAULT_OVERLAY_TICKER_SPEED_PX_PER_SEC,
  hudScale: DEFAULT_OVERLAY_HUD_SCALE,
  showGhosts: true,
  showTimers: true,
  showTiming: true,
  showToasts: true,
  layoutEditMode: false,
};

export function clampTickerSpeed(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OVERLAY_TICKER_SPEED_PX_PER_SEC;
  }

  return Math.min(
    OVERLAY_TICKER_SPEED_MAX,
    Math.max(OVERLAY_TICKER_SPEED_MIN, Math.round(value)),
  );
}

export function clampHudScale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OVERLAY_HUD_SCALE;
  }
  const clamped = Math.min(
    OVERLAY_HUD_SCALE_MAX,
    Math.max(OVERLAY_HUD_SCALE_MIN, value),
  );
  return Math.round(clamped * 100) / 100;
}

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{6})$/;

export function normalizeHexColor(
  value: string,
  fallback = DEFAULT_OVERLAY_GHOST_TEXT_COLOR,
): string {
  const trimmed = value.trim();
  if (HEX_COLOR_PATTERN.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return fallback;
}

export function resolveOverlayAppearance(
  value: Partial<OverlayAppearanceSettings> | null | undefined,
  legacyScale?: number,
): OverlayAppearanceSettings {
  const legacy =
    typeof legacyScale === "number" && Number.isFinite(legacyScale)
      ? legacyScale
      : undefined;

  return {
    ghostTextColor: normalizeHexColor(
      value?.ghostTextColor ?? DEFAULT_OVERLAY_GHOST_TEXT_COLOR,
    ),
    tickerSpeedPxPerSec: clampTickerSpeed(
      value?.tickerSpeedPxPerSec ?? DEFAULT_OVERLAY_TICKER_SPEED_PX_PER_SEC,
    ),
    hudScale: clampHudScale(
      value?.hudScale ?? legacy ?? DEFAULT_OVERLAY_HUD_SCALE,
    ),
    showGhosts: value?.showGhosts !== false,
    showTimers: value?.showTimers !== false,
    showTiming: value?.showTiming !== false,
    showToasts: value?.showToasts !== false,
    layoutEditMode: value?.layoutEditMode === true,
  };
}

/** Darken a hex color toward black for separators / secondary text. */
export function softenHexColor(hex: string, amount = 0.35): string {
  const normalized = normalizeHexColor(hex);
  const channels = [1, 3, 5].map((offset) =>
    Math.round(
      Number.parseInt(normalized.slice(offset, offset + 2), 16) * (1 - amount),
    ),
  );

  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Derive soft/border/strong accent variants from a hex color. */
export function accentTokensFromHex(hex: string): {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentBorder: string;
  focusRing: string;
} {
  const normalized = normalizeHexColor(hex);
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const lighten = (channel: number): number =>
    Math.min(255, Math.round(channel + (255 - channel) * 0.22));
  const strong = `#${[lighten(r), lighten(g), lighten(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
  return {
    accent: normalized,
    accentStrong: strong,
    accentSoft: `rgba(${r}, ${g}, ${b}, 0.14)`,
    accentBorder: `rgba(${r}, ${g}, ${b}, 0.42)`,
    focusRing: `rgba(${r}, ${g}, ${b}, 0.55)`,
  };
}

export function applyAccentToDocument(hex: string): void {
  const tokens = accentTokensFromHex(hex);
  const root = document.documentElement;
  root.style.setProperty("--accent", tokens.accent);
  root.style.setProperty("--accent-strong", tokens.accentStrong);
  root.style.setProperty("--accent-soft", tokens.accentSoft);
  root.style.setProperty("--accent-border", tokens.accentBorder);
  root.style.setProperty("--focus-ring", tokens.focusRing);
}
