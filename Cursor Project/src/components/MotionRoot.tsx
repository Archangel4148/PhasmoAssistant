import { useEffect, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/**
 * Respects OS reduced-motion preference and pauses Framer Motion while the
 * document is hidden to avoid idle animation work in background windows.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== "undefined" && document.visibilityState === "hidden",
  );

  useEffect(() => {
    const sync = (): void => {
      setDocumentHidden(document.visibilityState === "hidden");
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <MotionConfig reducedMotion={documentHidden ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
