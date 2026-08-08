import { invoke } from "@tauri-apps/api/core";

/** Temporarily allow dragging/resizing the overlay (gameplay remains click-through when false). */
export async function setOverlayInteractive(
  interactive: boolean,
): Promise<void> {
  await invoke("set_overlay_interactive", { interactive });
}
