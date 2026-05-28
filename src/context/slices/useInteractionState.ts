import { useState, useCallback, useEffect } from "react";
import type { PendingPromotion } from "../BoardContext.types";

export interface UseInteractionState {
  isFlipped: boolean;
  selectedSquare: string | null;
  pendingPromotion: PendingPromotion | null;
  editDragSource: string | null;
  flipBoard: () => void;
  setSelectedSquare: (sq: string | null) => void;
  setPendingPromotion: (p: PendingPromotion | null) => void;
  setEditDragSource: (sq: string | null) => void;
}

export function useInteractionState(currentFen: string): UseInteractionState {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);
  const [editDragSource, setEditDragSource] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [currentFen]);

  const flipBoard = useCallback(() => setIsFlipped((f) => !f), []);

  return {
    isFlipped,
    selectedSquare,
    pendingPromotion,
    editDragSource,
    flipBoard,
    setSelectedSquare,
    setPendingPromotion,
    setEditDragSource,
  };
}