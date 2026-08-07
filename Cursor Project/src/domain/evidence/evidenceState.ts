import { EVIDENCE_DEFINITIONS } from "../../data/evidence";
import type { EvidenceEntry, EvidenceId } from "../../types/evidence";
import { cycleEvidenceState } from "./evidenceRules";

export type EvidenceMap = Record<EvidenceId, EvidenceEntry>;

export function createInitialEvidenceMap(): EvidenceMap {
  return Object.fromEntries(
    EVIDENCE_DEFINITIONS.map((definition) => [
      definition.id,
      {
        id: definition.id,
        state: "unknown" as const,
        voiceConfirmed: false,
      },
    ]),
  ) as EvidenceMap;
}

export function evidenceMapToEntries(evidence: EvidenceMap): EvidenceEntry[] {
  return EVIDENCE_DEFINITIONS.map((definition) => evidence[definition.id]);
}

export function setEvidenceEntryState(
  evidence: EvidenceMap,
  id: EvidenceId,
  state: EvidenceEntry["state"],
  voiceConfirmed = false,
): EvidenceMap {
  return {
    ...evidence,
    [id]: {
      ...evidence[id],
      state,
      voiceConfirmed,
    },
  };
}

export function cycleEvidenceEntry(
  evidence: EvidenceMap,
  id: EvidenceId,
): EvidenceMap {
  return setEvidenceEntryState(
    evidence,
    id,
    cycleEvidenceState(evidence[id].state),
    false,
  );
}
