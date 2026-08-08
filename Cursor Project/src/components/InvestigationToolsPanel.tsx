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
  presets: readonly number[];
  onToggle: () => void;
  onReset: () => void;
  onDurationChange: (seconds: number) => void;
}

function TimerBlock({
  title,
  timer,
  presets,
  onToggle,
  onReset,
  onDurationChange,
}: TimerBlockProps) {
  const nowMs = useClock(isTimerActive(timer), 1000);
  const phase = getTimerPhase(timer, nowMs);
  const elapsedSeconds = getElapsedSeconds(timer, nowMs);
  const active = isTimerActive(timer);
  const isRunning = phase === "running";
  const isExpired = phase === "expired";

  return (
    <div
      className={`rounded-lg border p-3 ${
        isRunning
          ? "border-[var(--accent-border)] bg-[var(--accent-soft)]"
          : isExpired
            ? "border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)]"
            : "border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_40%,transparent)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-xs font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--text-muted)" }}
        >
          {title}
        </p>
        {isRunning && <StatusBadge tone="accent">Running</StatusBadge>}
        {isExpired && <StatusBadge tone="warning">Past End</StatusBadge>}
      </div>

      <p
        className="mt-2 font-mono text-2xl tabular-nums"
        style={{
          color: isRunning
            ? "var(--accent-strong)"
            : isExpired
              ? "var(--warning)"
              : "var(--text-faint)",
        }}
      >
        {active ? formatDuration(elapsedSeconds ?? 0) : "00:00"}
      </p>

      <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
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
              className={`focus-ring rounded-md border px-2 py-1 text-[11px] tabular-nums transition-colors ${
                selected
                  ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "btn-ghost"
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
          className={`focus-ring flex-1 px-2 py-1.5 text-xs ${
            active ? "btn-ghost" : "btn-accent"
          }`}
        >
          {active ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!active}
          className="btn-ghost focus-ring px-2 py-1.5 text-xs"
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
    <section className="panel">
      <div className="mb-4">
        <h2 className="panel-title">Investigation Tools</h2>
        <p className="panel-subtitle">
          Footstep timing, smudge, and hunt cooldown · Smudge preset auto-matches
          when remaining ghosts share one incense window
        </p>
      </div>

      <div className="space-y-3">
        <div
          className={`rounded-lg border p-3 ${
            timingMode
              ? "border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)]"
              : sessionComplete
                ? "border-[color-mix(in_srgb,var(--warning)_25%,transparent)] bg-[color-mix(in_srgb,var(--warning)_6%,transparent)]"
                : "border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_40%,transparent)]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-xs font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--text-muted)" }}
            >
              Footstep Speed
            </p>
            {timingMode ? (
              <motion.span
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <StatusBadge tone="warning">Timing Mode</StatusBadge>
              </motion.span>
            ) : sessionComplete ? (
              <StatusBadge tone="success">Complete</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Idle</StatusBadge>
            )}
          </div>

          <p
            className="mt-2 font-mono text-2xl tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {currentGhostSpeedMps !== null
              ? formatSpeedMps(currentGhostSpeedMps)
              : "—"}
          </p>

          {speedResult.beatsPerMinute !== null && (
            <p
              className="mt-0.5 font-mono text-sm tabular-nums"
              style={{ color: "var(--warning)" }}
            >
              {formatBpm(speedResult.beatsPerMinute)}
            </p>
          )}

          {showObserved && (
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
              Observed {formatSpeedMps(speedResult.observedMetersPerSecond!)} at{" "}
              {Math.round(settings.ghostSpeedMultiplier * 100)}% ghost speed
            </p>
          )}

          <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
            Steps {stepCount}/{MAX_FOOTSTEP_TIMESTAMPS}
            {timingMode
              ? " · Space / Numpad 0"
              : sessionComplete
                ? " · Result held until next timing"
                : " · Ctrl+Shift+T to arm"}
          </p>

          {speedMatches.length > 0 && (
            <p
              className="mt-2 text-[11px] leading-relaxed"
              style={{ color: "var(--warning)" }}
            >
              Close to{" "}
              {speedMatches.map((match) => match.ghostName).join(", ")}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={toggleTimingMode}
              className={`focus-ring flex-1 px-2 py-1.5 text-xs ${
                timingMode
                  ? "btn-ghost"
                  : "rounded-md border border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)] transition-colors hover:bg-[color-mix(in_srgb,var(--warning)_22%,transparent)]"
              }`}
            >
              {timingMode ? "Stop Timing" : "Start Timing"}
            </button>
            <button
              type="button"
              onClick={resetTiming}
              disabled={!canResetTiming}
              className="btn-ghost focus-ring px-2 py-1.5 text-xs"
            >
              Reset
            </button>
          </div>
        </div>

        <TimerBlock
          title="Smudge Timer"
          timer={smudgeTimer}
          presets={SMUDGE_DURATION_PRESETS}
          onToggle={startSmudgeTimer}
          onReset={resetSmudgeTimer}
          onDurationChange={setSmudgeDurationSeconds}
        />

        <TimerBlock
          title="Hunt Cooldown"
          timer={huntTimer}
          presets={HUNT_COOLDOWN_DURATION_PRESETS}
          onToggle={startHuntCooldownTimer}
          onReset={resetHuntCooldownTimer}
          onDurationChange={setHuntCooldownDurationSeconds}
        />
      </div>
    </section>
  );
}
