import { motion } from "framer-motion";
import { useAppStore } from "../../state/appStore";

export function MainWindow() {
  const ready = useAppStore((state) => state.ready);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              Phasmophobia Companion
            </h1>
            <p className="text-sm text-zinc-400">
              Investigation control panel
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            {ready ? "Ready" : "Loading"}
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="max-w-lg rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center shadow-xl"
        >
          <h2 className="text-xl font-medium text-zinc-100">
            Main window scaffold
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Phase 1 is complete. The Tauri shell, React frontend, Tailwind,
            Framer Motion, and Zustand are wired up and ready for Phase 2 UI
            work.
          </p>
        </motion.section>
      </main>
    </div>
  );
}
