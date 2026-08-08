import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInvestigationStore } from "../../state/investigationStore";
import type { OverlayToast } from "../../types/sync";

interface OverlayToastsProps {
  toasts: OverlayToast[];
}

const TOAST_TTL_MS = 2500;

export function OverlayToasts({ toasts }: OverlayToastsProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const pruneExpiredToasts = useInvestigationStore(
    (state) => state.pruneExpiredToasts,
  );

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const nextExpiry = Math.min(
      ...toasts.map((toast) => toast.createdAtMs + TOAST_TTL_MS),
    );
    const delay = Math.max(16, nextExpiry - Date.now());
    const id = window.setTimeout(() => {
      setNowMs(Date.now());
      pruneExpiredToasts(TOAST_TTL_MS);
    }, delay);

    return () => {
      window.clearTimeout(id);
    };
  }, [toasts, pruneExpiredToasts]);

  const visible = toasts.filter(
    (toast) => nowMs - toast.createdAtMs < TOAST_TTL_MS,
  );

  return (
    <div className="flex w-64 flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {visible.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 0.95, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-md border border-emerald-400/25 bg-black/55 px-3 py-2 text-right text-sm text-emerald-100 backdrop-blur-sm"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
