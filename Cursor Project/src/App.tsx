import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MotionRoot } from "./components/MotionRoot";
import { MainWindow } from "./windows/Main/MainWindow";
import { OverlayWindow } from "./windows/Overlay/OverlayWindow";

function resolveWindowLabel(): string {
  try {
    return getCurrentWindow().label;
  } catch {
    return "main";
  }
}

function App() {
  const [label] = useState(resolveWindowLabel);
  const isOverlay = label === "overlay";

  useEffect(() => {
    document.documentElement.classList.toggle("overlay-window", isOverlay);
    document.body.classList.toggle("overlay-window", isOverlay);
  }, [isOverlay]);

  return (
    <MotionRoot>
      <ErrorBoundary
        fallbackTitle={
          isOverlay ? "Overlay failed to render" : "Main window failed to render"
        }
      >
        {isOverlay ? <OverlayWindow /> : <MainWindow />}
      </ErrorBoundary>
    </MotionRoot>
  );
}

export default App;
