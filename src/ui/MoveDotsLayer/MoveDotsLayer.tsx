import { memo, useMemo } from "react";
import { Chess } from "chess.js";
import styles from "./MoveDotsLayer.module.scss";

export interface MoveDotsLayerProps {
  destinations: string[];
  fen: string;
  boardWidth: number;
  boardFlipped: boolean;
}

function squareToPosition(
  square: string,
  squareSize: number,
  boardFlipped: boolean,
): { left: number; top: number } {
  const fileIdx = square.charCodeAt(0) - "a".charCodeAt(0);
  const rankIdx = 8 - parseInt(square[1], 10);
  const file = boardFlipped ? 7 - fileIdx : fileIdx;
  const rank = boardFlipped ? 7 - rankIdx : rankIdx;
  return { left: file * squareSize, top: rank * squareSize };
}

export const MoveDotsLayer = memo(function MoveDotsLayer({
  destinations,
  fen,
  boardWidth,
  boardFlipped,
}: MoveDotsLayerProps) {
  const squareSize = boardWidth / 8;

  const occupiedSquares = useMemo(() => {
    const occupied = new Set<string>();
    try {
      const game = new Chess(fen);
      for (let f = 0; f < 8; f++) {
        for (let r = 1; r <= 8; r++) {
          const sq = `${"abcdefgh"[f]}${r}` as Parameters<typeof game.get>[0];
          if (game.get(sq)) occupied.add(sq);
        }
      }
    // eslint-disable-next-line no-empty
    } catch {
    }
    return occupied;
  }, [fen]);

  if (destinations.length === 0) return null;

  return (
    <div className={styles.layer} aria-hidden="true">
      {destinations.map((sq) => {
        const { left, top } = squareToPosition(sq, squareSize, boardFlipped);
        return (
          <div
            key={sq}
            className={`${styles.dot} ${occupiedSquares.has(sq) ? styles.capture : ""}`}
            style={{ width: squareSize, height: squareSize, left, top }}
          />
        );
      })}
    </div>
  );
});