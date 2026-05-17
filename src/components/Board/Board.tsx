import { useCallback } from "react";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";
import type { Square } from "chess.js";
import { useChessGame } from "../../hooks/useChessGame";
import type { GameStatus } from "../../hooks/useChessGame";
import styles from "./Board.module.scss";

function statusLabel(status: GameStatus, turn: "w" | "b"): string {
  const side = turn === "w" ? "White" : "Black";
  const other = turn === "w" ? "Black" : "White";

  switch (status) {
    case "checkmate":
      return `Checkmate - ${other} win`;
    case "stalemate":
      return "Stalemate - draw";
    case "draw":
      return "Draw";
    case "check":
      return `Check - ${side} to move`;
    case "playing":
      return `${side} to move`;
  }
}

export function Board() {
  const { fen, makeMove, reset, isGameOver, turn, status } = useChessGame();

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
      if (isGameOver) return false;
      const move = makeMove(sourceSquare as Square, targetSquare as Square);
      return move !== null;
    },
    [makeMove, isGameOver],
  );

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.info} ${styles[status]}`} aria-live="polite">
        {statusLabel(status, turn)}
      </div>

      <div className={styles.boardContainer}>
        <Chessboard
          options={{
            position: fen,
            onPieceDrop: onDrop,
          }}
        />
      </div>

      <button className={styles.reset} onClick={reset}>
        New Game
      </button>
    </div>
  );
}