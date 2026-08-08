import type { ReactNode } from "react";
import type { DiagnosticsSnapshot, SidecarStatus } from "../types/diagnostics";
import type { VoiceStatus } from "../types/voice";
import { StatusBadge } from "./StatusBadge";

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticsSnapshot;
  usingMock?: boolean;
  restartPending?: boolean;
  onRestartSidecar?: () => void;
}

const SIDECAR_LABEL: Record<SidecarStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
};

const SIDECAR_TONE = {
  connected: "success",
  disconnected: "neutral",
  error: "error",
} as const;

const VOICE_LABEL: Record<VoiceStatus, string> = {
  offline: "Offline",
  starting: "Starting",
  listening: "Listening",
  error: "Error",
};

function DiagnosticRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs" style={{ color: "var(--text-faint)" }}>
        {label}
      </span>
      <span
        className="text-right text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        {value}
      </span>
    </div>
  );
}

export function DiagnosticsPanel({
  diagnostics,
  usingMock = false,
  restartPending = false,
  onRestartSidecar,
}: DiagnosticsPanelProps) {
  const { sidecarStatus, microphoneLabel, microphoneAvailable, voiceStatus } =
    diagnostics;

  return (
    <section className="panel flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="panel-title">Diagnostics</h2>
          <p className="panel-subtitle">
            Voice pipeline and sidecar status
            {usingMock ? " · mock listener" : " · vosk"}
          </p>
        </div>
        {onRestartSidecar && (
          <button
            type="button"
            onClick={onRestartSidecar}
            disabled={restartPending}
            aria-busy={restartPending}
            className="btn-ghost focus-ring px-2.5 py-1 text-[11px] font-medium"
          >
            {restartPending ? "Restarting…" : "Restart Sidecar"}
          </button>
        )}
      </div>

      <div className="inset-block divide-y divide-[var(--panel-border)] px-3">
        <DiagnosticRow
          label="Sidecar"
          value={
            <StatusBadge tone={SIDECAR_TONE[sidecarStatus]}>
              {SIDECAR_LABEL[sidecarStatus]}
            </StatusBadge>
          }
        />
        <DiagnosticRow
          label="Microphone"
          value={
            microphoneAvailable ? (
              <span className="max-w-[140px] truncate">{microphoneLabel}</span>
            ) : usingMock ? (
              <StatusBadge tone="neutral">Mock / unused</StatusBadge>
            ) : (
              <StatusBadge tone="warning">Unavailable</StatusBadge>
            )
          }
        />
        <DiagnosticRow
          label="Voice Status"
          value={VOICE_LABEL[voiceStatus]}
        />
      </div>

      {diagnostics.lastError && (
        <div
          className="mt-3 rounded-lg border p-3"
          style={{
            borderColor: "color-mix(in srgb, var(--danger) 35%, transparent)",
            background: "color-mix(in srgb, var(--danger) 8%, transparent)",
          }}
          role="status"
        >
          <p
            className="text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ color: "var(--danger)" }}
          >
            Last Error
          </p>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: "color-mix(in srgb, var(--danger) 90%, white)" }}
          >
            {diagnostics.lastError}
          </p>
        </div>
      )}

      <div className="mt-4 min-h-0 flex-1">
        <p
          className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--text-faint)" }}
        >
          Recent Events
        </p>
        {diagnostics.recentVoiceEvents.length === 0 ? (
          <div className="inset-block px-3 py-4">
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              No sidecar events yet. Voice status changes and commands will
              appear here.
            </p>
          </div>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {diagnostics.recentVoiceEvents.map((event) => (
              <li key={event.id} className="inset-block px-2.5 py-2">
                <p
                  className="font-mono text-[10px]"
                  style={{ color: "var(--text-faint)" }}
                >
                  {event.timestamp}
                </p>
                <p
                  className="mt-0.5 text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {event.label}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
