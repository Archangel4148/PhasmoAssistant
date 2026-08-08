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
import {
  createIdleTimer,
  DEFAULT_HUNT_COOLDOWN_SECONDS,
  DEFAULT_SMUDGE_SECONDS,
  resetTimer,
  setTimerDuration,
  toggleTimer,
} from "../domain/timers";
import { EVIDENCE_BY_ID } from "../data/evidence";
import type { VoiceAction } from "../domain/voice";
import type { EvidenceEntry, EvidenceId } from "../types/evidence";
import type { GhostDisplayItem } from "../types/ghost";
import type { InvestigationSnapshot, OverlayToast } from "../types/sync";
import type { InvestigationTimer } from "../types/timer";
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
  smudgeTimer: InvestigationTimer;
  huntTimer: InvestigationTimer;
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
  toggleGhostEliminated: (ghostId: string) => void;
  startSmudgeTimer: () => void;
  resetSmudgeTimer: () => void;
  setSmudgeDurationSeconds: (durationSeconds: number) => void;
  startHuntCooldownTimer: () => void;
  resetHuntCooldownTimer: () => void;
  setHuntCooldownDurationSeconds: (durationSeconds: number) => void;
  resetInvestigation: () => void;
}

type InvestigationExtras = Pick<
  InvestigationView,
  | "timingMode"
  | "smudgeTimer"
  | "huntTimer"
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
    ghosts: buildGhostDisplayItems(GHOSTS, possibleGhostIds, eliminatedGhostIds),
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

function resolveTimer(
  value: InvestigationTimer | undefined,
  fallbackDuration: number,
): InvestigationTimer {
  if (!value || typeof value.durationSeconds !== "number") {
    return createIdleTimer(fallbackDuration);
  }

  return {
    durationSeconds: value.durationSeconds,
    startedAtMs:
      typeof value.startedAtMs === "number" && Number.isFinite(value.startedAtMs)
        ? value.startedAtMs
        : null,
  };
}

function toSnapshot(state: InvestigationView): InvestigationSnapshot {
  return {
    evidence: state.evidence,
    eliminatedGhostIds: state.eliminatedGhostIds,
    timingMode: state.timingMode,
    smudgeTimer: state.smudgeTimer,
    huntTimer: state.huntTimer,
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
    smudgeTimer: state.smudgeTimer,
    huntTimer: state.huntTimer,
    currentGhostSpeedMps: state.currentGhostSpeedMps,
    toasts: state.toasts,
    overlayAppearance: state.overlayAppearance,
  };
}

const initialView = buildInvestigationView(createInitialEvidenceMap(), [], {
  timingMode: false,
  smudgeTimer: createIdleTimer(DEFAULT_SMUDGE_SECONDS),
  huntTimer: createIdleTimer(DEFAULT_HUNT_COOLDOWN_SECONDS),
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
        smudgeTimer: resolveTimer(snapshot.smudgeTimer, DEFAULT_SMUDGE_SECONDS),
        huntTimer: resolveTimer(snapshot.huntTimer, DEFAULT_HUNT_COOLDOWN_SECONDS),
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
        const wasActive = previous.smudgeTimer.startedAtMs !== null;
        const toast: OverlayToast = {
          id: `toast-smudge-${Date.now()}`,
          message: wasActive ? "✓ Smudge Stopped" : "✓ Smudge Started",
          createdAtMs: Date.now(),
        };
        set({
          smudgeTimer: toggleTimer(previous.smudgeTimer, Date.now()),
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
        const wasActive = previous.huntTimer.startedAtMs !== null;
        const toast: OverlayToast = {
          id: `toast-hunt-${Date.now()}`,
          message: wasActive
            ? "✓ Hunt Cooldown Stopped"
            : "✓ Hunt Cooldown Started",
          createdAtMs: Date.now(),
        };
        set({
          huntTimer: toggleTimer(previous.huntTimer, Date.now()),
          toasts: trimToasts([...previous.toasts, toast]),
          isSyncPublisher: previous.isSyncPublisher,
        });
        break;
      }
    }

    publishIfNeeded(get());
  },

  toggleGhostEliminated: (ghostId) => {
    const previous = get();
    const already = previous.eliminatedGhostIds.includes(ghostId);
    const eliminatedGhostIds = already
      ? previous.eliminatedGhostIds.filter((id) => id !== ghostId)
      : [...previous.eliminatedGhostIds, ghostId];

    const next = buildInvestigationView(
      previous.evidence,
      eliminatedGhostIds,
      keepSessionExtras(previous),
    );
    set({ ...next, isSyncPublisher: previous.isSyncPublisher });
    publishIfNeeded(get());
  },

  startSmudgeTimer: () => {
    const previous = get();
    const wasActive = previous.smudgeTimer.startedAtMs !== null;
    const toast: OverlayToast = {
      id: `toast-smudge-${Date.now()}`,
      message: wasActive ? "✓ Smudge Stopped" : "✓ Smudge Started",
      createdAtMs: Date.now(),
    };
    set({
      smudgeTimer: toggleTimer(previous.smudgeTimer, Date.now()),
      toasts: trimToasts([...previous.toasts, toast]),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  resetSmudgeTimer: () => {
    const previous = get();
    set({
      smudgeTimer: resetTimer(previous.smudgeTimer),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  setSmudgeDurationSeconds: (durationSeconds) => {
    const previous = get();
    set({
      smudgeTimer: setTimerDuration(previous.smudgeTimer, durationSeconds),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  startHuntCooldownTimer: () => {
    const previous = get();
    const wasActive = previous.huntTimer.startedAtMs !== null;
    const toast: OverlayToast = {
      id: `toast-hunt-${Date.now()}`,
      message: wasActive
        ? "✓ Hunt Cooldown Stopped"
        : "✓ Hunt Cooldown Started",
      createdAtMs: Date.now(),
    };
    set({
      huntTimer: toggleTimer(previous.huntTimer, Date.now()),
      toasts: trimToasts([...previous.toasts, toast]),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  resetHuntCooldownTimer: () => {
    const previous = get();
    set({
      huntTimer: resetTimer(previous.huntTimer),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  setHuntCooldownDurationSeconds: (durationSeconds) => {
    const previous = get();
    set({
      huntTimer: setTimerDuration(previous.huntTimer, durationSeconds),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  resetInvestigation: () => {
    const previous = get();
    const next = buildInvestigationView(createInitialEvidenceMap(), [], {
      timingMode: false,
      // Keep configured thresholds; clear running stopwatches.
      smudgeTimer: createIdleTimer(previous.smudgeTimer.durationSeconds),
      huntTimer: createIdleTimer(previous.huntTimer.durationSeconds),
      currentGhostSpeedMps: null,
      toasts: [],
      overlayAppearance: previous.overlayAppearance,
    });
    set({ ...next, isSyncPublisher: previous.isSyncPublisher });
    publishIfNeeded(get());
  },
}));
