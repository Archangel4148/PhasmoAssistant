import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { InvestigationSnapshot } from "../types/sync";

const STATE_CHANGED_EVENT = "state_changed";

export async function fetchInvestigationSnapshot(): Promise<InvestigationSnapshot> {
  return invoke<InvestigationSnapshot>("get_investigation_snapshot");
}

export async function publishInvestigationSnapshot(
  snapshot: InvestigationSnapshot,
): Promise<void> {
  await invoke("publish_investigation_snapshot", { snapshot });
}

export async function subscribeInvestigationSnapshot(
  onSnapshot: (snapshot: InvestigationSnapshot) => void,
): Promise<UnlistenFn> {
  return listen<InvestigationSnapshot>(STATE_CHANGED_EVENT, (event) => {
    onSnapshot(event.payload);
  });
}
