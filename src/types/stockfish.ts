export type StockfishMessage =
  | { type: "init" }
  | {
      type: "analyse";
      fen: string;
      depth?: number;
      multipv?: number;
      moveLabel?: string;
    }
  | { type: "stop" }
  | { type: "quit" };

export type WorkerResponse =
  | { type: "ready" }
  | {
      type: "score";
      move: string;
      score: number;
      moveLabel: string;
      isMate: boolean;
      mateIn: number | null;
    }
  | { type: "bestmove"; move: string | null; moveLabel: string };

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