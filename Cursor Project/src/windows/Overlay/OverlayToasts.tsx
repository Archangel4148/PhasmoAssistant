import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { OverlayToast } from "../../types/sync";

interface OverlayToastsProps {
  toasts: OverlayToast[];
}

const TOAST_TTL_MS = 2500;

export function OverlayToasts({ toasts }: OverlayToastsProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [toasts.length]);

  const visible = toasts.filter((toast) => now - toast.createdAtMs < TOAST_TTL_MS);

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
