import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { EditablePiece } from "../types";

export interface UseEditMode {
  isEditMode: boolean;
  selectedPalettePiece: EditablePiece | null;
  isErasing: boolean;
  enterEditMode: () => void;
  exitEditMode: () => void;
  setSelectedPalettePiece: (piece: EditablePiece | null) => void;
  toggleErase: () => void;
  applyPieceMove: (from: string, to: string, fen: string) => string | null;

  applySquareAction: (square: string, fen: string) => string | null;
  applyPaletteDrop: (
    piece: EditablePiece,
    square: string,
    fen: string,
  ) => string;
  clearBoard: (fen: string) => string;
  resetToInitial: () => string;
  setTurn: (fen: string, turn: "w" | "b") => string;
}

const INITIAL_FEN = new Chess().fen();

export function sanitizeFen(fen: string): string {
  const parts = fen.split(" ");
  parts[2] = "-";
  parts[3] = "-";
  return parts.join(" ");
}

function tryChess(fen: string): Chess {
  const game = new Chess();
  try {
    game.load(fen, { skipValidation: true });
  } catch {
    game.clear();
  }
  return game;
}

function placePiece(
  fen: string,
  square: string,
  piece: EditablePiece | null,
): string {
  const game = tryChess(fen);
  if (piece === null) {
    game.remove(square as Square);
  } else {
    game.put(piece, square as Square);
  }
  return sanitizeFen(game.fen());
}

export function useEditMode(): UseEditMode {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPalettePiece, setSelectedPalettePieceState] =
    useState<EditablePiece | null>(null);
  const [isErasing, setIsErasing] = useState(false);

  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
    setSelectedPalettePieceState(null);
    setIsErasing(false);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setIsErasing(false);
    setSelectedPalettePieceState(null);
  }, []);

  const setSelectedPalettePiece = useCallback((piece: EditablePiece | null) => {
    setSelectedPalettePieceState(piece);
    setIsErasing(false);
  }, []);

  const toggleErase = useCallback(() => {
    setIsErasing((e) => !e);
    setSelectedPalettePieceState(null);
  }, []);

  const applyPieceMove = useCallback(
    (from: string, to: string, fen: string): string | null => {
      const game = tryChess(fen);
      const piece = game.get(from as Square);
      if (!piece) return null;
      game.remove(from as Square);
      game.put(piece, to as Square);
      return sanitizeFen(game.fen());
    },
    [],
  );

  const applySquareAction = useCallback(
    (square: string, fen: string): string | null => {
      if (isErasing) {
        return placePiece(fen, square, null);
      }
      if (selectedPalettePiece) {
        return placePiece(fen, square, selectedPalettePiece);
      }
      return null;
    },
    [isErasing, selectedPalettePiece],
  );

  const applyPaletteDrop = useCallback(
    (piece: EditablePiece, square: string, fen: string): string =>
      placePiece(fen, square, piece),
    [],
  );

  const clearBoard = useCallback((fen: string): string => {
    const game = tryChess(fen);
    game.clear();
    return sanitizeFen(game.fen());
  }, []);

  const resetToInitial = useCallback(() => INITIAL_FEN, []);

  const setTurn = useCallback((fen: string, turn: "w" | "b"): string => {
    const parts = fen.split(" ");
    parts[1] = turn;
    return parts.join(" ");
  }, []);

  return {
    isEditMode,
    selectedPalettePiece,
    isErasing,
    enterEditMode,
    exitEditMode,
    setSelectedPalettePiece,
    toggleErase,
    applyPieceMove,
    applySquareAction,
    applyPaletteDrop,
    clearBoard,
    resetToInitial,
    setTurn,
  };
}