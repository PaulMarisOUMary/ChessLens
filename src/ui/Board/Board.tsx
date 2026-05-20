import { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

import { useChessGame } from "../../hooks/useChessGame";
import { useHeatmap } from "../../hooks/useHeatmap";
import { useSettings } from "../../hooks/useSettings";
import { useBoardResize } from "../../hooks/useBoardResize";
import { useEditMode } from "../../hooks/useEditMode";

import { HeatLayer } from "../HeatLayer/HeatLayer";
import { SidePanel } from "../SidePanel/SidePanel";
import { PiecePalette } from "../PiecePalette/PiecePalette";
import { PromotionPicker } from "../PromotionPicker/PromotionPicker";

import { isPromotionMove } from "../../utils/fen";
import type { EditablePiece, PromotionPiece } from "../../types";

import styles from "./Board.module.scss";

interface PendingPromotion {
  from: string;
  to: string;
}

export function Board() {
  const chess = useChessGame();
  const heatmap = useHeatmap();
  const {
    settings,
    displayDepth,
    setDepth,
    setHeatmapEnabled,
    setHeatmapOpacity,
  } = useSettings();
  const { boardWidth, isMobile } = useBoardResize();
  const edit = useEditMode();

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const [editDragSource, setEditDragSource] = useState<string | null>(null);

  const chessRef = useRef(chess);
  const heatmapRef = useRef(heatmap);
  const editRef = useRef(edit);
  useEffect(() => { chessRef.current = chess; });
  useEffect(() => { heatmapRef.current = heatmap; });
  useEffect(() => { editRef.current = edit; });

  useEffect(() => {
    const { isReady, analyse, clear } = heatmapRef.current;
    const { fen, turn, isGameOver, isRewinding } = chessRef.current;
    if (!isReady || isGameOver) return;
    if (!settings.heatmapEnabled || isRewinding || edit.isEditMode) {
      clear();
      return;
    }
    analyse(fen, turn, settings.depth);
  }, [
    chess.fen,
    chess.turn,
    chess.isGameOver,
    chess.isRewinding,
    heatmap.isReady,
    settings.heatmapEnabled,
    settings.depth,
    edit.isEditMode
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [chess.fen]);

  const handleToggleEditMode = useCallback(() => {
    if (edit.isEditMode) {
      edit.exitEditMode();
      heatmapRef.current.clear();
    } else {
      edit.enterEditMode();
      heatmapRef.current.clear();
      setSelectedSquare(null);
      setPendingPromotion(null);
      setEditDragSource(null);
    }
  }, [edit]);

  const attemptMove = useCallback((from: string, to: string): boolean => {
    const { isGameOver, isRewinding, makeMove, fen } = chessRef.current;
    if (isGameOver || isRewinding) return false;
    if (isPromotionMove(fen, from, to)) {
      setPendingPromotion({ from, to });
      return true;
    }
    const ok = makeMove(from, to);
    if (ok) { heatmapRef.current.clear(); setSelectedSquare(null); }
    return ok;
  }, []);

  const onDrop = useCallback((args: PieceDropHandlerArgs): boolean => {
    const { piece, sourceSquare, targetSquare } = args;
    if (!targetSquare) return false;

    if (editRef.current.isEditMode) {
      const currentFen = chessRef.current.fen;

      if (piece.isSparePiece) {
        const color = sourceSquare[0] as "w" | "b";
        const type = sourceSquare[1].toLowerCase() as EditablePiece["type"];
        const newFen = editRef.current.applyPaletteDrop({ color, type }, targetSquare, currentFen);
        chessRef.current.loadFen(newFen);
        return true;
      } else {
        const newFen = editRef.current.applyPieceMove(sourceSquare, targetSquare, currentFen);
        if (newFen) { chessRef.current.loadFen(newFen); return true; }
        return false;
      }
    }

    return attemptMove(sourceSquare, targetSquare);
  }, [attemptMove]);

  const onSquareClick = useCallback(({ square, piece }: SquareHandlerArgs) => {
    if (editRef.current.isEditMode) {
      const { isErasing, selectedPalettePiece, applySquareAction, applyPieceMove } = editRef.current;
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

      if (piece) {
        setEditDragSource(square);
      }
      return;
    }

    const { isGameOver, isRewinding, getLegalMoves } = chessRef.current;
    if (isGameOver || isRewinding) return;
    if (pendingPromotion) { setPendingPromotion(null); setSelectedSquare(null); return; }
    if (selectedSquare === square) { setSelectedSquare(null); return; }
    if (selectedSquare) {
      const moved = attemptMove(selectedSquare, square);
      if (moved) return;
    }
    if (getLegalMoves(square).length > 0) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  }, [selectedSquare, pendingPromotion, editDragSource, attemptMove]);

  const onPromotionSelect = useCallback((piece: PromotionPiece | null) => {
    if (piece && pendingPromotion) {
      const ok = chessRef.current.makeMove(pendingPromotion.from, pendingPromotion.to, piece);
      if (ok) heatmapRef.current.clear();
    }
    setPendingPromotion(null);
    setSelectedSquare(null);
  }, [pendingPromotion]);

  const handleClearBoard = useCallback(() => {
    chess.loadFen(edit.clearBoard(chess.fen));
    setEditDragSource(null);
  }, [edit, chess]);

  const handleResetBoard = useCallback(() => {
    chess.loadFen(edit.resetToInitial());
    setEditDragSource(null);
  }, [edit, chess]);

  const handleSetTurn = useCallback((turn: "w" | "b") => {
    const newFen = edit.setTurn(chess.fen, turn);
    chess.loadFen(newFen);
  }, [edit, chess]);

  const boardCursorClass = edit.isEditMode
    ? edit.isErasing
      ? styles.cursorErase
      : edit.selectedPalettePiece
        ? styles.cursorPlace
        : editDragSource
          ? styles.cursorGrab
          : styles.cursorDefault
    : "";

  const displayScores = selectedSquare
    ? heatmap.moveScores.filter((s) => s.from === selectedSquare)
    : heatmap.moveScores;

  const showHeatmap = settings.heatmapEnabled && !chess.isRewinding && !edit.isEditMode;

  return (
    <div className={styles.root}>
      <div className={styles.main}>

        {edit.isEditMode && (
          <PiecePalette
            selected={edit.selectedPalettePiece}
            isErasing={edit.isErasing}
            turn={chess.turn}
            onSelect={edit.setSelectedPalettePiece}
            onToggleErase={edit.toggleErase}
            onSetTurn={handleSetTurn}
            onClear={handleClearBoard}
            onReset={handleResetBoard}
            panelHeight={boardWidth}
          />
        )}

        <div
          className={`${styles.boardContainer} ${boardCursorClass}`}
          style={isMobile ? undefined : { width: boardWidth, height: boardWidth }}
        >
          <Chessboard
            options={{
              position: chess.fen,
              boardOrientation: isFlipped ? "black" : "white",
              onPieceDrop: onDrop,
              onSquareClick,
              allowDragging: true,
              lightSquareStyle: { backgroundColor: "#c9c9c9" },
              darkSquareStyle: { backgroundColor: "#4a4a4a" },
              lightSquareNotationStyle: { color: "#4a4a4a" },
              darkSquareNotationStyle: { color: "#c9c9c9" },
            }}
          />

          {showHeatmap && (
            <HeatLayer
              moveScores={displayScores}
              boardWidth={boardWidth}
              mode={selectedSquare ? "destination" : "source"}
              opacity={settings.heatmapOpacity}
              boardFlipped={isFlipped}
            />
          )}

          {heatmap.isAnalysing && <div className={styles.analysing} />}

          {pendingPromotion && (
            <PromotionPicker
              side={chess.turn}
              targetSquare={pendingPromotion.to}
              fromSquare={pendingPromotion.from}
              boardWidth={boardWidth}
              moveScores={heatmap.moveScores}
              boardFlipped={isFlipped}
              onSelect={onPromotionSelect}
            />
          )}
        </div>

        <SidePanel
          history={chess.history}
          activePly={chess.activePly}
          isRewinding={chess.isRewinding}
          globalScore={heatmap.globalScore}
          isAnalysing={heatmap.isAnalysing}
          engineStatus={heatmap.engineStatus}
          settings={settings}
          isGameOver={chess.isGameOver}
          status={chess.status}
          turn={chess.turn}
          boardHeight={boardWidth}
          displayDepth={displayDepth}
          isFlipped={isFlipped}
          isEditMode={edit.isEditMode}
          onGoToPly={chess.goToPly}
          onReset={chess.reset}
          onSetDepth={setDepth}
          onSetHeatmapEnabled={setHeatmapEnabled}
          onSetHeatmapOpacity={setHeatmapOpacity}
          onFlipBoard={() => setIsFlipped((f) => !f)}
          onToggleEditMode={handleToggleEditMode}
        />
      </div>
    </div>
  );
}