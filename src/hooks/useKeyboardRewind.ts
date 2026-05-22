import { useEffect } from "react";

interface UseKeyboardRewindArgs {
  activePly: number;
  historyLength: number;
  isEditMode: boolean;
  onGoToPly: (ply: number) => void;
}

export function useKeyboardRewind({
  activePly,
  historyLength,
  isEditMode,
  onGoToPly,
}: UseKeyboardRewindArgs): void {
  useEffect(() => {
    if (isEditMode) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (historyLength === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activePly > 0) onGoToPly(activePly - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activePly < historyLength) onGoToPly(activePly + 1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activePly, historyLength, isEditMode, onGoToPly]);
}
