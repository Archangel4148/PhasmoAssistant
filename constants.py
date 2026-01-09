import enum
from dataclasses import dataclass, field

RECOGNIZED_KEYWORDS = [
    # Evidence triggers
    "confirm ghost orbs",
    "confirm dots",
    "confirm level five",
    "confirm spirit box",
    "confirm freezing temperatures",
    "confirm ultraviolet",
    "confirm ghost writing",

    # Function triggers
    "trigger reset game state",
    "trigger dark mode",
    "trigger narration level one",
    "trigger narration level two",
    "trigger narration level three"
]


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

    def copy(self) -> "GameState":
        # Make a deep copy of the state
        return GameState(
            evidence_found=self.evidence_found.copy(),
            possible_ghosts=[
                GhostType(
                    name=g.name,
                    evidence_required=g.evidence_required.copy()
                )
                for g in self.possible_ghosts
            ],
            dark_mode=self.dark_mode,
            narration_level=self.narration_level,
        )


ALL_GHOSTS = [
    GhostType("Banshee", [EvidenceType.GHOST_ORBS, EvidenceType.ULTRAVIOLET, EvidenceType.DOTS]),
    GhostType("Dayan", [EvidenceType.EMF_5, EvidenceType.GHOST_ORBS, EvidenceType.SPIRIT_BOX]),
    GhostType("Deogen", [EvidenceType.SPIRIT_BOX, EvidenceType.GHOST_WRITING, EvidenceType.DOTS]),
    GhostType("Demon", [EvidenceType.FREEZING_TEMPERATURES, EvidenceType.ULTRAVIOLET, EvidenceType.GHOST_WRITING]),
    GhostType("Gallu", [EvidenceType.EMF_5, EvidenceType.SPIRIT_BOX, EvidenceType.ULTRAVIOLET]),
    GhostType("Goryo", [EvidenceType.EMF_5, EvidenceType.ULTRAVIOLET, EvidenceType.DOTS]),
    GhostType("Hantu", [EvidenceType.GHOST_ORBS, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.ULTRAVIOLET]),
    GhostType("Jinn", [EvidenceType.EMF_5, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.ULTRAVIOLET]),
    GhostType("Mare", [EvidenceType.GHOST_ORBS, EvidenceType.SPIRIT_BOX, EvidenceType.GHOST_WRITING]),
    GhostType("Moroi", [EvidenceType.SPIRIT_BOX, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.GHOST_WRITING]),
    GhostType("Myling", [EvidenceType.EMF_5, EvidenceType.ULTRAVIOLET, EvidenceType.GHOST_WRITING]),
    GhostType("Obake", [EvidenceType.EMF_5, EvidenceType.GHOST_ORBS, EvidenceType.ULTRAVIOLET]),
    GhostType("Obambo", [EvidenceType.ULTRAVIOLET, EvidenceType.GHOST_WRITING, EvidenceType.DOTS]),
    GhostType("Oni", [EvidenceType.EMF_5, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.DOTS]),
    GhostType("Onryo", [EvidenceType.GHOST_ORBS, EvidenceType.SPIRIT_BOX, EvidenceType.FREEZING_TEMPERATURES]),
    GhostType("Phantom", [EvidenceType.SPIRIT_BOX, EvidenceType.ULTRAVIOLET, EvidenceType.DOTS]),
    GhostType("Poltergeist", [EvidenceType.SPIRIT_BOX, EvidenceType.ULTRAVIOLET, EvidenceType.GHOST_WRITING]),
    GhostType("Raiju", [EvidenceType.EMF_5, EvidenceType.GHOST_ORBS, EvidenceType.DOTS]),
    GhostType("Revenant", [EvidenceType.GHOST_ORBS, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.GHOST_WRITING]),
    GhostType("Shade", [EvidenceType.EMF_5, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.GHOST_WRITING]),
    GhostType("Spirit", [EvidenceType.EMF_5, EvidenceType.SPIRIT_BOX, EvidenceType.GHOST_WRITING]),
    GhostType("Thaye", [EvidenceType.GHOST_ORBS, EvidenceType.GHOST_WRITING, EvidenceType.DOTS]),
    # TODO: Handle Mimic weirdness
    GhostType("The Mimic", [EvidenceType.SPIRIT_BOX, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.ULTRAVIOLET]),
    GhostType("The Twins", [EvidenceType.EMF_5, EvidenceType.SPIRIT_BOX, EvidenceType.FREEZING_TEMPERATURES]),
    GhostType("Wraith", [EvidenceType.EMF_5, EvidenceType.SPIRIT_BOX, EvidenceType.DOTS]),
    GhostType("Yokai", [EvidenceType.GHOST_ORBS, EvidenceType.SPIRIT_BOX, EvidenceType.DOTS]),
    GhostType("Yurei", [EvidenceType.GHOST_ORBS, EvidenceType.FREEZING_TEMPERATURES, EvidenceType.DOTS]),
]
