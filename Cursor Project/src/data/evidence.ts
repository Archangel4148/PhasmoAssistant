import type { EvidenceDefinition } from "../types/evidence";

export const EVIDENCE_DEFINITIONS: readonly EvidenceDefinition[] = [
  { id: "emf5", label: "EMF Level 5", shortLabel: "EMF 5" },
  { id: "spiritBox", label: "Spirit Box", shortLabel: "Spirit Box" },
  { id: "fingerprints", label: "Ultraviolet", shortLabel: "UV" },
  { id: "ghostWriting", label: "Ghost Writing", shortLabel: "Writing" },
  { id: "ghostOrbs", label: "Ghost Orbs", shortLabel: "Orbs" },
  { id: "freezing", label: "Freezing Temps", shortLabel: "Freezing" },
  { id: "dots", label: "D.O.T.S.", shortLabel: "DOTS" },
] as const;

export const EVIDENCE_BY_ID: Record<
  EvidenceDefinition["id"],
  EvidenceDefinition
> = Object.fromEntries(
  EVIDENCE_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<EvidenceDefinition["id"], EvidenceDefinition>;
