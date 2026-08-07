from constants import GhostType, EvidenceType


def get_remaining_ghosts(all_possible_ghosts: list[GhostType], confirmed_evidence: list[EvidenceType]) -> list[
    GhostType]:
    # Filter out any ghosts that don't have all the confirmed evidence
    return [ghost for ghost in all_possible_ghosts if
            all(evidence in ghost.evidence_required for evidence in confirmed_evidence)]
