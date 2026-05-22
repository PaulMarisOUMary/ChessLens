export type EngineStatus = "loading" | "ready" | "analysing" | "error";

export type WorkerInMessage =
  | { type: "analyse"; fen: string; depth: number; moveLabel: string }
  | { type: "stop" }
  | { type: "quit" };

export type WorkerOutMessage =
  | { type: "ready" }
  | {
      type: "score";
      moveLabel: string;
      score: number;
      isMate: boolean;
      mateIn: number | null;
    }
  | { type: "bestmove"; moveLabel: string };

export type ScoreKind = "normal" | "mate-good" | "mate-bad";

export interface MoveScore {
  move: string;
  from: string;
  to: string;
  score: number;
  normalizedScore: number;
  kind: ScoreKind;
  mateIn: number | null;
}

export type HeatmapMode = "source" | "destination";

export const PROMOTION_PIECES = ["q", "r", "b", "n"] as const;
export type PromotionPiece = (typeof PROMOTION_PIECES)[number];

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw";

export type Side = "w" | "b";

export interface HistoryEntry {
  fen: string;
  san: string;
  uci: string;
  side: Side;
  ply: number;
}

export type EditablePiece = {
  type: "p" | "n" | "b" | "r" | "q" | "k";
  color: "w" | "b";
};

export interface Settings {
  depth: number;
  heatmapEnabled: boolean;
  heatmapOpacity: number;
}