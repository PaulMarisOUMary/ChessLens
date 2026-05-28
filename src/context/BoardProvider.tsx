import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import { useChessGame } from "../hooks/useChessGame";
import { useHeatmap } from "../hooks/useHeatmap";
import { useSettings } from "../hooks/useSettings";
import { useBoardResize } from "../hooks/useBoardResize";
import { useEditMode } from "../hooks/useEditMode";
import { useKeyboardRewind } from "../hooks/useKeyboardRewind";

import { useInteractionState } from "./slices/useInteractionState";
import { useMoveHandler } from "./slices/useMoveHandler";
import { useEditActions } from "./slices/useEditActions";
import { useHeatmapSync } from "./slices/useHeatmapSync";
import { useCursorStyle } from "./slices/useCursorStyle";

import { BoardContext } from "./BoardContext";
import type { BoardContextValue } from "./BoardContext.types";
import type { HeatmapMode } from "../types";

export function BoardProvider({ children }: { children: ReactNode }) {
  const chess = useChessGame();
  const heatmap = useHeatmap();
  const settingsApi = useSettings();
  const { boardWidth, isMobile } = useBoardResize();
  const edit = useEditMode();

  const chessRef = useRef(chess);
  const heatmapRef = useRef(heatmap);
  const editRef = useRef(edit);
  useEffect(() => { chessRef.current = chess; });
  useEffect(() => { heatmapRef.current = heatmap; });
  useEffect(() => { editRef.current = edit; });

  const {
    isFlipped,
    selectedSquare,
    pendingPromotion,
    editDragSource,
    flipBoard,
    setSelectedSquare,
    setPendingPromotion,
    setEditDragSource,
  } = useInteractionState(chess.fen);

  const { onDrop, onSquareClick, onPromotionSelect } = useMoveHandler({
    chessRef,
    heatmapRef,
    editRef,
    selectedSquare,
    pendingPromotion,
    editDragSource,
    setSelectedSquare,
    setPendingPromotion,
    setEditDragSource,
  });

  const { handleClearBoard, handleResetBoard, handleSetTurn } = useEditActions({
    chessRef,
    editRef,
    setEditDragSource,
  });

  const { heatmapEnabled, depth } = settingsApi.settings;
  useHeatmapSync({
    chess,
    heatmap,
    heatmapEnabled,
    depth,
    isEditMode: edit.isEditMode,
  });

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
  }, [setSelectedSquare, setPendingPromotion, setEditDragSource]);

  useKeyboardRewind({
    activePly: chess.activePly,
    historyLength: chess.history.length,
    isEditMode: edit.isEditMode,
    onGoToPly: chess.goToPly,
  });

  const boardCursorStyle = useCursorStyle({ edit, editDragSource });

  const displayScores = useMemo(
    () =>
      selectedSquare
        ? heatmap.moveScores.filter((s) => s.from === selectedSquare)
        : heatmap.moveScores,
    [heatmap.moveScores, selectedSquare],
  );

  const showHeatmap = useMemo(
    () =>
      settingsApi.settings.heatmapEnabled &&
      !chess.isRewinding &&
      !edit.isEditMode,
    [settingsApi.settings.heatmapEnabled, chess.isRewinding, edit.isEditMode],
  );

  const heatmapMode: HeatmapMode = selectedSquare ? "destination" : "source";

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
    heatmapMode,
    flipBoard,
    toggleEditMode,
    onDrop,
    onSquareClick,
    onPromotionSelect,
    handleClearBoard,
    handleResetBoard,
    handleSetTurn,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}