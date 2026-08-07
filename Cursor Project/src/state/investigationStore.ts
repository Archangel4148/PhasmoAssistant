import { create } from "zustand";
import { GHOSTS } from "../data/ghosts";
import {
  buildGhostDisplayItems,
  filterPossibleGhostIds,
} from "../domain/ghosts";
import {
  createInitialEvidenceMap,
  cycleEvidenceEntry,
  evidenceMapToEntries,
  setEvidenceEntryState,
  type EvidenceMap,
} from "../domain/evidence";
import { EVIDENCE_BY_ID } from "../data/evidence";
import type { VoiceAction } from "../domain/voice";
import type { EvidenceEntry, EvidenceId } from "../types/evidence";
import type { GhostDisplayItem } from "../types/ghost";
import type { InvestigationSnapshot, OverlayToast } from "../types/sync";
import {
  clampTickerSpeed,
  DEFAULT_OVERLAY_APPEARANCE,
  normalizeHexColor,
  type OverlayAppearanceSettings,
} from "../types/overlayAppearance";
import { publishInvestigationSnapshot } from "../services/investigationSync";

interface InvestigationView {
  evidence: EvidenceMap;
  eliminatedGhostIds: string[];
  evidenceEntries: EvidenceEntry[];
  ghosts: GhostDisplayItem[];
  possibleGhostCount: number;
  timingMode: boolean;
  smudgeRemainingSeconds: number | null;
  huntRemainingSeconds: number | null;
  currentGhostSpeedMps: number | null;
  toasts: OverlayToast[];
  overlayAppearance: OverlayAppearanceSettings;
}

interface InvestigationStoreState extends InvestigationView {
  /** When true, local mutations publish to Rust for cross-window sync. */
  isSyncPublisher: boolean;
  setSyncPublisher: (enabled: boolean) => void;
  hydrateFromSnapshot: (snapshot: InvestigationSnapshot) => void;
  cycleEvidence: (id: EvidenceId) => void;
  setEvidenceState: (
    id: EvidenceId,
    state: EvidenceEntry["state"],
    voiceConfirmed?: boolean,
  ) => void;
  setOverlayAppearance: (patch: Partial<OverlayAppearanceSettings>) => void;
  applyVoiceAction: (action: VoiceAction) => void;
  resetInvestigation: () => void;
}

type InvestigationExtras = Pick<
  InvestigationView,
  | "timingMode"
  | "smudgeRemainingSeconds"
  | "huntRemainingSeconds"
  | "currentGhostSpeedMps"
  | "toasts"
  | "overlayAppearance"
>;

function buildGhostView(
  evidence: EvidenceMap,
  eliminatedGhostIds: string[],
): Pick<
  InvestigationView,
  "evidence" | "eliminatedGhostIds" | "evidenceEntries" | "ghosts" | "possibleGhostCount"
> {
  const possibleGhostIds = filterPossibleGhostIds(
    GHOSTS,
    evidence,
    eliminatedGhostIds,
  );

  return {
    evidence,
    eliminatedGhostIds,
    evidenceEntries: evidenceMapToEntries(evidence),
    ghosts: buildGhostDisplayItems(GHOSTS, possibleGhostIds),
    possibleGhostCount: possibleGhostIds.size,
  };
}

function buildInvestigationView(
  evidence: EvidenceMap,
  eliminatedGhostIds: string[],
  extras: InvestigationExtras,
): InvestigationView {
  return {
    ...buildGhostView(evidence, eliminatedGhostIds),
    ...extras,
  };
}

function resolveOverlayAppearance(
  value: InvestigationSnapshot["overlayAppearance"] | undefined,
): OverlayAppearanceSettings {
  if (!value) {
    return { ...DEFAULT_OVERLAY_APPEARANCE };
  }

  return {
    ghostTextColor: normalizeHexColor(
      value.ghostTextColor,
      DEFAULT_OVERLAY_APPEARANCE.ghostTextColor,
    ),
    tickerSpeedPxPerSec: clampTickerSpeed(value.tickerSpeedPxPerSec),
  };
}

function toSnapshot(state: InvestigationView): InvestigationSnapshot {
  return {
    evidence: state.evidence,
    eliminatedGhostIds: state.eliminatedGhostIds,
    timingMode: state.timingMode,
    smudgeRemainingSeconds: state.smudgeRemainingSeconds,
    huntRemainingSeconds: state.huntRemainingSeconds,
    currentGhostSpeedMps: state.currentGhostSpeedMps,
    toasts: state.toasts,
    overlayAppearance: state.overlayAppearance,
  };
}

function publishIfNeeded(state: InvestigationStoreState): void {
  if (!state.isSyncPublisher) {
    return;
  }

  void publishInvestigationSnapshot(toSnapshot(state)).catch((error: unknown) => {
    console.error("Failed to publish investigation snapshot", error);
  });
}

function createEvidenceToast(
  id: EvidenceId,
  state: EvidenceEntry["state"],
): OverlayToast | null {
  if (state !== "confirmed") {
    return null;
  }

  return {
    id: `toast-${id}-${Date.now()}`,
    message: `✓ ${EVIDENCE_BY_ID[id].label} Logged`,
    createdAtMs: Date.now(),
  };
}

function resolveEvidenceMap(value: unknown): EvidenceMap {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  ) {
    return value as EvidenceMap;
  }

  return createInitialEvidenceMap();
}

function trimToasts(toasts: OverlayToast[]): OverlayToast[] {
  const cutoff = Date.now() - 2500;
  return toasts.filter((toast) => toast.createdAtMs >= cutoff).slice(-5);
}

function keepSessionExtras(state: InvestigationView): InvestigationExtras {
  return {
    timingMode: state.timingMode,
    smudgeRemainingSeconds: state.smudgeRemainingSeconds,
    huntRemainingSeconds: state.huntRemainingSeconds,
    currentGhostSpeedMps: state.currentGhostSpeedMps,
    toasts: state.toasts,
    overlayAppearance: state.overlayAppearance,
  };
}

const initialView = buildInvestigationView(createInitialEvidenceMap(), [], {
  timingMode: false,
  smudgeRemainingSeconds: null,
  huntRemainingSeconds: null,
  currentGhostSpeedMps: null,
  toasts: [],
  overlayAppearance: { ...DEFAULT_OVERLAY_APPEARANCE },
});

export const useInvestigationStore = create<InvestigationStoreState>((set, get) => ({
  ...initialView,
  isSyncPublisher: false,

  setSyncPublisher: (enabled) => set({ isSyncPublisher: enabled }),

  hydrateFromSnapshot: (snapshot) => {
    const evidence = resolveEvidenceMap(snapshot.evidence);

    set(
      buildInvestigationView(evidence, snapshot.eliminatedGhostIds ?? [], {
        timingMode: snapshot.timingMode ?? false,
        smudgeRemainingSeconds: snapshot.smudgeRemainingSeconds ?? null,
        huntRemainingSeconds: snapshot.huntRemainingSeconds ?? null,
        currentGhostSpeedMps: snapshot.currentGhostSpeedMps ?? null,
        toasts: snapshot.toasts ?? [],
        overlayAppearance: resolveOverlayAppearance(snapshot.overlayAppearance),
      }),
    );
  },

  cycleEvidence: (id) => {
    const previous = get();
    const nextEvidence = cycleEvidenceEntry(previous.evidence, id);
    const toast = createEvidenceToast(id, nextEvidence[id].state);
    const toasts = trimToasts(
      toast ? [...previous.toasts, toast] : previous.toasts,
    );

    const next = buildInvestigationView(nextEvidence, previous.eliminatedGhostIds, {
      ...keepSessionExtras(previous),
      toasts,
    });

    set({ ...next, isSyncPublisher: previous.isSyncPublisher });
    publishIfNeeded(get());
  },

  setEvidenceState: (id, nextState, voiceConfirmed = false) => {
    const previous = get();
    const nextEvidence = setEvidenceEntryState(
      previous.evidence,
      id,
      nextState,
      voiceConfirmed,
    );
    const toast = createEvidenceToast(id, nextState);
    const toasts = trimToasts(
      toast ? [...previous.toasts, toast] : previous.toasts,
    );

    const next = buildInvestigationView(nextEvidence, previous.eliminatedGhostIds, {
      ...keepSessionExtras(previous),
      toasts,
    });

    set({ ...next, isSyncPublisher: previous.isSyncPublisher });
    publishIfNeeded(get());
  },

  setOverlayAppearance: (patch) => {
    const previous = get();
    const nextAppearance: OverlayAppearanceSettings = {
      ghostTextColor: normalizeHexColor(
        patch.ghostTextColor ?? previous.overlayAppearance.ghostTextColor,
      ),
      tickerSpeedPxPerSec: clampTickerSpeed(
        patch.tickerSpeedPxPerSec ??
          previous.overlayAppearance.tickerSpeedPxPerSec,
      ),
    };

    set({
      overlayAppearance: nextAppearance,
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  applyVoiceAction: (action) => {
    const previous = get();

    switch (action.type) {
      case "confirm_evidence": {
        const nextEvidence = setEvidenceEntryState(
          previous.evidence,
          action.evidenceId,
          "confirmed",
          true,
        );
        const toast = createEvidenceToast(action.evidenceId, "confirmed");
        const toasts = trimToasts(
          toast ? [...previous.toasts, toast] : previous.toasts,
        );
        const next = buildInvestigationView(
          nextEvidence,
          previous.eliminatedGhostIds,
          { ...keepSessionExtras(previous), toasts },
        );
        set({ ...next, isSyncPublisher: previous.isSyncPublisher });
        break;
      }
      case "start_smudge": {
        const toast: OverlayToast = {
          id: `toast-smudge-${Date.now()}`,
          message: "✓ Smudge Started",
          createdAtMs: Date.now(),
        };
        set({
          smudgeRemainingSeconds: action.durationSeconds,
          toasts: trimToasts([...previous.toasts, toast]),
          isSyncPublisher: previous.isSyncPublisher,
        });
        break;
      }
      case "toggle_timing_mode": {
        const enabled = !previous.timingMode;
        const toast: OverlayToast = {
          id: `toast-timing-${Date.now()}`,
          message: enabled ? "✓ Timing Started" : "✓ Timing Stopped",
          createdAtMs: Date.now(),
        };
        set({
          timingMode: enabled,
          toasts: trimToasts([...previous.toasts, toast]),
          isSyncPublisher: previous.isSyncPublisher,
        });
        break;
      }
      case "start_hunt_cooldown": {
        const toast: OverlayToast = {
          id: `toast-hunt-${Date.now()}`,
          message: "✓ Hunt Cooldown Started",
          createdAtMs: Date.now(),
        };
        set({
          huntRemainingSeconds: action.durationSeconds,
          toasts: trimToasts([...previous.toasts, toast]),
          isSyncPublisher: previous.isSyncPublisher,
        });
        break;
      }
    }

    publishIfNeeded(get());
  },

  resetInvestigation: () => {
    const previous = get();
    const next = buildInvestigationView(createInitialEvidenceMap(), [], {
      timingMode: false,
      smudgeRemainingSeconds: null,
      huntRemainingSeconds: null,
      currentGhostSpeedMps: null,
      toasts: [],
      overlayAppearance: previous.overlayAppearance,
    });
    set({ ...next, isSyncPublisher: previous.isSyncPublisher });
    publishIfNeeded(get());
  },
}));
