/** Soft muted slate — readable on dark games without harsh white flash. */
export const DEFAULT_OVERLAY_GHOST_TEXT_COLOR = "#9aa7b8";

/** Gentler default ticker pace (px/sec). */
export const DEFAULT_OVERLAY_TICKER_SPEED_PX_PER_SEC = 26;

export const OVERLAY_TICKER_SPEED_MIN = 8;
export const OVERLAY_TICKER_SPEED_MAX = 80;

export interface OverlayAppearanceSettings {
  ghostTextColor: string;
  tickerSpeedPxPerSec: number;
}

export const DEFAULT_OVERLAY_APPEARANCE: OverlayAppearanceSettings = {
  ghostTextColor: DEFAULT_OVERLAY_GHOST_TEXT_COLOR,
  tickerSpeedPxPerSec: DEFAULT_OVERLAY_TICKER_SPEED_PX_PER_SEC,
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
