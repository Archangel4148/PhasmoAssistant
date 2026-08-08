import { motion } from "framer-motion";
import type { VoiceStatus } from "../types/voice";
import { StatusBadge } from "./StatusBadge";

interface HeaderProps {
  voiceStatus: VoiceStatus;
  possibleGhostCount: number;
  onOpenSettings: () => void;
}

const VOICE_STATUS_LABEL: Record<VoiceStatus, string> = {
  offline: "Voice Offline",
  starting: "Voice Starting",
  listening: "Voice Listening",
  error: "Voice Error",
};

const VOICE_STATUS_TONE = {
  offline: "neutral",
  starting: "warning",
  listening: "success",
  error: "error",
} as const;

export function Header({
  voiceStatus,
  possibleGhostCount,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header
      className="border-b px-4 py-3 backdrop-blur-md sm:px-6"
      style={{
        borderColor: "var(--panel-border)",
        background: "var(--app-bg-elevated)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1
            className="truncate text-base font-semibold tracking-tight sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            Phasmophobia Companion
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-faint)" }}>
            Investigation control panel
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 sm:gap-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <StatusBadge tone="accent">
            {possibleGhostCount} possible
          </StatusBadge>

          <StatusBadge tone={VOICE_STATUS_TONE[voiceStatus]}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {VOICE_STATUS_LABEL[voiceStatus]}
          </StatusBadge>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={onOpenSettings}
            className="btn-ghost focus-ring px-3 py-1.5 text-xs font-medium"
          >
            Settings
          </motion.button>
        </div>
      </div>
    </header>
  );
}
