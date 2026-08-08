import { load } from "@tauri-apps/plugin-store";
import {
  PREFERENCES_STORE_FILE,
  resolvePersistedPreferences,
  type PersistedPreferences,
} from "../types/persistedPreferences";

let storePromise: ReturnType<typeof load> | null = null;

async function getStore() {
  if (!storePromise) {
    storePromise = load(PREFERENCES_STORE_FILE, { autoSave: true });
  }
  return storePromise;
}

/** Load preferences from disk, falling back safely on any failure. */
export async function loadPersistedPreferences(): Promise<PersistedPreferences> {
  try {
    const store = await getStore();
    const raw = await store.get<unknown>("preferences");
    return resolvePersistedPreferences(raw);
  } catch (error: unknown) {
    console.warn("Failed to load persisted preferences; using defaults", error);
    return resolvePersistedPreferences(null);
  }
}

/** Persist preferences. Swallows errors so UI remains usable offline/browser. */
export async function savePersistedPreferences(
  preferences: PersistedPreferences,
): Promise<void> {
  try {
    const store = await getStore();
    await store.set("preferences", resolvePersistedPreferences(preferences));
    await store.save();
  } catch (error: unknown) {
    console.warn("Failed to save persisted preferences", error);
  }
}
