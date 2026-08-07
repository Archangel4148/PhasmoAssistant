import type { ReactNode } from "react";

type StatusTone = "neutral" | "success" | "warning" | "error" | "accent";

const TONE_STYLES: Record<StatusTone, string> = {
  neutral: "border-zinc-700/60 bg-zinc-800/60 text-zinc-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  accent: "border-violet-500/30 bg-violet-500/10 text-violet-300",
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
