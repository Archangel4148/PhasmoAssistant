import { motion } from "framer-motion";
import {
  getElapsedSeconds,
  getTimerPhase,
  isTimerActive,
} from "../../domain/timers";
import { useClock } from "../../hooks/useClock";
import { formatDuration } from "../../lib/format";
import type { InvestigationTimer } from "../../types/timer";

interface OverlayTimersProps {
  smudgeTimer: InvestigationTimer;
  huntTimer: InvestigationTimer;
}

function TimerLine({
  label,
  timer,
  nowMs,
}: {
  label: string;
  timer: InvestigationTimer;
  nowMs: number;
}) {
  const phase = getTimerPhase(timer, nowMs);
  const elapsedSeconds = getElapsedSeconds(timer, nowMs);
  const active = isTimerActive(timer);
  const expired = phase === "expired";

  return (
    <div
      className={`flex items-baseline justify-end gap-2 font-mono text-sm tabular-nums ${
        phase === "running"
          ? "text-zinc-100"
          : expired
            ? "text-amber-200"
            : "text-zinc-400"
      }`}
    >
      <span className="text-[11px] uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span className="min-w-[3.25rem] text-right">
        {active ? formatDuration(elapsedSeconds ?? 0) : "—:—"}
      </span>
    </div>
  );
}

export function OverlayTimers({ smudgeTimer, huntTimer }: OverlayTimersProps) {
  const clockNeeded =
    isTimerActive(smudgeTimer) || isTimerActive(huntTimer);
  const nowMs = useClock(clockNeeded);
  const anyActive =
    isTimerActive(smudgeTimer) || isTimerActive(huntTimer);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: anyActive ? 0.9 : 0.4 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm"
    >
      <TimerLine label="Smudge" timer={smudgeTimer} nowMs={nowMs} />
      <TimerLine label="Hunt" timer={huntTimer} nowMs={nowMs} />
    </motion.div>
  );
}
