import { AnimatePresence, motion } from "framer-motion";

interface OverlayTimingIndicatorProps {
  active: boolean;
}

export function OverlayTimingIndicator({ active }: OverlayTimingIndicatorProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-amber-400/40 bg-black/50 px-4 py-2 backdrop-blur-sm"
        >
          <motion.p
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200"
          >
            Timing Mode
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
