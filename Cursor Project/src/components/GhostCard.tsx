import { motion } from "framer-motion";
import { EVIDENCE_BY_ID } from "../data/evidence";
import type { GhostDisplayItem } from "../types/ghost";

interface GhostCardProps {
  ghost: GhostDisplayItem;
}

export function GhostCard({ ghost }: GhostCardProps) {
  return (
    <motion.article
      layout
      initial={false}
      animate={{ opacity: ghost.isPossible ? 1 : 0.2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-lg border p-3 ${
        ghost.isPossible
          ? "border-zinc-700/80 bg-zinc-800/60"
          : "border-zinc-800/60 bg-zinc-900/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`text-sm font-medium ${
            ghost.isPossible ? "text-zinc-100" : "text-zinc-500"
          }`}
        >
          {ghost.name}
        </h3>
        {ghost.isPossible && (
          <span className="shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300">
            Possible
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {ghost.evidence.map((evidenceId) => (
          <span
            key={evidenceId}
            className="rounded border border-zinc-700/60 bg-zinc-900/60 px-1.5 py-0.5 text-[10px] text-zinc-400"
          >
            {EVIDENCE_BY_ID[evidenceId].shortLabel}
          </span>
        ))}
      </div>

      <p className="mt-2 text-[11px] text-zinc-500">
        Speed: {ghost.speedProfile.summary}
      </p>

      {ghost.notes.length > 0 && (
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-600">
          {ghost.notes[0]}
        </p>
      )}
    </motion.article>
  );
}
