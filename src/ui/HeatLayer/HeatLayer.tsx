import type { MoveScore, HeatmapMode } from "../../types";
import {
  scoreToColor,
  MATE_GOOD_COLOR,
  MATE_BAD_COLOR,
} from "../../utils/color";
import styles from "./HeatLayer.module.scss";

export interface HeatLayerProps {
  moveScores: MoveScore[];
  boardWidth: number;
  mode: HeatmapMode;
  opacity: number;
  boardFlipped?: boolean;
}

interface SquareData {
  square: string;
  normalizedScore: number;
  rawScore: number;
  kind: string;
  mateIn: number | null;
}

function getBestScorePerSource(scores: MoveScore[]): SquareData[] {
  const map = new Map<string, MoveScore>();
  for (const s of scores) {
    const current = map.get(s.from);
    if (!current || s.normalizedScore > current.normalizedScore) {
      map.set(s.from, s);
    }
  }
  return Array.from(map.values()).map((s) => ({
    square: s.from,
    normalizedScore: s.normalizedScore,
    rawScore: s.score,
    kind: s.kind,
    mateIn: s.mateIn,
  }));
}

function getBestScorePerDestination(scores: MoveScore[]): SquareData[] {
  const map = new Map<string, MoveScore>();
  for (const s of scores) {
    const current = map.get(s.to);
    if (!current || s.normalizedScore > current.normalizedScore) {
      map.set(s.to, s);
    }
  }
  return Array.from(map.values()).map((s) => ({
    square: s.to,
    normalizedScore: s.normalizedScore,
    rawScore: s.score,
    kind: s.kind,
    mateIn: s.mateIn,
  }));
}

export function HeatLayer({
  moveScores,
  boardWidth,
  mode,
  opacity,
  boardFlipped = false,
}: HeatLayerProps) {
  const squareSize = boardWidth / 8;

  const squares: SquareData[] =
    mode === "source"
      ? getBestScorePerSource(moveScores)
      : getBestScorePerDestination(moveScores);

  return (
    <div className={styles.layer}>
      {squares.map((sq) => (
        <HeatSquare
          key={`${mode}-${sq.square}`}
          squareSize={squareSize}
          mode={mode}
          opacity={opacity}
          boardFlipped={boardFlipped}
          {...sq}
        />
      ))}
    </div>
  );
}

interface HeatSquareProps extends SquareData {
  squareSize: number;
  mode: HeatmapMode;
  opacity: number;
  boardFlipped: boolean;
}

function HeatSquare({
  square,
  normalizedScore,
  rawScore,
  kind,
  mateIn,
  squareSize,
  mode,
  opacity,
  boardFlipped,
}: HeatSquareProps) {
  const fileIdx = square.charCodeAt(0) - "a".charCodeAt(0);
  const rankIdx = 8 - parseInt(square[1], 10);
  const file = boardFlipped ? 7 - fileIdx : fileIdx;
  const rank = boardFlipped ? 7 - rankIdx : rankIdx;

  const bgColor =
    kind === "mate-good"
      ? MATE_GOOD_COLOR(opacity)
      : kind === "mate-bad"
        ? MATE_BAD_COLOR(opacity)
        : scoreToColor(
            normalizedScore,
            mode === "source" ? opacity : opacity * 0.75,
          );

  const displayScore = rawScore / 100;
  const label =
    kind === "mate-good"
      ? mateIn === 1
        ? "M1"
        : `M${mateIn}`
      : kind === "mate-bad"
        ? "✕"
        : (displayScore >= 0 ? "+" : "") + displayScore.toFixed(1);

  const tagSize = squareSize * 0.36;

  return (
    <div
      className={styles.wrapper}
      style={{
        width: squareSize,
        height: squareSize,
        left: file * squareSize,
        top: rank * squareSize,
      }}
    >
      {mode === "destination" && (
        <div
          className={styles.destinationFill}
          style={{ backgroundColor: bgColor }}
        />
      )}
      <div
        className={styles.tag}
        style={{ width: tagSize, height: tagSize, backgroundColor: bgColor }}
      >
        <span className={styles.tagLabel}>{label}</span>
      </div>
    </div>
  );
}