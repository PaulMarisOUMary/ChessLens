import { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

import { useChessGame } from "../../hooks/useChessGame";
import { useHeatmap } from "../../hooks/useHeatmap";
import { useSettings } from "../../hooks/useSettings";
import { useBoardResize } from "../../hooks/useBoardResize";

import { HeatLayer } from "../HeatLayer/HeatLayer";
import { SidePanel } from "../SidePanel/SidePanel";
import styles from "./Board.module.scss";

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
  }, [chess.fen]);

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      const { isGameOver, isRewinding, makeMove } = chessRef.current;
      if (isGameOver || isRewinding || !targetSquare) return false;

      const ok = makeMove(sourceSquare, targetSquare);
      if (ok) {
        heatmapRef.current.clear();
        setSelectedSquare(null);
      }
      return ok;
    },
    [],
  );

  const onSquareClick = useCallback(
    ({ square }: SquareHandlerArgs) => {
      const { isGameOver, isRewinding, makeMove, getLegalMoves } =
        chessRef.current;

      if (isGameOver || isRewinding) return;

      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      if (selectedSquare) {
        const ok = makeMove(selectedSquare, square);
        if (ok) {
          heatmapRef.current.clear();
          setSelectedSquare(null);
          return;
        }
      }

      if (getLegalMoves(square).length > 0) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    },
    [selectedSquare],
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