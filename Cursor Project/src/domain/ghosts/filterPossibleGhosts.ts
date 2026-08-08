import type { EvidenceMap } from "../evidence/evidenceState";
import { getConfirmedEvidenceIds } from "../evidence/evidenceRules";
import type { Ghost } from "../../types/ghost";
import type { EvidenceId } from "../../types/evidence";
import {
  evidenceAvailableForDifficulty,
  type EvidenceDifficultyId,
} from "../../types/investigationSettings";
import { ghostHasEvidence } from "./evidenceSet";

export interface GhostFilterOptions {
  /** Journal evidence count mode. Defaults to standard (3). */
  evidenceDifficulty?: EvidenceDifficultyId;
}

function forcedEvidenceIds(ghost: Ghost): EvidenceId[] {
  return ghost.specialRules?.forcedEvidence ?? [];
}

function alwaysPresentsIds(ghost: Ghost): EvidenceId[] {
  return ghost.specialRules?.alwaysPresentsEvidence ?? [];
}

/**
 * Apply Amateur–Apocalypse evidence rules.
 *
 * - Standard (3): confirmed must fit; eliminated removes owners.
 * - Nightmare (2): once ≥2 confirmed, forced evidence must be among them.
 * - Insanity (1): forced-evidence ghosts can only show their forced piece
 *   (always-presented extras like Mimic Orbs are allowed alongside).
 * - Apocalypse (0): evidence ignored; only manual elimination applies.
 *
 * Mimic fake Orbs stay in effective evidence via alwaysPresentsEvidence.
 */
export function isGhostPossible(
  ghost: Ghost,
  evidence: EvidenceMap,
  eliminatedGhostIds: readonly string[] = [],
  options: GhostFilterOptions = {},
): boolean {
  if (eliminatedGhostIds.includes(ghost.id)) {
    return false;
  }

  const evidenceAvailable = evidenceAvailableForDifficulty(
    options.evidenceDifficulty ?? "standard",
  );

  // Apocalypse: no journal evidence is given — skip evidence filtering.
  if (evidenceAvailable === 0) {
    return true;
  }

  for (const [id, entry] of Object.entries(evidence) as [
    EvidenceId,
    EvidenceMap[EvidenceId],
  ][]) {
    if (entry.state === "eliminated" && ghostHasEvidence(ghost, id)) {
      return false;
    }

    if (entry.state === "confirmed" && !ghostHasEvidence(ghost, id)) {
      return false;
    }
  }

  const forced = forcedEvidenceIds(ghost);
  if (forced.length === 0) {
    return true;
  }

  const confirmed = getConfirmedEvidenceIds(evidence);
  const forcedSet = new Set(forced);
  const alwaysSet = new Set(alwaysPresentsIds(ghost));

  if (evidenceAvailable === 1) {
    // Insanity: the single journal evidence must be forced when the ghost has one.
    // Always-presented extras (Mimic Orbs) do not violate this rule.
    for (const id of confirmed) {
      if (alwaysSet.has(id)) {
        continue;
      }
      if (!forcedSet.has(id)) {
        return false;
      }
    }
    return true;
  }

  if (evidenceAvailable === 2 && confirmed.length >= evidenceAvailable) {
    // Nightmare: both shown slots are filled; forced evidence cannot be the hidden one.
    const hasForcedConfirmed = forced.some((id) => confirmed.includes(id));
    if (!hasForcedConfirmed) {
      return false;
    }
  }

  return true;
}

export function filterPossibleGhostIds(
  ghosts: readonly Ghost[],
  evidence: EvidenceMap,
  eliminatedGhostIds: readonly string[] = [],
  options: GhostFilterOptions = {},
): Set<string> {
  const possibleIds = new Set<string>();

  for (const ghost of ghosts) {
    if (isGhostPossible(ghost, evidence, eliminatedGhostIds, options)) {
      possibleIds.add(ghost.id);
    }
  }

  return possibleIds;
}
