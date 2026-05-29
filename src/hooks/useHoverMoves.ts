import { useState, useCallback } from "react";
import type { ChessPieceKey } from "../types";

export interface UseHoverMoves {
  hoverDestinations: string[];
  onMouseOverSquare: (args: { square: string; piece?: ChessPieceKey }) => void;
  onMouseOutSquare: () => void;
}

interface UseHoverMovesArgs {
  getLegalMoves: (square: string) => string[];
  selectedSquare: string | null;
  isGameOver: boolean;
  isRewinding: boolean;
  isEditMode: boolean;
}

export function useHoverMoves({
  getLegalMoves,
  selectedSquare,
  isGameOver,
  isRewinding,
  isEditMode,
}: UseHoverMovesArgs): UseHoverMoves {
  const [hoverDestinations, setHoverDestinations] = useState<string[]>([]);

  const onMouseOverSquare = useCallback(
    ({ square, piece }: { square: string; piece?: ChessPieceKey }) => {
      if (isGameOver || isRewinding || isEditMode || selectedSquare) {
        setHoverDestinations([]);
        return;
      }
      if (!piece) {
        setHoverDestinations([]);
        return;
      }
      setHoverDestinations(getLegalMoves(square));
    },
    [getLegalMoves, selectedSquare, isGameOver, isRewinding, isEditMode],
  );

  const onMouseOutSquare = useCallback(() => {
    setHoverDestinations([]);
  }, []);

  return { hoverDestinations, onMouseOverSquare, onMouseOutSquare };
}