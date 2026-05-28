import { useCallback } from "react";
import type { RefObject } from "react";
import type { UseChessGame } from "../../hooks/useChessGame";
import type { UseHeatmap } from "../../hooks/useHeatmap";
import type { UseEditMode } from "../../hooks/useEditMode";
import type { EditablePiece, PromotionPiece, ChessPieceKey } from "../../types";
import type { PendingPromotion } from "../BoardContext.types";
import { isPromotionMove } from "../../utils/fen";

interface UseMoveHandlerArgs {
  chessRef: RefObject<UseChessGame>;
  heatmapRef: RefObject<UseHeatmap>;
  editRef: RefObject<UseEditMode>;
  selectedSquare: string | null;
  pendingPromotion: PendingPromotion | null;
  editDragSource: string | null;
  setSelectedSquare: (sq: string | null) => void;
  setPendingPromotion: (p: PendingPromotion | null) => void;
  setEditDragSource: (sq: string | null) => void;
}

export interface UseMoveHandler {
  onDrop: (args: {
    piece: { isSparePiece?: boolean };
    sourceSquare: string;
    targetSquare: string | null;
  }) => boolean;
  onSquareClick: (args: { square: string; piece?: ChessPieceKey }) => void;
  onPromotionSelect: (piece: PromotionPiece | null) => void;
}

export function useMoveHandler({
  chessRef,
  heatmapRef,
  editRef,
  selectedSquare,
  pendingPromotion,
  editDragSource,
  setSelectedSquare,
  setPendingPromotion,
  setEditDragSource,
}: UseMoveHandlerArgs): UseMoveHandler {
  const attemptMove = useCallback(
    (from: string, to: string): boolean => {
      const { isGameOver, isRewinding, makeMove, fen } = chessRef.current!;
      if (isGameOver || isRewinding) return false;
      if (isPromotionMove(fen, from, to)) {
        setPendingPromotion({ from, to });
        return true;
      }
      const ok = makeMove(from, to);
      if (ok) {
        heatmapRef.current!.clear();
        setSelectedSquare(null);
      }
      return ok;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setPendingPromotion, setSelectedSquare],
  );

  const onDrop = useCallback(
    (args: {
      piece: { isSparePiece?: boolean };
      sourceSquare: string;
      targetSquare: string | null;
    }): boolean => {
      const { piece, sourceSquare, targetSquare } = args;
      if (!targetSquare) return false;

      if (editRef.current!.isEditMode) {
        const currentFen = chessRef.current!.fen;

        if (piece.isSparePiece) {
          const color = sourceSquare[0] as "w" | "b";
          const type = sourceSquare[1].toLowerCase() as EditablePiece["type"];
          const newFen = editRef.current!.applyPaletteDrop(
            { color, type },
            targetSquare,
            currentFen,
          );
          chessRef.current!.loadFen(newFen);
          return true;
        }

        const newFen = editRef.current!.applyPieceMove(
          sourceSquare,
          targetSquare,
          currentFen,
        );
        if (newFen) {
          chessRef.current!.loadFen(newFen);
          return true;
        }
        return false;
      }

      return attemptMove(sourceSquare, targetSquare);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attemptMove],
  );

  const onSquareClick = useCallback(
    ({ square, piece }: { square: string; piece?: ChessPieceKey }) => {
      if (editRef.current!.isEditMode) {
        const {
          isErasing,
          selectedPalettePiece,
          applySquareAction,
          applyPieceMove,
        } = editRef.current!;
        const currentFen = chessRef.current!.fen;

        if (isErasing) {
          const newFen = applySquareAction(square, currentFen);
          if (newFen) chessRef.current!.loadFen(newFen);
          return;
        }

        if (editDragSource) {
          if (editDragSource === square) {
            setEditDragSource(null);
            return;
          }
          const newFen = applyPieceMove(editDragSource, square, currentFen);
          if (newFen) chessRef.current!.loadFen(newFen);
          setEditDragSource(null);
          return;
        }

        if (selectedPalettePiece) {
          const newFen = applySquareAction(square, currentFen);
          if (newFen) chessRef.current!.loadFen(newFen);
          return;
        }

        if (piece) setEditDragSource(square);
        return;
      }

      const { isGameOver, isRewinding, getLegalMoves } = chessRef.current!;
      if (isGameOver || isRewinding) return;
      if (pendingPromotion) {
        setPendingPromotion(null);
        setSelectedSquare(null);
        return;
      }
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      if (selectedSquare) {
        const moved = attemptMove(selectedSquare, square);
        if (moved) return;
      }
      if (getLegalMoves(square).length > 0) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSquare, pendingPromotion, editDragSource, attemptMove, setSelectedSquare, setPendingPromotion, setEditDragSource],
  );

  const onPromotionSelect = useCallback(
    (piece: PromotionPiece | null) => {
      if (piece && pendingPromotion) {
        const ok = chessRef.current!.makeMove(
          pendingPromotion.from,
          pendingPromotion.to,
          piece,
        );
        if (ok) heatmapRef.current!.clear();
      }
      setPendingPromotion(null);
      setSelectedSquare(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingPromotion, setPendingPromotion, setSelectedSquare],
  );

  return { onDrop, onSquareClick, onPromotionSelect };
}