import type { GhostDisplayItem } from "../types/ghost";
import { GhostCard } from "./GhostCard";

interface GhostPanelProps {
  ghosts: GhostDisplayItem[];
}

export function GhostPanel({ ghosts }: GhostPanelProps) {
  const possibleCount = ghosts.filter((ghost) => ghost.isPossible).length;

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Ghosts
          </h2>
          <p className="text-xs text-zinc-500">
            {possibleCount} of {ghosts.length} remain possible
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {ghosts.map((ghost) => (
            <GhostCard key={ghost.id} ghost={ghost} />
          ))}
        </div>
      </div>
    </section>
  );
}
