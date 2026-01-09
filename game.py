import enum
from dataclasses import dataclass, field


class EvidenceType(enum.StrEnum):
    GHOST_ORBS = "ghost_orbs"
    SPIRIT_BOX = "spirit_box"
    DOTS = "dots"
    EMF_5 = "emf_5"
    FREEZING_TEMPERATURES = "freezing_temperatures"
    ULTRAVIOLET = "ultraviolet"
    GHOST_WRITING = "ghost_writing"


@dataclass
class GhostType:
    name: str
    evidence_required: list[EvidenceType]


@dataclass
class GameState:
    evidence_found: list[EvidenceType] = field(default_factory=list)
    possible_ghosts: list[GhostType] = field(default_factory=list)
    dark_mode: bool = False
    narration_level: int = 1
