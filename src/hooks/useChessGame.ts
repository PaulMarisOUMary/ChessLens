import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import type { Move, Square } from "chess.js";

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw";

interface UseChessGame {
  fen: string;
  turn: "w" | "b";
  status: GameStatus;
  isGameOver: boolean;
  makeMove: (from: Square, to: Square, promotion?: string) => Move | null;
  getLegalMoves: (square: Square) => Square[];
  reset: () => void;
}

function getStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return "checkmate";
  if (game.isStalemate()) return "stalemate";
  if (game.isDraw()) return "draw";
  if (game.isCheck()) return "check";
  return "playing";
}

export function useChessGame(): UseChessGame {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [status, setStatus] = useState<GameStatus>("playing");

  const makeMove = useCallback(
    (from: Square, to: Square, promotion = "q"): Move | null => {
      let result: Move | null = null;

      setGame((prev) => {
        const updated = new Chess(prev.fen());
        try {
          result = updated.move({ from, to, promotion });
        } catch {
          return prev;
        }
        setFen(updated.fen());
        setStatus(getStatus(updated));
        return updated;
      });

      return result;
    },
    [],
  );

  const getLegalMoves = useCallback(
    (square: Square): Square[] => {
      const moves = game.moves({ square, verbose: true });
      return moves.map((m) => m.to as Square);
    },
    [game],
  );

  const reset = useCallback(() => {
    const fresh = new Chess();
    setGame(fresh);
    setFen(fresh.fen());
    setStatus("playing");
  }, []);

  return {
    fen,
    turn: game.turn(),
    status,
    isGameOver: game.isGameOver(),
    makeMove,
    getLegalMoves,
    reset,
  };
}