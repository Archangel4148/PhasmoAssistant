import { AnimatePresence, motion } from "framer-motion";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const PLACEHOLDER_SECTIONS = [
  {
    title: "Appearance",
    description: "Theme and visual preferences",
  },
  {
    title: "Overlay",
    description: "Position, scale, and visibility",
  },
  {
    title: "Voice",
    description: "Microphone selection and sidecar controls",
  },
  {
    title: "Hotkeys",
    description: "Global shortcut configuration",
  },
  {
    title: "Windows",
    description: "Main and overlay geometry persistence",
  },
] as const;

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          />

          <motion.dialog
            open
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-50 m-0 flex max-h-[min(80vh,640px)] w-[min(calc(100vw-2rem),480px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  Settings
                </h2>
                <p className="text-xs text-zinc-500">
                  Configuration will be wired in later phases
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-700/80 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <ul className="space-y-2">
                {PLACEHOLDER_SECTIONS.map((section) => (
                  <li
                    key={section.title}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-3"
                  >
                    <p className="text-sm font-medium text-zinc-200">
                      {section.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {section.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.dialog>
        </>
      )}
    </AnimatePresence>
  );
}
