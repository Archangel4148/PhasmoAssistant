import type { EvidenceId } from "../../types/evidence";

export type VoiceAction =
  | { type: "confirm_evidence"; evidenceId: EvidenceId }
  | { type: "eliminate_evidence"; evidenceId: EvidenceId }
  | { type: "start_smudge" }
  | { type: "toggle_timing_mode" }
  | { type: "start_hunt_cooldown" }
  | { type: "reset_hunt_cooldown" }
  | { type: "reset_investigation" };

/** Re-exported so callers keep a single import path for voice defaults. */
export {
  DEFAULT_HUNT_COOLDOWN_SECONDS,
  DEFAULT_SMUDGE_SECONDS,
} from "../timers";

const EVIDENCE_PHRASES: ReadonlyArray<{ id: EvidenceId; phrases: string[] }> = [
  {
    id: "emf5",
    phrases: ["emf five", "emf 5", "emf level five", "emf level 5", "emf", "level 5"],
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

const ELIMINATE_PREFIXES = [
  "eliminate",
  "not",
  "no",
  "clear",
  "rule out",
  "ruled out",
] as const;

/** Catalog for UI — single source with the normalizer phrases below. */
export const VOICE_COMMAND_CATALOG = [
  {
    id: "wake",
    title: "Wake word",
    description: "Required before every command",
    phrases: ["trigger …"],
    examples: [] as string[],
  },
  {
    id: "evidence",
    title: "Evidence",
    description:
      "Say an evidence phrase to confirm it. Prefix the same phrase with a negation word to eliminate instead.",
    phrases: EVIDENCE_PHRASES.flatMap((entry) => entry.phrases),
    examples: [
      "trigger emf five → confirm",
      "trigger not emf five → eliminate",
      "trigger eliminate spirit box → eliminate",
      "trigger no ultraviolet → eliminate",
      "trigger clear orbs → eliminate",
      "trigger rule out freezing → eliminate",
    ],
  },
  {
    id: "evidence_negation",
    title: "Evidence negation words",
    description: "Place one of these before any evidence phrase to eliminate",
    phrases: [...ELIMINATE_PREFIXES],
    examples: [] as string[],
  },
  {
    id: "reset_investigation",
    title: "Reset investigation",
    description: "Clear all evidence, timers, timing, and manual ghost eliminations",
    phrases: [
      "clear evidence",
      "reset evidence",
      "clear investigation",
      "reset investigation",
    ],
    examples: [
      "trigger clear evidence → reset",
      "trigger reset evidence → reset",
    ],
  },
  {
    id: "smudge",
    title: "Smudge timer",
    description: "Start or stop the smudge stopwatch",
    phrases: ["smudge", "smudge stick", "use smudge"],
    examples: [] as string[],
  },
  {
    id: "timing",
    title: "Footstep timing",
    description: "Arm or stop timing mode",
    phrases: ["timer", "timing", "timing mode", "start timing"],
    examples: [] as string[],
  },
  {
    id: "hunt",
    title: "Hunt cooldown",
    description: "Start or stop the hunt cooldown",
    phrases: ["hunt", "hunt timer", "hunt cooldown", "cooldown"],
    examples: [] as string[],
  },
  {
    id: "reset_hunt",
    title: "Reset hunt cooldown",
    description: "Clear hunt timer back to idle without toggling",
    phrases: [
      "reset hunt",
      "reset hunt timer",
      "reset hunt cooldown",
      "clear hunt",
      "clear hunt timer",
      "clear hunt cooldown",
    ],
    examples: [] as string[],
  },
] as const;

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

function stripEliminatePrefix(text: string): string | null {
  const normalized = normalizeText(text);
  const ranked = [...ELIMINATE_PREFIXES].sort((a, b) => b.length - a.length);
  for (const prefix of ranked) {
    if (normalized === prefix) {
      return "";
    }
    if (normalized.startsWith(`${prefix} `)) {
      return normalized.slice(prefix.length).trim();
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

  if (
    normalizedCommand === "eliminate_evidence" ||
    normalizedCommand === "eliminate evidence"
  ) {
    if (!value) {
      return null;
    }
    if (EVIDENCE_IDS.has(value)) {
      return { type: "eliminate_evidence", evidenceId: value as EvidenceId };
    }
    const fromPhrase = normalizeEvidencePhrase(value);
    return fromPhrase
      ? { type: "eliminate_evidence", evidenceId: fromPhrase }
      : null;
  }

  if (normalizedCommand === "smudge") {
    return { type: "start_smudge" };
  }

  if (normalizedCommand === "timer") {
    return { type: "toggle_timing_mode" };
  }

  if (
    normalizedCommand === "reset_hunt" ||
    normalizedCommand === "reset hunt"
  ) {
    return { type: "reset_hunt_cooldown" };
  }

  if (
    normalizedCommand === "reset_investigation" ||
    normalizedCommand === "reset investigation" ||
    normalizedCommand === "reset_evidence" ||
    normalizedCommand === "reset evidence" ||
    normalizedCommand === "clear_evidence" ||
    normalizedCommand === "clear evidence"
  ) {
    return { type: "reset_investigation" };
  }

  if (normalizedCommand === "utterance" || normalizedCommand === "parse_utterance") {
    return resolveUtterance(value ?? "");
  }

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
    return { type: "start_smudge" };
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
    remainder === "clear evidence" ||
    remainder === "reset evidence" ||
    remainder === "clear investigation" ||
    remainder === "reset investigation"
  ) {
    return { type: "reset_investigation" };
  }

  if (
    remainder === "reset hunt" ||
    remainder === "reset hunt timer" ||
    remainder === "reset hunt cooldown" ||
    remainder === "clear hunt" ||
    remainder === "clear hunt timer" ||
    remainder === "clear hunt cooldown"
  ) {
    return { type: "reset_hunt_cooldown" };
  }

  if (
    remainder === "hunt" ||
    remainder === "hunt timer" ||
    remainder === "hunt cooldown" ||
    remainder === "cooldown"
  ) {
    return { type: "start_hunt_cooldown" };
  }

  const eliminateRemainder = stripEliminatePrefix(remainder);
  if (eliminateRemainder !== null) {
    const evidenceId = normalizeEvidencePhrase(eliminateRemainder);
    if (evidenceId) {
      return { type: "eliminate_evidence", evidenceId };
    }
    return null;
  }

  const evidenceId = normalizeEvidencePhrase(remainder);
  if (evidenceId) {
    return { type: "confirm_evidence", evidenceId };
  }

  return null;
}
