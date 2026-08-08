import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import type { WindowGeometry } from "../types/persistedPreferences";

export async function readCurrentWindowGeometry(): Promise<WindowGeometry | null> {
  try {
    const window = getCurrentWindow();
    const position = await window.outerPosition();
    const size = await window.outerSize();
    const factor = await window.scaleFactor();
    return {
      x: Math.round(position.x / factor),
      y: Math.round(position.y / factor),
      width: Math.round(size.width / factor),
      height: Math.round(size.height / factor),
    };
  } catch (error: unknown) {
    console.warn("Failed to read window geometry", error);
    return null;
  }
}

export async function applyWindowGeometry(
  geometry: WindowGeometry,
): Promise<void> {
  try {
    const window = getCurrentWindow();
    await window.setSize(new LogicalSize(geometry.width, geometry.height));
    await window.setPosition(new LogicalPosition(geometry.x, geometry.y));
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
