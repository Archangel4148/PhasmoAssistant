import type { Ghost } from "../types/ghost";

/**
 * Complete Phasmophobia ghost roster (30 types as of July 2026).
 * Evidence and behaviors cross-checked against current community cheat sheets
 * (GameRant / MathGyro / specialist guides). Filtering must use domain helpers —
 * never hardcode Mimic/forced-evidence exceptions in UI.
 */
export const GHOSTS: readonly Ghost[] = [
  {
    id: "spirit",
    name: "Spirit",
    evidence: ["emf5", "spiritBox", "ghostWriting"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 180,
    notes: [
      "Standard speed; incense prevents hunts for 180s (double the usual 90s).",
    ],
  },
  {
    id: "wraith",
    name: "Wraith",
    evidence: ["emf5", "spiritBox", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Never steps in salt and leaves no salt footprints; can teleport to players (EMF 2).",
    ],
  },
  {
    id: "phantom",
    name: "Phantom",
    evidence: ["spiritBox", "fingerprints", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Taking a photo/video makes it vanish briefly (including DOTS); less visible on hunts.",
    ],
  },
  {
    id: "poltergeist",
    name: "Poltergeist",
    evidence: ["spiritBox", "fingerprints", "ghostWriting"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Throws multiple objects at once; throws frequently during hunts (~0.5s).",
    ],
  },
  {
    id: "banshee",
    name: "Banshee",
    evidence: ["fingerprints", "ghostOrbs", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Targets one player until they die/leave; ~33% unique parabolic scream; female model/name.",
    ],
  },
  {
    id: "jinn",
    name: "Jinn",
    evidence: ["emf5", "fingerprints", "freezing"],
    speedProfile: { summary: "2.5 m/s when breaker on", referenceSpeedMps: 2.5 },
    smudgeDurationSeconds: 90,
    notes: [
      "Faster with LOS beyond ~3m when breaker is on; cannot turn the breaker off.",
    ],
  },
  {
    id: "mare",
    name: "Mare",
    evidence: ["spiritBox", "ghostOrbs", "ghostWriting"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Prefers dark rooms; hunts at ~60% if lights off / ~40% if on; turns lights off often.",
    ],
  },
  {
    id: "revenant",
    name: "Revenant",
    evidence: ["ghostOrbs", "ghostWriting", "freezing"],
    speedProfile: { summary: "1.0–3.0 m/s", referenceSpeedMps: 3.0 },
    smudgeDurationSeconds: 90,
    notes: [
      "Very slow (~1.0 m/s) until it detects a player, then accelerates to ~3.0 m/s.",
    ],
  },
  {
    id: "shade",
    name: "Shade",
    evidence: ["emf5", "ghostWriting", "freezing"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Shy; rarely interacts with players in its room; hunts only below ~35% average sanity.",
    ],
  },
  {
    id: "demon",
    name: "Demon",
    evidence: ["ghostWriting", "fingerprints", "freezing"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 60,
    notes: [
      "Can hunt at any sanity; incense only prevents hunts ~60s; crucifix range increased.",
    ],
  },
  {
    id: "yurei",
    name: "Yurei",
    evidence: ["ghostOrbs", "freezing", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Strong door interactions; incense can trap it in the ghost room for ~90s.",
    ],
  },
  {
    id: "oni",
    name: "Oni",
    evidence: ["emf5", "freezing", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "More visible during hunts; no mist/airball events; events drain more sanity.",
    ],
  },
  {
    id: "yokai",
    name: "Yokai",
    evidence: ["spiritBox", "ghostOrbs", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Talking near it can raise hunt threshold to ~80%; hears voices only at short range while hunting.",
    ],
  },
  {
    id: "hantu",
    name: "Hantu",
    evidence: ["ghostOrbs", "fingerprints", "freezing"],
    speedProfile: { summary: "1.4–2.7 m/s by temperature", referenceSpeedMps: 2.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Faster in cold rooms; visible breath on hunts if breaker is off; cannot turn breaker on.",
    ],
    specialRules: {
      // Freezing cannot be the hidden evidence on reduced-evidence difficulties.
      forcedEvidence: ["freezing"],
    },
  },
  {
    id: "goryo",
    name: "Goryo",
    evidence: ["emf5", "fingerprints", "dots"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "DOTS only via camera with no players in the room; cannot change ghost rooms.",
    ],
    specialRules: {
      forcedEvidence: ["dots"],
    },
  },
  {
    id: "myling",
    name: "Myling",
    evidence: ["emf5", "fingerprints", "ghostWriting"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "Quieter footsteps during hunts; frequent parabolic sounds when not hunting.",
    ],
  },
  {
    id: "onryo",
    name: "Onryo",
    evidence: ["spiritBox", "ghostOrbs", "freezing"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "May attempt a hunt after blowing out flames; firelights delay hunts when lit nearby.",
    ],
  },
  {
    id: "twins",
    name: "The Twins",
    evidence: ["spiritBox", "emf5", "freezing"],
    speedProfile: { summary: "1.5 / 1.9 m/s", referenceSpeedMps: 1.9 },
    smudgeDurationSeconds: 90,
    notes: [
      "Can interact in two places at once; hunt speed alternates between ~1.5 and ~1.9 m/s.",
    ],
  },
  {
    id: "raiju",
    name: "Raiju",
    evidence: ["emf5", "ghostOrbs", "dots"],
    speedProfile: { summary: "1.7–2.5 m/s near electronics", referenceSpeedMps: 2.5 },
    smudgeDurationSeconds: 90,
    notes: [
      "Faster near active electronics; electronics flicker from farther away (~15m).",
    ],
  },
  {
    id: "obake",
    name: "Obake",
    evidence: ["emf5", "ghostOrbs", "fingerprints"],
    speedProfile: { summary: "1.7 m/s", referenceSpeedMps: 1.7 },
    smudgeDurationSeconds: 90,
    notes: [
      "UV can be skipped (~25%); may leave six-fingered prints; can shapeshift briefly on hunts.",
    ],
    specialRules: {
      forcedEvidence: ["fingerprints"],
    },
  },
  {
    id: "mimic",
    name: "The Mimic",
    evidence: ["spiritBox", "fingerprints", "freezing"],
    speedProfile: { summary: "Varies (copies others)", referenceSpeedMps: null },
    smudgeDurationSeconds: 90,
    notes: [
      "Always shows fake Ghost Orbs (even on 0-evidence); behavior changes as it mimics others.",
    ],
    specialRules: {
      alwaysPresentsEvidence: ["ghostOrbs"],
    },
  },
  {
    id: "moroi",
    name: "Moroi",
    evidence: ["spiritBox", "ghostWriting", "freezing"],
    speedProfile: { summary: "1.5–2.25 m/s by sanity", referenceSpeedMps: 2.25 },
    smudgeDurationSeconds: 90,
    notes: [
      "Faster as average sanity drops; Spirit Box / parabolic can curse players (faster drain).",
    ],
    specialRules: {
      forcedEvidence: ["spiritBox"],
    },
  },
  {
    id: "deogen",
    name: "Deogen",
    evidence: ["spiritBox", "ghostWriting", "dots"],
    speedProfile: { summary: "0.4–3.0 m/s by distance", referenceSpeedMps: 3.0 },
    smudgeDurationSeconds: 90,
    notes: [
      "Always knows player location; sprints from afar then slows to ~0.4 m/s when close.",
    ],
    specialRules: {
      forcedEvidence: ["spiritBox"],
    },
  },
  {
    id: "thaye",
    name: "Thaye",
    evidence: ["ghostOrbs", "ghostWriting", "dots"],
    speedProfile: { summary: "2.75 → 1.0 m/s as it ages", referenceSpeedMps: 2.75 },
    smudgeDurationSeconds: 90,
    notes: [
      "Starts young/fast/aggressive then ages weaker/slower; Ouija age can climb over time.",
    ],
  },
  {
    id: "obambo",
    name: "Obambo",
    evidence: ["ghostWriting", "fingerprints", "dots"],
    speedProfile: { summary: "1.45 / 1.96 m/s by state", referenceSpeedMps: 1.96 },
    smudgeDurationSeconds: 90,
    notes: [
      "Cycles calm ↔ aggressive about every 2 minutes; aggressive hunts are earlier but shorter.",
    ],
  },
  {
    id: "gallu",
    name: "Gallu",
    evidence: ["emf5", "fingerprints", "spiritBox"],
    speedProfile: {
      summary: "1.36–1.96 m/s by rage state",
      referenceSpeedMps: 1.96,
    },
    smudgeDurationSeconds: 90,
    notes: [
      "Cycles Normal / Enraged / Weakened; protective gear can enrage it; may walk salt when enraged.",
    ],
  },
  {
    id: "dayan",
    name: "Dayan",
    evidence: ["emf5", "ghostOrbs", "spiritBox"],
    speedProfile: {
      summary: "1.2–2.25 m/s by player movement",
      referenceSpeedMps: 2.25,
    },
    smudgeDurationSeconds: 90,
    notes: [
      "Female model/name; speeds up when players move nearby and slows when they stand still.",
    ],
  },
  {
    id: "kormos",
    name: "Kormos",
    evidence: ["ghostOrbs", "spiritBox", "fingerprints"],
    speedProfile: { summary: "1.7–2.21 m/s when detecting", referenceSpeedMps: 2.21 },
    smudgeDurationSeconds: 90,
    notes: [
      "Completely blind; detects players from farther away; sprinting in its room can raise hunt chance.",
    ],
  },
  {
    id: "aswang",
    name: "Aswang",
    evidence: ["freezing", "ghostWriting", "dots"],
    speedProfile: { summary: "1.53 m/s", referenceSpeedMps: 1.53 },
    smudgeDurationSeconds: 90,
    notes: [
      "Slightly slower base speed; walking into an official hiding spot during a hunt ends the hunt.",
    ],
  },
  {
    id: "deildegast",
    name: "Deildegast",
    evidence: ["emf5", "ghostWriting", "dots"],
    speedProfile: {
      summary: "3.0 → 0.4 m/s after object throws",
      referenceSpeedMps: 3.0,
    },
    smudgeDurationSeconds: 90,
    notes: [
      "Base hunt speed ~3.0 m/s; throwing unique map objects before a hunt slows it (resets after hunt).",
    ],
  },
] as const;

export const GHOSTS_BY_ID: Record<Ghost["id"], Ghost> = Object.fromEntries(
  GHOSTS.map((ghost) => [ghost.id, ghost]),
) as Record<Ghost["id"], Ghost>;
