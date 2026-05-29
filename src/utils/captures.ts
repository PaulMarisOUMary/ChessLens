import type { HistoryEntry, CapturedPieceEntry } from "../types";

type PieceType = CapturedPieceEntry["type"];

const PIECE_VALUE: Record<PieceType, number> = {
  p: 100,
  n: 300,
  b: 300,
  r: 500,
  q: 900,
};

const PIECE_ORDER: PieceType[] = ["q", "r", "b", "n", "p"];

function sortByValue(arr: CapturedPieceEntry[]): CapturedPieceEntry[] {
  return [...arr].sort(
    (a, b) => PIECE_ORDER.indexOf(a.type) - PIECE_ORDER.indexOf(b.type),
  );
}

export interface CapturedGroups {
  byWhite: CapturedPieceEntry[];
  byBlack: CapturedPieceEntry[];
  advantage: number;
}

export function computeCapturedPieces(
  history: HistoryEntry[],
  upToPly: number,
): CapturedGroups {
  const byWhite: CapturedPieceEntry[] = [];
  const byBlack: CapturedPieceEntry[] = [];

  for (let i = 0; i < upToPly && i < history.length; i++) {
    const entry = history[i];
    if (!entry.capturedPiece) continue;
    const type = entry.capturedPiece;
    if (entry.side === "w") {
      byWhite.push({ type, color: "b" });
    } else {
      byBlack.push({ type, color: "w" });
    }
  }

  const score = (arr: CapturedPieceEntry[]) =>
    arr.reduce((s, p) => s + PIECE_VALUE[p.type], 0);

  return {
    byWhite: sortByValue(byWhite),
    byBlack: sortByValue(byBlack),
    advantage: Math.round((score(byWhite) - score(byBlack)) / 100),
  };
}