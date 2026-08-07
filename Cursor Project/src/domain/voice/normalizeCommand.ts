import type { EvidenceId } from "../../types/evidence";

export type VoiceAction =
  | { type: "confirm_evidence"; evidenceId: EvidenceId }
  | { type: "start_smudge"; durationSeconds: number }
  | { type: "toggle_timing_mode" }
  | { type: "start_hunt_cooldown"; durationSeconds: number };

export const DEFAULT_SMUDGE_SECONDS = 180;
export const DEFAULT_HUNT_COOLDOWN_SECONDS = 25;

const EVIDENCE_PHRASES: ReadonlyArray<{ id: EvidenceId; phrases: string[] }> = [
  {
    id: "emf5",
    phrases: ["emf five", "emf 5", "emf level five", "emf level 5", "level five emf", "level 5 emf"],
  },
  {
    id: "spiritBox",
    phrases: ["spirit box", "spiritbox"],
  },
  {
    id: "fingerprints",
    phrases: ["fingerprints", "finger prints", "ultraviolet", "ultra violet", "uv"],
  },
  {
    id: "ghostWriting",
    phrases: ["ghost writing", "writing", "book writing"],
  },
  {
    id: "ghostOrbs",
    phrases: ["ghost orbs", "ghost orb", "orbs", "orb"],
  },
  {
    id: "freezing",
    phrases: ["freezing", "freezing temps", "freezing temperatures", "freezing temperature"],
  },
  {
    id: "dots",
    phrases: ["dots", "d.o.t.s", "d o t s", "dots projector"],
  },
];

const EVIDENCE_IDS = new Set<string>(EVIDENCE_PHRASES.map((entry) => entry.id));

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseMatches(haystack: string, phrase: string): boolean {
  if (haystack === phrase) {
    return true;
  }

  const pattern = new RegExp(
    `(^|\\s)${escapeRegExp(phrase)}(\\s|$)`,
    "i",
  );
  return pattern.test(haystack);
}

/** Strip a leading wake word if present (Python should already gate; this is defensive). */
export function stripWakeWord(text: string, wakeWord = "trigger"): string {
  const normalized = normalizeText(text);
  const wake = normalizeText(wakeWord);
  if (normalized === wake) {
    return "";
  }
  if (normalized.startsWith(`${wake} `)) {
    return normalized.slice(wake.length).trim();
  }
  return normalized;
}

export function normalizeEvidencePhrase(text: string): EvidenceId | null {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const ranked = EVIDENCE_PHRASES.flatMap((entry) =>
    entry.phrases.map((phrase) => ({ id: entry.id, phrase })),
  ).sort((a, b) => b.phrase.length - a.phrase.length);

  for (const entry of ranked) {
    if (phraseMatches(normalized, entry.phrase)) {
      return entry.id;
    }
  }

  return null;
}

/**
 * Resolve a sidecar voice_command into a domain action.
 * Supports semantic commands from the mock/Vosk listeners and utterance leftovers.
 */
export function resolveVoiceCommand(
  command: string,
  value?: string | null,
): VoiceAction | null {
  const normalizedCommand = normalizeText(command);

  if (normalizedCommand === "set_evidence" || normalizedCommand === "set evidence") {
    if (!value) {
      return null;
    }
    if (EVIDENCE_IDS.has(value)) {
      return { type: "confirm_evidence", evidenceId: value as EvidenceId };
    }
    const fromPhrase = normalizeEvidencePhrase(value);
    return fromPhrase
      ? { type: "confirm_evidence", evidenceId: fromPhrase }
      : null;
  }

  if (normalizedCommand === "smudge") {
    return { type: "start_smudge", durationSeconds: DEFAULT_SMUDGE_SECONDS };
  }

  if (normalizedCommand === "timer") {
    // "timer" arms footstep timing; hunt cooldown uses explicit phrasing via utterance.
    return { type: "toggle_timing_mode" };
  }

  if (normalizedCommand === "utterance" || normalizedCommand === "parse_utterance") {
    return resolveUtterance(value ?? "");
  }

  // Allow bare evidence id as command for flexibility.
  if (EVIDENCE_IDS.has(normalizedCommand)) {
    return {
      type: "confirm_evidence",
      evidenceId: normalizedCommand as EvidenceId,
    };
  }

  return resolveUtterance(normalizedCommand);
}

export function resolveUtterance(text: string): VoiceAction | null {
  const remainder = stripWakeWord(text);
  if (!remainder) {
    return null;
  }

  if (
    remainder === "smudge" ||
    remainder === "smudge stick" ||
    remainder === "use smudge"
  ) {
    return { type: "start_smudge", durationSeconds: DEFAULT_SMUDGE_SECONDS };
  }

  if (
    remainder === "timer" ||
    remainder === "timing" ||
    remainder === "timing mode" ||
    remainder === "start timing"
  ) {
    return { type: "toggle_timing_mode" };
  }

  if (
    remainder === "hunt" ||
    remainder === "hunt timer" ||
    remainder === "hunt cooldown" ||
    remainder === "cooldown"
  ) {
    return {
      type: "start_hunt_cooldown",
      durationSeconds: DEFAULT_HUNT_COOLDOWN_SECONDS,
    };
  }

  const evidenceId = normalizeEvidencePhrase(remainder);
  if (evidenceId) {
    return { type: "confirm_evidence", evidenceId };
  }

  return null;
}
