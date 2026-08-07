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
    <header className="border-b border-zinc-800/80 bg-zinc-900/70 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
            Phasmophobia Companion
          </h1>
          <p className="text-xs text-zinc-500 sm:text-sm">
            Investigation control panel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <StatusBadge tone="accent">
            {possibleGhostCount} possible
          </StatusBadge>

          <StatusBadge tone={VOICE_STATUS_TONE[voiceStatus]}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {VOICE_STATUS_LABEL[voiceStatus]}
          </StatusBadge>

          <StatusBadge tone="success">Investigation Active</StatusBadge>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenSettings}
            className="rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            Settings
          </motion.button>
        </div>
      </div>
    </header>
  );
}
