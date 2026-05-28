import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

import { BoardProvider } from "../../context/BoardProvider";
import { useBoardContext } from "../../context/useBoardContext";
import { HeatLayer } from "../HeatLayer/HeatLayer";
import { SidePanel } from "../SidePanel/SidePanel";
import { PiecePalette } from "../PiecePalette/PiecePalette";
import { PromotionPicker } from "../PromotionPicker/PromotionPicker";

import styles from "./Board.module.scss";
import type { ChessPieceKey } from "../../types";

const LIGHT_SQUARE = { backgroundColor: "#c9c9c9" };
const DARK_SQUARE = { backgroundColor: "#4a4a4a" };
const LIGHT_NOTATION = { color: "#4a4a4a" };
const DARK_NOTATION = { color: "#c9c9c9" };

function BoardInner() {
  const {
    chess,
    heatmap,
    edit,
    boardWidth,
    isMobile,
    isFlipped,
    pendingPromotion,
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
    selectedSquare,
    settingsApi,
  } = useBoardContext();

  const {
    settings,
    displayDepth,
    setDepth,
    setHeatmapEnabled,
    setHeatmapOpacity,
  } = settingsApi;

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
          className={`${styles.boardContainer} ${boardCursorStyle ? styles[boardCursorStyle as keyof typeof styles] : ""}`}
          style={
            isMobile ? undefined : { width: boardWidth, height: boardWidth }
          }
        >
          <Chessboard
            options={{
              position: chess.fen,
              boardOrientation: isFlipped ? "black" : "white",
              onPieceDrop: (args: PieceDropHandlerArgs) =>
                onDrop({
                  piece: args.piece,
                  sourceSquare: args.sourceSquare,
                  targetSquare: args.targetSquare ?? null,
                }),
              onSquareClick: (args: SquareHandlerArgs) =>
                onSquareClick({
                  square: args.square,
                  piece: args.piece as unknown as ChessPieceKey | undefined,
                }),
              allowDragging: true,
              lightSquareStyle: LIGHT_SQUARE,
              darkSquareStyle: DARK_SQUARE,
              lightSquareNotationStyle: LIGHT_NOTATION,
              darkSquareNotationStyle: DARK_NOTATION,
            }}
          />

          {showHeatmap && (
            <HeatLayer
              moveScores={displayScores}
              boardWidth={boardWidth}
              mode={heatmapMode}
              opacity={settings.heatmapOpacity}
              boardFlipped={isFlipped}
            />
          )}

          {heatmap.isAnalysing && (
            <div
              className={styles.analysing}
              role="status"
              aria-label="Analysing position"
            />
          )}

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
          selectedSquare={selectedSquare}
          onGoToPly={chess.goToPly}
          onReset={chess.reset}
          onSetDepth={setDepth}
          onSetHeatmapEnabled={setHeatmapEnabled}
          onSetHeatmapOpacity={setHeatmapOpacity}
          onFlipBoard={flipBoard}
          onToggleEditMode={toggleEditMode}
        />
      </div>
    </div>
  );
}

export function Board() {
  return (
    <BoardProvider>
      <BoardInner />
    </BoardProvider>
  );
}