import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MainWindow } from "./windows/Main/MainWindow";
import { OverlayWindow } from "./windows/Overlay/OverlayWindow";
import { useMainInvestigationSync } from "./hooks/useInvestigationSync";

function MainApp() {
  useMainInvestigationSync();
  return <MainWindow />;
}

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

  if (isOverlay) {
    return <OverlayWindow />;
  }

  return <MainApp />;
}

export default App;
