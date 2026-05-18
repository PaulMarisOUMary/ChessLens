import type { MoveScore, ScoreKind } from "../types";

interface RawScore {
  move: string;
  from: string;
  to: string;
  score: number;
  isMate: boolean;
  mateIn: number | null;
}

export function normalizeScores(raw: RawScore[]): MoveScore[] {
  if (raw.length === 0) return [];

  const normal = raw.filter((s) => !s.isMate);
  const mates = raw.filter((s) => s.isMate);

  const values = normal.map((s) => s.score);
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const range = max - min;

  const normalizedNormal: MoveScore[] = normal.map((s) => ({
    move: s.move,
    from: s.from,
    to: s.to,
    score: s.score,
    normalizedScore: range === 0 ? 0.5 : (s.score - min) / range,
    kind: "normal" as ScoreKind,
    mateIn: null,
  }));

  const normalizedMates: MoveScore[] = mates.map((s) => {
    const isGood = (s.mateIn ?? 0) > 0;
    return {
      move: s.move,
      from: s.from,
      to: s.to,
      score: s.score,
      normalizedScore: isGood ? 1 : 0,
      kind: (isGood ? "mate-good" : "mate-bad") as ScoreKind,
      mateIn: Math.abs(s.mateIn ?? 0),
    };
  });

  return [...normalizedNormal, ...normalizedMates];
}