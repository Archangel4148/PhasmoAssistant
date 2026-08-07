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
import type { EvidenceEntry, EvidenceId } from "../types/evidence";
import type { GhostDisplayItem } from "../types/ghost";

interface InvestigationView {
  evidence: EvidenceMap;
  eliminatedGhostIds: string[];
  evidenceEntries: EvidenceEntry[];
  ghosts: GhostDisplayItem[];
  possibleGhostCount: number;
}

interface InvestigationStoreState extends InvestigationView {
  cycleEvidence: (id: EvidenceId) => void;
  setEvidenceState: (
    id: EvidenceId,
    state: EvidenceEntry["state"],
    voiceConfirmed?: boolean,
  ) => void;
  resetInvestigation: () => void;
}

function buildInvestigationView(
  evidence: EvidenceMap,
  eliminatedGhostIds: string[],
): InvestigationView {
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

const initialView = buildInvestigationView(createInitialEvidenceMap(), []);

export const useInvestigationStore = create<InvestigationStoreState>((set) => ({
  ...initialView,

  cycleEvidence: (id) =>
    set((state) =>
      buildInvestigationView(
        cycleEvidenceEntry(state.evidence, id),
        state.eliminatedGhostIds,
      ),
    ),

  setEvidenceState: (id, nextState, voiceConfirmed = false) =>
    set((state) =>
      buildInvestigationView(
        setEvidenceEntryState(
          state.evidence,
          id,
          nextState,
          voiceConfirmed,
        ),
        state.eliminatedGhostIds,
      ),
    ),

  resetInvestigation: () =>
    set(buildInvestigationView(createInitialEvidenceMap(), [])),
}));
