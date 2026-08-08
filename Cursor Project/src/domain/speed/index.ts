export {
  MAX_FOOTSTEP_TIMESTAMPS,
  METERS_PER_STEP,
  appendFootstepTimestamp,
  calculateFootstepSpeed,
  calculateGhostSpeedMps,
  type FootstepSpeedResult,
} from "./calculateSpeed";
export {
  SPEED_MATCH_TOLERANCE_MPS,
  compareSpeedToPossibleGhosts,
  resolveSpeedMatchRange,
  type GhostSpeedMatch,
} from "./compareSpeed";
