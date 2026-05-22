import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useChessGame } from "../hooks/useChessGame";
import { useHeatmap } from "../hooks/useHeatmap";
import { useSettings } from "../hooks/useSettings";
import { useBoardResize } from "../hooks/useBoardResize";
import { useEditMode } from "../hooks/useEditMode";
import { isPromotionMove } from "../utils/fen";
import type { EditablePiece, PromotionPiece } from "../types";
import { BoardContext } from "./BoardContext";
import type { PendingPromotion, BoardContextValue } from "./BoardContext.types";

const CURSOR_ERASE = "cursorErase";
const CURSOR_PLACE = "cursorPlace";
const CURSOR_GRAB = "cursorGrab";
const CURSOR_DEFAULT = "cursorDefault";

export function BoardProvider({ children }: { children: ReactNode }) {
  const chess = useChessGame();
  const heatmap = useHeatmap();
  const settingsApi = useSettings();
  const { boardWidth, isMobile } = useBoardResize();
  const edit = useEditMode();

  const [isFlipped, setIsFlipped] = useState(false);
  const [editDragSource, setEditDragSource] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [lastFen, setLastFen] = useState(chess.fen);

  if (chess.fen !== lastFen) {
    setLastFen(chess.fen);
    setSelectedSquare(null);
    setPendingPromotion(null);
  }

  const chessRef = useRef(chess);
  const heatmapRef = useRef(heatmap);
  const editRef = useRef(edit);
  useEffect(() => { chessRef.current = chess; });
  useEffect(() => { heatmapRef.current = heatmap; });
  useEffect(() => { editRef.current = edit; });

  const { heatmapEnabled, depth } = settingsApi.settings;

  useEffect(() => {
    const { isReady, analyse, clear } = heatmapRef.current;
    const { fen, turn, isGameOver, isRewinding } = chessRef.current;

    if (!isReady || isGameOver) return;
    if (!heatmapEnabled || isRewinding || edit.isEditMode) {
      clear();
      return;
    }
    analyse(fen, turn, depth);
  }, [
    chess.fen,
    chess.turn,
    chess.isGameOver,
    chess.isRewinding,
    heatmap.isReady,
    heatmapEnabled,
    depth,
    edit.isEditMode,
  ]);

  const flipBoard = useCallback(() => setIsFlipped((f) => !f), []);

  const toggleEditMode = useCallback(() => {
    if (editRef.current.isEditMode) {
      editRef.current.exitEditMode();
      heatmapRef.current.clear();
    } else {
      editRef.current.enterEditMode();
      heatmapRef.current.clear();
      setSelectedSquare(null);
      setPendingPromotion(null);
      setEditDragSource(null);
    }
  }, []);

  const attemptMove = useCallback((from: string, to: string): boolean => {
    const { isGameOver, isRewinding, makeMove, fen } = chessRef.current;
    if (isGameOver || isRewinding) return false;
    if (isPromotionMove(fen, from, to)) {
      setPendingPromotion({ from, to });
      return true;
    }
    const ok = makeMove(from, to);
    if (ok) {
      heatmapRef.current.clear();
      setSelectedSquare(null);
    }
    return ok;
  }, []);

  const onDrop = useCallback(
    (args: {
      piece: { isSparePiece?: boolean };
      sourceSquare: string;
      targetSquare: string | null;
    }): boolean => {
      const { piece, sourceSquare, targetSquare } = args;
      if (!targetSquare) return false;

      if (editRef.current.isEditMode) {
        const currentFen = chessRef.current.fen;

        if (piece.isSparePiece) {
          const color = sourceSquare[0] as "w" | "b";
          const type = sourceSquare[1].toLowerCase() as EditablePiece["type"];
          const newFen = editRef.current.applyPaletteDrop(
            { color, type },
            targetSquare,
            currentFen,
          );
          chessRef.current.loadFen(newFen);
          return true;
        }

        const newFen = editRef.current.applyPieceMove(
          sourceSquare,
          targetSquare,
          currentFen,
        );
        if (newFen) {
          chessRef.current.loadFen(newFen);
          return true;
        }
        return false;
      }

      return attemptMove(sourceSquare, targetSquare);
    },
    [attemptMove],
  );

  const onSquareClick = useCallback(
    ({ square, piece }: { square: string; piece?: unknown }) => {
      if (editRef.current.isEditMode) {
        const { isErasing, selectedPalettePiece, applySquareAction, applyPieceMove } =
          editRef.current;
        const currentFen = chessRef.current.fen;

        if (isErasing) {
          const newFen = applySquareAction(square, currentFen);
          if (newFen) chessRef.current.loadFen(newFen);
          return;
        }

        if (editDragSource) {
          if (editDragSource === square) {
            setEditDragSource(null);
            return;
          }
          const newFen = applyPieceMove(editDragSource, square, currentFen);
          if (newFen) chessRef.current.loadFen(newFen);
          setEditDragSource(null);
          return;
        }

        if (selectedPalettePiece) {
          const newFen = applySquareAction(square, currentFen);
          if (newFen) chessRef.current.loadFen(newFen);
          return;
        }

        if (piece) setEditDragSource(square);
        return;
      }

      const { isGameOver, isRewinding, getLegalMoves } = chessRef.current;
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
    [selectedSquare, pendingPromotion, editDragSource, attemptMove],
  );

  const onPromotionSelect = useCallback(
    (piece: PromotionPiece | null) => {
      if (piece && pendingPromotion) {
        const ok = chessRef.current.makeMove(
          pendingPromotion.from,
          pendingPromotion.to,
          piece,
        );
        if (ok) heatmapRef.current.clear();
      }
      setPendingPromotion(null);
      setSelectedSquare(null);
    },
    [pendingPromotion],
  );

  const handleClearBoard = useCallback(() => {
    chessRef.current.loadFen(editRef.current.clearBoard(chessRef.current.fen));
    setEditDragSource(null);
  }, []);

  const handleResetBoard = useCallback(() => {
    chessRef.current.loadFen(editRef.current.resetToInitial());
    setEditDragSource(null);
  }, []);

  const handleSetTurn = useCallback((turn: "w" | "b") => {
    const newFen = editRef.current.setTurn(chessRef.current.fen, turn);
    chessRef.current.loadFen(newFen);
  }, []);

  const boardCursorStyle = edit.isEditMode
    ? edit.isErasing
      ? CURSOR_ERASE
      : edit.selectedPalettePiece
        ? CURSOR_PLACE
        : editDragSource
          ? CURSOR_GRAB
          : CURSOR_DEFAULT
    : "";

  const displayScores = selectedSquare
    ? heatmap.moveScores.filter((s) => s.from === selectedSquare)
    : heatmap.moveScores;

  const showHeatmap =
    settingsApi.settings.heatmapEnabled && !chess.isRewinding && !edit.isEditMode;

  const value: BoardContextValue = {
    chess,
    heatmap,
    settingsApi,
    edit,
    boardWidth,
    isMobile,
    isFlipped,
    selectedSquare,
    pendingPromotion,
    editDragSource,
    boardCursorStyle,
    displayScores,
    showHeatmap,
    flipBoard,
    toggleEditMode,
    onDrop,
    onSquareClick,
    onPromotionSelect,
    handleClearBoard,
    handleResetBoard,
    handleSetTurn,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}
