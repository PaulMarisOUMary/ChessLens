import { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

import { useChessGame } from "../../hooks/useChessGame";
import { useHeatmap } from "../../hooks/useHeatmap";
import { useSettings } from "../../hooks/useSettings";
import { useBoardResize } from "../../hooks/useBoardResize";

import { HeatLayer } from "../HeatLayer/HeatLayer";
import { SidePanel } from "../SidePanel/SidePanel";
import { PromotionPicker } from "../PromotionPicker/PromotionPicker";
import { isPromotionMove } from "../../utils/fen";
import styles from "./Board.module.scss";
import type { PromotionPiece } from "../../types";

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

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);

  const chessRef = useRef(chess);
  const heatmapRef = useRef(heatmap);
  useEffect(() => {
    chessRef.current = chess;
  });
  useEffect(() => {
    heatmapRef.current = heatmap;
  });

  useEffect(() => {
    const { isReady, analyse, clear } = heatmapRef.current;
    const { fen, turn, isGameOver, isRewinding } = chessRef.current;

    if (!isReady || isGameOver) return;

    if (!settings.heatmapEnabled || isRewinding) {
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
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [chess.fen]);

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
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (!targetSquare) return false;
      return attemptMove(sourceSquare, targetSquare);
    },
    [attemptMove],
  );

  const onSquareClick = useCallback(
    ({ square }: SquareHandlerArgs) => {
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
    [selectedSquare, pendingPromotion, attemptMove],
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

  const displayScores = selectedSquare
    ? heatmap.moveScores.filter((s) => s.from === selectedSquare)
    : heatmap.moveScores;

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <div
          className={styles.boardContainer}
          style={
            isMobile ? undefined : { width: boardWidth, height: boardWidth }
          }
        >
          <Chessboard
            options={{
              position: chess.fen,
              onPieceDrop: onDrop,
              onSquareClick,
              lightSquareStyle: { backgroundColor: "#c9c9c9" },
              darkSquareStyle: { backgroundColor: "#4a4a4a" },
              lightSquareNotationStyle: { color: "#4a4a4a" },
              darkSquareNotationStyle: { color: "#c9c9c9" },
            }}
          />

          {settings.heatmapEnabled && !chess.isRewinding && (
            <HeatLayer
              moveScores={displayScores}
              boardWidth={boardWidth}
              mode={selectedSquare ? "destination" : "source"}
              opacity={settings.heatmapOpacity}
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
          onGoToPly={chess.goToPly}
          onReset={chess.reset}
          onSetDepth={setDepth}
          onSetHeatmapEnabled={setHeatmapEnabled}
          onSetHeatmapOpacity={setHeatmapOpacity}
          displayDepth={displayDepth}
        />
      </div>
    </div>
  );
}