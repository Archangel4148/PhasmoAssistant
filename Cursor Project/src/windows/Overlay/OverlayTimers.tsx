import { motion } from "framer-motion";
import { formatDuration } from "../../lib/format";

interface OverlayTimersProps {
  smudgeRemainingSeconds: number | null;
  huntRemainingSeconds: number | null;
}

function TimerLine({
  label,
  remainingSeconds,
}: {
  label: string;
  remainingSeconds: number | null;
}) {
  const active = remainingSeconds !== null && remainingSeconds > 0;

  return (
    <div
      className={`flex items-baseline justify-end gap-2 font-mono text-sm tabular-nums ${
        active ? "text-zinc-100" : "text-zinc-400"
      }`}
    >
      <span className="text-[11px] uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span className="min-w-[3.25rem] text-right">
        {active ? formatDuration(remainingSeconds) : "—:—"}
      </span>
    </div>
  );
}

export function OverlayTimers({
  smudgeRemainingSeconds,
  huntRemainingSeconds,
}: OverlayTimersProps) {
  const anyActive =
    (smudgeRemainingSeconds !== null && smudgeRemainingSeconds > 0) ||
    (huntRemainingSeconds !== null && huntRemainingSeconds > 0);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: anyActive ? 0.9 : 0.4 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm"
    >
      <TimerLine label="Smudge" remainingSeconds={smudgeRemainingSeconds} />
      <TimerLine label="Hunt" remainingSeconds={huntRemainingSeconds} />
    </motion.div>
  );
}
