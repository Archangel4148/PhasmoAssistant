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

/** Hydrate evidence from sync/persist payloads; ignore unknown keys and bad shapes. */
export function resolveEvidenceMap(value: unknown): EvidenceMap {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return createInitialEvidenceMap();
  }

  const record = value as Record<string, unknown>;
  const initial = createInitialEvidenceMap();
  const validStates = new Set(["unknown", "confirmed", "eliminated"]);

  for (const id of Object.keys(initial) as EvidenceId[]) {
    const entry = record[id];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const entryRecord = entry as Record<string, unknown>;
    const state = entryRecord.state;
    if (typeof state !== "string" || !validStates.has(state)) {
      continue;
    }
    initial[id] = {
      id,
      state: state as EvidenceEntry["state"],
      voiceConfirmed: entryRecord.voiceConfirmed === true,
    };
  }

  return initial;
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
