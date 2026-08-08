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
  resolveEvidenceMap,
  setEvidenceEntryState,
  type EvidenceMap,
} from "../domain/evidence";
import {
  appendFootstepTimestamp,
  calculateGhostSpeedMps,
  MAX_FOOTSTEP_TIMESTAMPS,
} from "../domain/speed";
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
import {
  DEFAULT_INVESTIGATION_SETTINGS,
  resolveInvestigationSettings,
  type InvestigationSettings,
} from "../types/investigationSettings";
import type { InvestigationSnapshot, OverlayToast } from "../types/sync";
import type { InvestigationTimer } from "../types/timer";
import {
  clampTickerSpeed,
  DEFAULT_OVERLAY_APPEARANCE,
  normalizeHexColor,
  type OverlayAppearanceSettings,
} from "../types/overlayAppearance";
import { publishInvestigationSnapshot } from "../services/investigationSync";
import { usePreferencesStore } from "./preferencesStore";
import { useVoiceDiagnosticsStore } from "./voiceDiagnosticsStore";

interface InvestigationView {
  evidence: EvidenceMap;
  eliminatedGhostIds: string[];
  evidenceEntries: EvidenceEntry[];
  ghosts: GhostDisplayItem[];
  possibleGhostCount: number;
  timingMode: boolean;
  timingTimestampsMs: number[];
  timingResultCompletedAtMs: number | null;
  smudgeTimer: InvestigationTimer;
  huntTimer: InvestigationTimer;
  currentGhostSpeedMps: number | null;
  toasts: OverlayToast[];
  overlayAppearance: OverlayAppearanceSettings;
  settings: InvestigationSettings;
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
  setInvestigationSettings: (patch: Partial<InvestigationSettings>) => void;
  applyVoiceAction: (action: VoiceAction) => void;
  toggleGhostEliminated: (ghostId: string) => void;
  toggleTimingMode: () => void;
  recordFootstep: (nowMs?: number) => void;
  resetTiming: () => void;
  pruneExpiredToasts: (ttlMs?: number) => void;
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
  | "timingTimestampsMs"
  | "timingResultCompletedAtMs"
  | "smudgeTimer"
  | "huntTimer"
  | "currentGhostSpeedMps"
  | "toasts"
  | "overlayAppearance"
  | "settings"
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

function resolveTimestamps(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (entry): entry is number =>
      typeof entry === "number" && Number.isFinite(entry),
  );
}

function deriveSpeedMps(
  timestampsMs: readonly number[],
  settings: InvestigationSettings,
): number | null {
  return calculateGhostSpeedMps(timestampsMs, settings.ghostSpeedMultiplier);
}

function withDerivedSpeed(
  extras: Omit<InvestigationExtras, "currentGhostSpeedMps">,
): InvestigationExtras {
  return {
    ...extras,
    currentGhostSpeedMps: deriveSpeedMps(
      extras.timingTimestampsMs,
      extras.settings,
    ),
  };
}

function toSnapshot(state: InvestigationView): InvestigationSnapshot {
  return {
    evidence: state.evidence,
    eliminatedGhostIds: state.eliminatedGhostIds,
    timingMode: state.timingMode,
    timingTimestampsMs: state.timingTimestampsMs,
    timingResultCompletedAtMs: state.timingResultCompletedAtMs,
    smudgeTimer: state.smudgeTimer,
    huntTimer: state.huntTimer,
    toasts: state.toasts,
    overlayAppearance: state.overlayAppearance,
    settings: state.settings,
  };
}

function publishIfNeeded(state: InvestigationStoreState): void {
  if (!state.isSyncPublisher) {
    return;
  }

  void publishInvestigationSnapshot(toSnapshot(state)).catch((error: unknown) => {
    console.error("Failed to publish investigation snapshot", error);
    useVoiceDiagnosticsStore
      .getState()
      .reportAppWarning(
        "Failed to sync investigation state to the overlay. UI remains usable.",
      );
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

function resolveEliminatedGhostIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
}

function resolveToasts(value: unknown): OverlayToast[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const now = Date.now();
  return value
    .filter((entry): entry is OverlayToast => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      const toast = entry as Record<string, unknown>;
      return (
        typeof toast.id === "string" &&
        typeof toast.message === "string" &&
        typeof toast.createdAtMs === "number" &&
        Number.isFinite(toast.createdAtMs)
      );
    })
    .filter((toast) => now - toast.createdAtMs < 10_000)
    .slice(-8);
}

function trimToasts(toasts: OverlayToast[]): OverlayToast[] {
  const cutoff = Date.now() - 2500;
  return toasts.filter((toast) => toast.createdAtMs >= cutoff).slice(-5);
}

function keepSessionExtras(state: InvestigationView): InvestigationExtras {
  return {
    timingMode: state.timingMode,
    timingTimestampsMs: state.timingTimestampsMs,
    timingResultCompletedAtMs: state.timingResultCompletedAtMs,
    smudgeTimer: state.smudgeTimer,
    huntTimer: state.huntTimer,
    currentGhostSpeedMps: state.currentGhostSpeedMps,
    toasts: state.toasts,
    overlayAppearance: state.overlayAppearance,
    settings: state.settings,
  };
}

const initialView = buildInvestigationView(createInitialEvidenceMap(), [], {
  timingMode: false,
  timingTimestampsMs: [],
  timingResultCompletedAtMs: null,
  smudgeTimer: createIdleTimer(DEFAULT_SMUDGE_SECONDS),
  huntTimer: createIdleTimer(DEFAULT_HUNT_COOLDOWN_SECONDS),
  currentGhostSpeedMps: null,
  toasts: [],
  overlayAppearance: { ...DEFAULT_OVERLAY_APPEARANCE },
  settings: { ...DEFAULT_INVESTIGATION_SETTINGS },
});

export const useInvestigationStore = create<InvestigationStoreState>((set, get) => ({
  ...initialView,
  isSyncPublisher: false,

  setSyncPublisher: (enabled) => set({ isSyncPublisher: enabled }),

  hydrateFromSnapshot: (snapshot) => {
    const evidence = resolveEvidenceMap(snapshot.evidence);
    const timingTimestampsMs = resolveTimestamps(snapshot.timingTimestampsMs);
    const settings = resolveInvestigationSettings(snapshot.settings);

    set(
      buildInvestigationView(evidence, resolveEliminatedGhostIds(snapshot.eliminatedGhostIds), {
        timingMode: snapshot.timingMode === true,
        timingTimestampsMs,
        timingResultCompletedAtMs:
          typeof snapshot.timingResultCompletedAtMs === "number" &&
          Number.isFinite(snapshot.timingResultCompletedAtMs)
            ? snapshot.timingResultCompletedAtMs
            : null,
        smudgeTimer: resolveTimer(snapshot.smudgeTimer, DEFAULT_SMUDGE_SECONDS),
        huntTimer: resolveTimer(snapshot.huntTimer, DEFAULT_HUNT_COOLDOWN_SECONDS),
        currentGhostSpeedMps: deriveSpeedMps(timingTimestampsMs, settings),
        toasts: resolveToasts(snapshot.toasts),
        overlayAppearance: resolveOverlayAppearance(snapshot.overlayAppearance),
        settings,
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
    // Only the Main publisher owns disk persistence for appearance/settings.
    if (previous.isSyncPublisher) {
      usePreferencesStore.getState().setOverlayAppearancePrefs(nextAppearance);
    }
  },

  setInvestigationSettings: (patch) => {
    const previous = get();
    const settings = resolveInvestigationSettings({
      ...previous.settings,
      ...patch,
    });

    set({
      settings,
      currentGhostSpeedMps: deriveSpeedMps(
        previous.timingTimestampsMs,
        settings,
      ),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
    if (previous.isSyncPublisher) {
      usePreferencesStore.getState().setInvestigationSettingsPrefs(settings);
    }
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
        get().toggleTimingMode();
        return;
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

  toggleTimingMode: () => {
    const previous = get();
    const enabled = !previous.timingMode;
    const now = Date.now();
    const toast: OverlayToast = {
      id: `toast-timing-${now}`,
      message: enabled ? "✓ Timing Started" : "✓ Timing Stopped",
      createdAtMs: now,
    };

    // New session when enabling: clear prior timestamps. Stopping keeps last result.
    const timingTimestampsMs = enabled ? [] : previous.timingTimestampsMs;
    const timingResultCompletedAtMs = enabled
      ? null
      : timingTimestampsMs.length >= 2
        ? now
        : previous.timingResultCompletedAtMs;

    set({
      ...withDerivedSpeed({
        timingMode: enabled,
        timingTimestampsMs,
        timingResultCompletedAtMs,
        smudgeTimer: previous.smudgeTimer,
        huntTimer: previous.huntTimer,
        toasts: trimToasts([...previous.toasts, toast]),
        overlayAppearance: previous.overlayAppearance,
        settings: previous.settings,
      }),
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  recordFootstep: (nowMs = Date.now()) => {
    const previous = get();
    if (!previous.timingMode) {
      return;
    }

    const timingTimestampsMs = appendFootstepTimestamp(
      previous.timingTimestampsMs,
      nowMs,
    );
    if (timingTimestampsMs === previous.timingTimestampsMs) {
      return;
    }

    const complete = timingTimestampsMs.length >= MAX_FOOTSTEP_TIMESTAMPS;
    const toast: OverlayToast | null = complete
      ? {
          id: `toast-timing-complete-${nowMs}`,
          message: "✓ Timing Complete",
          createdAtMs: nowMs,
        }
      : null;

    set({
      timingTimestampsMs,
      currentGhostSpeedMps: deriveSpeedMps(
        timingTimestampsMs,
        previous.settings,
      ),
      timingMode: complete ? false : previous.timingMode,
      timingResultCompletedAtMs: complete
        ? nowMs
        : previous.timingResultCompletedAtMs,
      toasts: toast
        ? trimToasts([...previous.toasts, toast])
        : previous.toasts,
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  resetTiming: () => {
    const previous = get();
    set({
      timingTimestampsMs: [],
      currentGhostSpeedMps: null,
      timingResultCompletedAtMs: null,
      isSyncPublisher: previous.isSyncPublisher,
    });
    publishIfNeeded(get());
  },

  pruneExpiredToasts: (ttlMs = 2500) => {
    const previous = get();
    const cutoff = Date.now() - ttlMs;
    const toasts = previous.toasts.filter(
      (toast) => toast.createdAtMs >= cutoff,
    );
    if (toasts.length === previous.toasts.length) {
      return;
    }
    set({
      toasts,
      isSyncPublisher: previous.isSyncPublisher,
    });
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
    if (previous.isSyncPublisher) {
      usePreferencesStore.getState().setTimerDefaults({
        smudgeDurationSeconds: durationSeconds,
      });
    }
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
    if (previous.isSyncPublisher) {
      usePreferencesStore.getState().setTimerDefaults({
        huntCooldownDurationSeconds: durationSeconds,
      });
    }
  },

  resetInvestigation: () => {
    const previous = get();
    const next = buildInvestigationView(createInitialEvidenceMap(), [], {
      timingMode: false,
      timingTimestampsMs: [],
      timingResultCompletedAtMs: null,
      smudgeTimer: createIdleTimer(previous.smudgeTimer.durationSeconds),
      huntTimer: createIdleTimer(previous.huntTimer.durationSeconds),
      currentGhostSpeedMps: null,
      toasts: [],
      overlayAppearance: previous.overlayAppearance,
      settings: previous.settings,
    });
    set({ ...next, isSyncPublisher: previous.isSyncPublisher });
    publishIfNeeded(get());
  },
}));
