import { useEffect } from "react";
import { defaultPieces } from "react-chessboard";
import { type Side, type MoveScore, type PromotionPiece, PROMOTION_PIECES } from "../../types";
import {
  scoreToColor,
  MATE_GOOD_COLOR,
  MATE_BAD_COLOR,
} from "../../utils/color";
import { formatScoreLabel } from "../../utils/score";
import styles from "./PromotionPicker.module.scss";

const PIECE_LABELS: Record<PromotionPiece, string> = {
  q: "Queen",
  r: "Rook",
  b: "Bishop",
  n: "Knight",
};

function ScoreBadge({ score }: { score: MoveScore }) {
  const { normalizedScore, score: rawScore, kind, mateIn } = score;

  const bgColor =
    kind === "mate-good"
      ? MATE_GOOD_COLOR(0.92)
      : kind === "mate-bad"
        ? MATE_BAD_COLOR(0.92)
        : scoreToColor(normalizedScore, 0.92);

  const label = formatScoreLabel(rawScore, kind, mateIn);

  return (
    <div className={styles.tag} style={{ backgroundColor: bgColor }}>
      <span className={styles.tagLabel}>{label}</span>
    </div>
  );
}

function fileToCol(file: string): number {
  return file.charCodeAt(0) - "a".charCodeAt(0);
}

function rankToRow(rank: string): number {
  return 8 - parseInt(rank, 10);
}

interface PromotionPickerProps {
  side: Side;
  targetSquare: string;
  boardWidth: number;
  moveScores: MoveScore[];
  fromSquare: string;
  boardFlipped?: boolean;
  onSelect: (piece: PromotionPiece | null) => void;
}

export function PromotionPicker({
  side,
  targetSquare,
  boardWidth,
  moveScores,
  fromSquare,
  boardFlipped = false,
  onSelect,
}: PromotionPickerProps) {
  const cellSize = boardWidth / 8;
  const file = targetSquare[0];
  const rank = targetSquare[1];

  const col = boardFlipped ? 7 - fileToCol(file) : fileToCol(file);
  const targetRow = boardFlipped ? 7 - rankToRow(rank) : rankToRow(rank);

  const stacksDown = targetRow <= 3;
  const left = col * cellSize;
  const top = stacksDown ? targetRow * cellSize : (targetRow - 3) * cellSize;

  const scoreByPiece = new Map<PromotionPiece, MoveScore>();
  for (const s of moveScores) {
    if (s.from === fromSquare && s.to === targetSquare) {
      const last = s.move[s.move.length - 1] as PromotionPiece;
      if (PROMOTION_PIECES.includes(last)) {
        scoreByPiece.set(last, s);
      }
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  return (
    <>
      <div
        className={styles.overlay}
        onClick={() => onSelect(null)}
        aria-label="Cancel promotion"
      />
      <div
        className={styles.picker}
        style={{ left, top, width: cellSize, height: cellSize * 4 }}
        aria-label="Choose promotion piece"
        role="listbox"
      >
        {PROMOTION_PIECES.map((p) => {
          const pieceKey = `${side}${p.toUpperCase()}` as keyof typeof defaultPieces;
          const PieceSvg = defaultPieces[pieceKey];
          const score = scoreByPiece.get(p);

          return (
            <button
              key={p}
              className={styles.cell}
              style={{ width: cellSize, height: cellSize }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(p);
              }}
              aria-label={`${PIECE_LABELS[p]}${score ? ` (${score.score / 100})` : ""}`}
              role="option"
            >
              {PieceSvg && <PieceSvg />}
              {score && <ScoreBadge score={score} />}
            </button>
          );
        })}
      </div>
    </>
  );
}