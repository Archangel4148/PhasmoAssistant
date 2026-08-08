import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GhostDisplayItem } from "../../types/ghost";
import { softenHexColor } from "../../types/overlayAppearance";

interface OverlayGhostListProps {
  ghosts: GhostDisplayItem[];
  textColor: string;
  tickerSpeedPxPerSec: number;
}

const TICKER_GAP_PX = 32;

function GhostNameRow({
  ghosts,
  idPrefix,
  animated,
  textColor,
  separatorColor,
}: {
  ghosts: GhostDisplayItem[];
  idPrefix: string;
  animated: boolean;
  textColor: string;
  separatorColor: string;
}) {
  return (
    <div
      className="flex w-max shrink-0 items-center gap-3 text-sm font-medium"
      style={{ color: textColor }}
    >
      {animated ? (
        <AnimatePresence mode="popLayout" initial={false}>
          {ghosts.map((ghost, index) => (
            <motion.span
              key={`${idPrefix}-${ghost.id}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex shrink-0 items-center gap-3"
            >
              {index > 0 && (
                <span style={{ color: separatorColor }} aria-hidden>
                  ·
                </span>
              )}
              {ghost.name}
            </motion.span>
          ))}
        </AnimatePresence>
      ) : (
        ghosts.map((ghost, index) => (
          <span
            key={`${idPrefix}-${ghost.id}`}
            className="flex shrink-0 items-center gap-3"
          >
            {index > 0 && (
              <span style={{ color: separatorColor }} aria-hidden>
                ·
              </span>
            )}
            {ghost.name}
          </span>
        ))
      )}
    </div>
  );
}

export function OverlayGhostList({
  ghosts,
  textColor,
  tickerSpeedPxPerSec,
}: OverlayGhostListProps) {
  const possible = useMemo(
    () => ghosts.filter((ghost) => ghost.isPossible),
    [ghosts],
  );
  const possibleKey = possible.map((ghost) => ghost.id).join(",");
  const separatorColor = softenHexColor(textColor, 0.42);

  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) {
      return;
    }

    const update = () => {
      const nextWidth = measure.offsetWidth;
      setContentWidth(nextWidth);
      setOverflowing(nextWidth > viewport.clientWidth + 1);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(measure);

    return () => {
      observer.disconnect();
    };
  }, [possibleKey, textColor]);

  const duration =
    contentWidth > 0
      ? Math.max(contentWidth / Math.max(tickerSpeedPxPerSec, 1), 6)
      : 12;

  return (
    <div className="flex max-w-full items-center gap-3 rounded-lg border border-white/8 bg-black/35 px-3 py-1.5 backdrop-blur-sm">
      <p
        className="shrink-0 text-[10px] font-medium uppercase tracking-[0.08em]"
        style={{ color: softenHexColor(textColor, 0.28) }}
      >
        Possible
      </p>

      <div className="relative min-w-0 flex-1">
        <div
          ref={measureRef}
          className="pointer-events-none invisible absolute left-0 top-0"
          aria-hidden
        >
          <GhostNameRow
            ghosts={possible}
            idPrefix="measure"
            animated={false}
            textColor={textColor}
            separatorColor={separatorColor}
          />
        </div>

        <div ref={viewportRef} className="overflow-hidden">
          {possible.length === 0 ? (
            <p className="text-sm" style={{ color: separatorColor }}>
              No matches
            </p>
          ) : overflowing ? (
            <motion.div
              key={`${possibleKey}-${tickerSpeedPxPerSec}`}
              className="flex w-max items-center"
              animate={{ x: [0, -(contentWidth + TICKER_GAP_PX)] }}
              transition={{
                duration,
                ease: "linear",
                repeat: Infinity,
              }}
            >
              <GhostNameRow
                ghosts={possible}
                idPrefix="a"
                animated={false}
                textColor={textColor}
                separatorColor={separatorColor}
              />
              <span
                className="inline-block shrink-0"
                style={{ width: TICKER_GAP_PX }}
                aria-hidden
              />
              <GhostNameRow
                ghosts={possible}
                idPrefix="b"
                animated={false}
                textColor={textColor}
                separatorColor={separatorColor}
              />
            </motion.div>
          ) : (
            <GhostNameRow
              ghosts={possible}
              idPrefix="static"
              animated
              textColor={textColor}
              separatorColor={separatorColor}
            />
          )}
        </div>
      </div>

      <p
        className="shrink-0 font-mono text-[10px] tabular-nums"
        style={{ color: separatorColor }}
      >
        {possible.length}
      </p>
    </div>
  );
}
