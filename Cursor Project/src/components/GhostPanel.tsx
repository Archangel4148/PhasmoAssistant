import type { EvidenceEntry } from "../types/evidence";
import type { GhostDisplayItem } from "../types/ghost";
import { GhostCard } from "./GhostCard";

interface GhostPanelProps {
  ghosts: GhostDisplayItem[];
  evidenceEntries: EvidenceEntry[];
  onToggleGhostEliminated: (ghostId: string) => void;
}

export function GhostPanel({
  ghosts,
  evidenceEntries,
  onToggleGhostEliminated,
}: GhostPanelProps) {
  const possibleCount = ghosts.filter((ghost) => ghost.isPossible).length;

  return (
    <section className="panel flex h-full min-h-[320px] flex-col">
      <div className="mb-4">
        <h2 className="panel-title">Ghosts</h2>
        <p className="panel-subtitle">
          {possibleCount} of {ghosts.length} remain possible · Exclude toggles
          manual elimination
        </p>
      </div>

      {possibleCount === 0 ? (
        <div className="inset-block flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            No possible ghosts
          </p>
          <p
            className="mt-1 max-w-sm text-xs leading-relaxed"
            style={{ color: "var(--text-faint)" }}
          >
            Evidence conflicts or manual excludes removed every option. Clear
            evidence or include ghosts to continue filtering.
          </p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {ghosts.map((ghost) => (
            <GhostCard
              key={ghost.id}
              ghost={ghost}
              evidenceEntries={evidenceEntries}
              onToggleEliminated={onToggleGhostEliminated}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
