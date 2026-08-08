import { motion } from "framer-motion";
import {
  HUNT_COOLDOWN_DURATION_PRESETS,
  SMUDGE_DURATION_PRESETS,
  getElapsedSeconds,
  getTimerPhase,
  isTimerActive,
} from "../domain/timers";
import {
  MAX_FOOTSTEP_TIMESTAMPS,
  calculateFootstepSpeed,
  compareSpeedToPossibleGhosts,
} from "../domain/speed";
import { useClock } from "../hooks/useClock";
import { formatBpm, formatDuration, formatSpeedMps } from "../lib/format";
import { useInvestigationStore } from "../state/investigationStore";
import type { InvestigationTimer } from "../types/timer";
import { StatusBadge } from "./StatusBadge";

interface TimerBlockProps {
  title: string;
  timer: InvestigationTimer;
  nowMs: number;
  presets: readonly number[];
  onToggle: () => void;
  onReset: () => void;
  onDurationChange: (seconds: number) => void;
}

function TimerBlock({
  title,
  timer,
  nowMs,
  presets,
  onToggle,
  onReset,
  onDurationChange,
}: TimerBlockProps) {
  const phase = getTimerPhase(timer, nowMs);
  const elapsedSeconds = getElapsedSeconds(timer, nowMs);
  const active = isTimerActive(timer);
  const isRunning = phase === "running";
  const isExpired = phase === "expired";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isRunning
          ? "border-violet-500/30 bg-violet-500/5"
          : isExpired
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-zinc-800/80 bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {title}
        </p>
        {isRunning && <StatusBadge tone="accent">Running</StatusBadge>}
        {isExpired && <StatusBadge tone="warning">Past End</StatusBadge>}
      </div>

      <p
        className={`mt-2 font-mono text-2xl tabular-nums ${
          isRunning
            ? "text-violet-200"
            : isExpired
              ? "text-amber-200"
              : "text-zinc-500"
        }`}
      >
        {active ? formatDuration(elapsedSeconds ?? 0) : "00:00"}
      </p>

      <p className="mt-1 text-[11px] text-zinc-500">
        End at {formatDuration(timer.durationSeconds)}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {presets.map((seconds) => {
          const selected = timer.durationSeconds === seconds;
          return (
            <button
              key={seconds}
              type="button"
              onClick={() => onDurationChange(seconds)}
              className={`rounded-md border px-2 py-1 text-[11px] tabular-nums transition-colors ${
                selected
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                  : "border-zinc-700/80 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {formatDuration(seconds)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
            active
              ? "border-zinc-600/80 bg-zinc-800/70 text-zinc-100 hover:border-zinc-500"
              : "border-violet-500/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
          }`}
        >
          {active ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!active}
          className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function InvestigationToolsPanel() {
  const timingMode = useInvestigationStore((state) => state.timingMode);
  const timingTimestampsMs = useInvestigationStore(
    (state) => state.timingTimestampsMs,
  );
  const currentGhostSpeedMps = useInvestigationStore(
    (state) => state.currentGhostSpeedMps,
  );
  const ghosts = useInvestigationStore((state) => state.ghosts);
  const smudgeTimer = useInvestigationStore((state) => state.smudgeTimer);
  const huntTimer = useInvestigationStore((state) => state.huntTimer);
  const toggleTimingMode = useInvestigationStore((state) => state.toggleTimingMode);
  const resetTiming = useInvestigationStore((state) => state.resetTiming);
  const startSmudgeTimer = useInvestigationStore((state) => state.startSmudgeTimer);
  const resetSmudgeTimer = useInvestigationStore((state) => state.resetSmudgeTimer);
  const setSmudgeDurationSeconds = useInvestigationStore(
    (state) => state.setSmudgeDurationSeconds,
  );
  const startHuntCooldownTimer = useInvestigationStore(
    (state) => state.startHuntCooldownTimer,
  );
  const resetHuntCooldownTimer = useInvestigationStore(
    (state) => state.resetHuntCooldownTimer,
  );
  const setHuntCooldownDurationSeconds = useInvestigationStore(
    (state) => state.setHuntCooldownDurationSeconds,
  );
  const settings = useInvestigationStore((state) => state.settings);

  const clockNeeded =
    isTimerActive(smudgeTimer) || isTimerActive(huntTimer);
  const nowMs = useClock(clockNeeded);

  const speedResult = calculateFootstepSpeed(timingTimestampsMs, {
    ghostSpeedMultiplier: settings.ghostSpeedMultiplier,
  });
  const speedMatches = compareSpeedToPossibleGhosts(
    currentGhostSpeedMps,
    ghosts,
  ).filter((match) => match.isClose);
  const stepCount = timingTimestampsMs.length;
  const sessionComplete =
    !timingMode && stepCount >= MAX_FOOTSTEP_TIMESTAMPS;
  const canResetTiming = stepCount > 0 || currentGhostSpeedMps !== null;
  const showObserved =
    settings.ghostSpeedMultiplier !== 1 &&
    speedResult.observedMetersPerSecond !== null;

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
              : sessionComplete
                ? "border-amber-500/25 bg-amber-500/5"
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
            ) : sessionComplete ? (
              <StatusBadge tone="success">Complete</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Idle</StatusBadge>
            )}
          </div>

          <p className="mt-2 font-mono text-2xl tabular-nums text-zinc-100">
            {currentGhostSpeedMps !== null
              ? formatSpeedMps(currentGhostSpeedMps)
              : "—"}
          </p>

          {speedResult.beatsPerMinute !== null && (
            <p className="mt-0.5 font-mono text-sm tabular-nums text-amber-200/90">
              {formatBpm(speedResult.beatsPerMinute)}
            </p>
          )}

          {showObserved && (
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Observed {formatSpeedMps(speedResult.observedMetersPerSecond!)} at{" "}
              {Math.round(settings.ghostSpeedMultiplier * 100)}% ghost speed
            </p>
          )}

          <p className="mt-1 text-[11px] text-zinc-500">
            Steps {stepCount}/{MAX_FOOTSTEP_TIMESTAMPS}
            {timingMode
              ? " · Space / Numpad 0"
              : sessionComplete
                ? " · Result held until next timing"
                : " · Ctrl+Shift+T to arm"}
          </p>

          {speedMatches.length > 0 && (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-200/90">
              Close to{" "}
              {speedMatches.map((match) => match.ghostName).join(", ")}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={toggleTimingMode}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                timingMode
                  ? "border-zinc-600/80 bg-zinc-800/70 text-zinc-100 hover:border-zinc-500"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
              }`}
            >
              {timingMode ? "Stop Timing" : "Start Timing"}
            </button>
            <button
              type="button"
              onClick={resetTiming}
              disabled={!canResetTiming}
              className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        </div>

        <TimerBlock
          title="Smudge Timer"
          timer={smudgeTimer}
          nowMs={nowMs}
          presets={SMUDGE_DURATION_PRESETS}
          onToggle={startSmudgeTimer}
          onReset={resetSmudgeTimer}
          onDurationChange={setSmudgeDurationSeconds}
        />

        <TimerBlock
          title="Hunt Cooldown"
          timer={huntTimer}
          nowMs={nowMs}
          presets={HUNT_COOLDOWN_DURATION_PRESETS}
          onToggle={startHuntCooldownTimer}
          onReset={resetHuntCooldownTimer}
          onDurationChange={setHuntCooldownDurationSeconds}
        />
      </div>
    </section>
  );
}
