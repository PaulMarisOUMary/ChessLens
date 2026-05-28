import { useEffect } from "react";
import type { UseChessGame } from "../../hooks/useChessGame";
import type { UseHeatmap } from "../../hooks/useHeatmap";

interface UseHeatmapSyncArgs {
  chess: UseChessGame;
  heatmap: UseHeatmap;
  heatmapEnabled: boolean;
  depth: number;
  isEditMode: boolean;
}

export function useHeatmapSync({
  chess,
  heatmap,
  heatmapEnabled,
  depth,
  isEditMode,
}: UseHeatmapSyncArgs): void {
  useEffect(() => {
    const { isReady, analyse, clear } = heatmap;
    const { fen, isGameOver, isRewinding } = chess;

    if (!isReady || isGameOver) return;
    if (!heatmapEnabled || isRewinding || isEditMode) {
      clear();
      return;
    }
    analyse(fen, depth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chess.fen,
    chess.isGameOver,
    chess.isRewinding,
    heatmap.isReady,
    heatmapEnabled,
    depth,
    isEditMode,
  ]);
}