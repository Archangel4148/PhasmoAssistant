import type { ReactNode } from "react";

type StatusTone = "neutral" | "success" | "warning" | "error" | "accent";

const TONE_STYLES: Record<StatusTone, string> = {
  neutral:
    "border-[color-mix(in_srgb,var(--text-faint)_45%,transparent)] bg-[color-mix(in_srgb,var(--panel-bg-solid)_55%,transparent)] text-[var(--text-muted)]",
  success:
    "border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
  warning:
    "border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]",
  error:
    "border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]",
  accent: "accent-chip",
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_STYLES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
