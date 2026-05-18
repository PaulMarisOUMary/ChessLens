import type { MoveScore } from "../../types";
import {
  scoreToColor,
  MATE_GOOD_COLOR,
  MATE_BAD_COLOR,
} from "../../utils/color";
import styles from "./HeatLayer.module.scss";

interface HeatLayerProps {
  moveScores: MoveScore[];
  boardWidth: number;
  mode: "source" | "destination";
  opacity: number;
}

export function HeatLayer({
  moveScores,
  boardWidth,
  mode,
  opacity,
}: HeatLayerProps) {
  const squareSize = boardWidth / 8;

  const squares =
    mode === "source"
      ? getBestScorePerSource(moveScores)
      : moveScores.map((s) => ({
          square: s.to,
          normalizedScore: s.normalizedScore,
          rawScore: s.score,
          kind: s.kind,
          mateIn: s.mateIn,
        }));

  return (
    <div className={styles.layer}>
      {squares.map(({ square, normalizedScore, rawScore, kind, mateIn }) => (
        <HeatSquare
          key={`${mode}-${square}`}
          square={square}
          score={normalizedScore}
          rawScore={rawScore}
          kind={kind}
          mateIn={mateIn}
          squareSize={squareSize}
          mode={mode}
          opacity={opacity}
        />
      ))}
    </div>
  );
}

function getBestScorePerSource(scores: MoveScore[]) {
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

interface HeatSquareProps {
  square: string;
  score: number;
  rawScore: number;
  kind: string;
  mateIn: number | null;
  squareSize: number;
  mode: "source" | "destination";
  opacity: number;
}

function HeatSquare({
  square,
  score,
  rawScore,
  kind,
  mateIn,
  squareSize,
  mode,
  opacity,
}: HeatSquareProps) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = 8 - parseInt(square[1]);

  const bgColor =
    kind === "mate-good"
      ? MATE_GOOD_COLOR(opacity)
      : kind === "mate-bad"
        ? MATE_BAD_COLOR(opacity)
        : scoreToColor(score, mode === "source" ? opacity : opacity * 0.75);

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