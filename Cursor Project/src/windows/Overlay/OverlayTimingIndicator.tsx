import { AnimatePresence, motion } from "framer-motion";
import {
  MAX_FOOTSTEP_TIMESTAMPS,
  type GhostSpeedMatch,
} from "../../domain/speed";
import { formatBpm, formatSpeedMps } from "../../lib/format";

interface OverlayTimingIndicatorProps {
  active: boolean;
  visible: boolean;
  speedMps: number | null;
  observedSpeedMps: number | null;
  beatsPerMinute: number | null;
  stepCount: number;
  ghostSpeedMultiplier: number;
  closeMatches: GhostSpeedMatch[];
}

export function OverlayTimingIndicator({
  active,
  visible,
  speedMps,
  observedSpeedMps,
  beatsPerMinute,
  stepCount,
  ghostSpeedMultiplier,
  closeMatches,
}: OverlayTimingIndicatorProps) {
  const showObserved =
    ghostSpeedMultiplier !== 1 &&
    observedSpeedMps !== null &&
    speedMps !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="min-w-[10.5rem] rounded-lg border border-amber-400/40 bg-black/50 px-3 py-2 backdrop-blur-sm"
        >
          {active ? (
            <motion.p
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200"
            >
              Timing
            </motion.p>
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Speed Result
            </p>
          )}

          <p className="mt-1 font-mono text-lg tabular-nums text-zinc-100">
            {speedMps !== null ? formatSpeedMps(speedMps) : "—"}
          </p>

          {beatsPerMinute !== null && (
            <p className="font-mono text-sm tabular-nums text-amber-100/90">
              {formatBpm(beatsPerMinute)}
            </p>
          )}

          <p className="mt-1 text-[11px] text-zinc-400">
            Steps {stepCount}/{MAX_FOOTSTEP_TIMESTAMPS}
            {ghostSpeedMultiplier !== 1
              ? ` · ${Math.round(ghostSpeedMultiplier * 100)}%`
              : ""}
          </p>

          {showObserved && (
            <p className="text-[11px] text-zinc-500">
              Observed {formatSpeedMps(observedSpeedMps)}
            </p>
          )}

          {closeMatches.length > 0 && (
            <p className="mt-1 max-w-[12rem] text-[11px] leading-snug text-amber-200/90">
              {closeMatches.map((match) => match.ghostName).join(", ")}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
