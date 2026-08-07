export type EvidenceId =
  | "emf5"
  | "spiritBox"
  | "fingerprints"
  | "ghostWriting"
  | "ghostOrbs"
  | "freezing"
  | "dots";

export type EvidenceState = "unknown" | "confirmed" | "eliminated";

export interface EvidenceDefinition {
  id: EvidenceId;
  label: string;
  shortLabel: string;
}

export interface EvidenceEntry {
  id: EvidenceId;
  state: EvidenceState;
  voiceConfirmed: boolean;
}
