import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import type { WindowGeometry } from "../types/persistedPreferences";

export async function readCurrentWindowGeometry(): Promise<WindowGeometry | null> {
  try {
    const window = getCurrentWindow();
    const position = await window.outerPosition();
    const size = await window.outerSize();
    const factor = await window.scaleFactor();
    const maximized = await window.isMaximized();
    return {
      x: Math.round(position.x / factor),
      y: Math.round(position.y / factor),
      width: Math.round(size.width / factor),
      height: Math.round(size.height / factor),
      maximized,
    };
  } catch (error: unknown) {
    console.warn("Failed to read window geometry", error);
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function applyWindowGeometry(
  geometry: WindowGeometry,
): Promise<void> {
  try {
    const current = getCurrentWindow();
    if (await current.isMaximized()) {
      await current.unmaximize();
      // Let the window manager settle before moving across monitors.
      await delay(32);
    }

    if (geometry.maximized) {
      // Place a normal-sized window on the target monitor first, then maximize.
      // Maximizing immediately from primary defaults often sticks to monitor 1.
      const seedWidth = Math.min(Math.max(geometry.width, 960), 1280);
      const seedHeight = Math.min(Math.max(geometry.height, 640), 800);
      await current.setSize(new LogicalSize(seedWidth, seedHeight));
      await current.setPosition(
        new LogicalPosition(geometry.x + 48, geometry.y + 48),
      );
      await delay(48);
      await current.maximize();
      return;
    }

    await current.setSize(new LogicalSize(geometry.width, geometry.height));
    await current.setPosition(new LogicalPosition(geometry.x, geometry.y));
  } catch (error: unknown) {
    console.warn("Failed to apply window geometry", error);
  }
}

export async function maximizeCurrentWindow(): Promise<void> {
  try {
    await getCurrentWindow().maximize();
  } catch (error: unknown) {
    console.warn("Failed to maximize window", error);
  }
}

export async function unmaximizeCurrentWindow(): Promise<void> {
  try {
    const window = getCurrentWindow();
    if (await window.isMaximized()) {
      await window.unmaximize();
    }
  } catch (error: unknown) {
    console.warn("Failed to unmaximize window", error);
  }
}
