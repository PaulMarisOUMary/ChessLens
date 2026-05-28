import { useCallback } from "react";
import type { RefObject } from "react";
import type { UseChessGame } from "../../hooks/useChessGame";
import type { UseEditMode } from "../../hooks/useEditMode";
import { INITIAL_FEN, setFenTurn } from "../../utils/fen";

interface UseEditActionsArgs {
  chessRef: RefObject<UseChessGame>;
  editRef: RefObject<UseEditMode>;
  setEditDragSource: (sq: string | null) => void;
}

export interface UseEditActions {
  handleClearBoard: () => void;
  handleResetBoard: () => void;
  handleSetTurn: (turn: "w" | "b") => void;
}

export function useEditActions({
  chessRef,
  editRef,
  setEditDragSource,
}: UseEditActionsArgs): UseEditActions {
  const handleClearBoard = useCallback(() => {
    const newFen = editRef.current!.clearBoard(chessRef.current!.fen);
    chessRef.current!.loadFen(newFen);
    setEditDragSource(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setEditDragSource]);

  const handleResetBoard = useCallback(() => {
    chessRef.current!.loadFen(INITIAL_FEN);
    setEditDragSource(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setEditDragSource]);

  const handleSetTurn = useCallback((turn: "w" | "b") => {
    const newFen = setFenTurn(chessRef.current!.fen, turn);
    chessRef.current!.loadFen(newFen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handleClearBoard, handleResetBoard, handleSetTurn };
}
