import { motion } from "framer-motion";
import { formatDuration, formatSpeedMps } from "../lib/format";
import { StatusBadge } from "./StatusBadge";

interface InvestigationToolsPanelProps {
  timingMode: boolean;
  currentGhostSpeedMps: number | null;
  smudgeRemainingSeconds: number | null;
  huntRemainingSeconds: number | null;
}

interface TimerBlockProps {
  title: string;
  remainingSeconds: number | null;
  idleLabel: string;
}

function TimerBlock({ title, remainingSeconds, idleLabel }: TimerBlockProps) {
  const isRunning = remainingSeconds !== null && remainingSeconds > 0;

  return (
    <div
      className={`rounded-lg border p-3 ${
        isRunning
          ? "border-violet-500/30 bg-violet-500/5"
          : "border-zinc-800/80 bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {title}
        </p>
        {isRunning && <StatusBadge tone="accent">Running</StatusBadge>}
      </div>
      <p
        className={`mt-2 font-mono text-2xl tabular-nums ${
          isRunning ? "text-violet-200" : "text-zinc-600"
        }`}
      >
        {isRunning ? formatDuration(remainingSeconds) : idleLabel}
      </p>
    </div>
  );
}

export function InvestigationToolsPanel({
  timingMode,
  currentGhostSpeedMps,
  smudgeRemainingSeconds,
  huntRemainingSeconds,
}: InvestigationToolsPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Investigation Tools
        </h2>
        <p className="text-xs text-zinc-500">
          Footstep timing, smudge, and hunt cooldown
        </p>
      </div>

      <div className="space-y-3">
        <div
          className={`rounded-lg border p-3 ${
            timingMode
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-zinc-800/80 bg-zinc-900/40"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Footstep Speed
            </p>
            {timingMode ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <StatusBadge tone="warning">Timing Mode</StatusBadge>
              </motion.span>
            ) : (
              <StatusBadge tone="neutral">Idle</StatusBadge>
            )}
          </div>

          <p className="mt-2 font-mono text-2xl tabular-nums text-zinc-100">
            {currentGhostSpeedMps !== null
              ? formatSpeedMps(currentGhostSpeedMps)
              : "—"}
          </p>

          <p className="mt-1 text-[11px] text-zinc-500">
            Tap Space or Numpad 0 for each footstep (up to 5)
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled
              className="flex-1 rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-400"
            >
              Toggle Timing
            </button>
            <button
              type="button"
              disabled
              className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-400"
            >
              Reset
            </button>
          </div>
        </div>

        <TimerBlock
          title="Smudge Timer"
          remainingSeconds={smudgeRemainingSeconds}
          idleLabel="02:00"
        />

        <TimerBlock
          title="Hunt Cooldown"
          remainingSeconds={huntRemainingSeconds}
          idleLabel="—:—"
        />

        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="flex-1 rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-400"
          >
            Start Smudge
          </button>
          <button
            type="button"
            disabled
            className="flex-1 rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-400"
          >
            Start Hunt CD
          </button>
        </div>
      </div>
    </section>
  );
}
