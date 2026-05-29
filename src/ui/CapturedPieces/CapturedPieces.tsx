import { memo, createElement } from "react";
import type { CapturedPieceEntry, ChessPieceKey } from "../../types";
import { getPieceSvg } from "../../utils/pieces";
import styles from "./CapturedPieces.module.scss";

export interface CapturedPiecesProps {
  pieces: CapturedPieceEntry[];
  advantage: number;
}

function PieceIcon({ piece }: { piece: CapturedPieceEntry }) {
  const key = `${piece.color}${piece.type.toUpperCase()}` as ChessPieceKey;
  const Svg = getPieceSvg(key);
  if (!Svg) return null;

  return (
    <span
      className={`${styles.pieceIcon} ${piece.color === "b" ? styles.darkPiece : styles.lightPiece}`}
      aria-hidden="true"
    >
      {createElement(Svg)}
    </span>
  );
}

export const CapturedPieces = memo(function CapturedPieces({
  pieces,
  advantage,
}: CapturedPiecesProps) {
  return (
    <div className={styles.row} aria-label="Captured pieces">
      <div className={styles.pieces}>
        {pieces.map((p, i) => (
          <PieceIcon key={`${p.color}${p.type}-${i}`} piece={p} />
        ))}
      </div>
      {advantage > 0 && (
        <span className={styles.advantage}>+{advantage}</span>
      )}
    </div>
  );
});