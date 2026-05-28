import { Chess } from "chess.js";
import { getLegalMoves, isCheckmate } from "./fen";
import { GLOBAL_DEPTH_BONUS } from "../constants";

export interface QueueItem {
  type: "global" | "move";
  moveLabel?: string;
  fen: string;
  depth: number;
  isImmediateMate?: boolean;
}

export function buildAnalysisQueue(fen: string, depth: number): QueueItem[] {
  const moves = getLegalMoves(fen);
  if (moves.length === 0) return [];

  const baseGame = new Chess(fen);

  return [
    { type: "global" as const, fen, depth: depth + GLOBAL_DEPTH_BONUS },
    ...moves.flatMap((m): QueueItem[] => {
      const tmp = new Chess(baseGame.fen());
      try {
        tmp.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
        const nextFen = tmp.fen();
        return [
          {
            type: "move" as const,
            moveLabel: `${m.from}${m.to}${m.promotion ?? ""}`,
            fen: nextFen,
            depth,
            isImmediateMate: isCheckmate(nextFen),
          },
        ];
      } catch {
        return [];
      }
    }),
  ];
}