import { defaultPieces } from "react-chessboard";
import type { EditablePiece } from "../../types";
import styles from "./PiecePalette.module.scss";

const PIECE_TYPES: EditablePiece["type"][] = ["k", "q", "r", "b", "n", "p"];

const PIECE_NAMES: Record<EditablePiece["type"], string> = {
  k: "King",
  q: "Queen",
  r: "Rook",
  b: "Bishop",
  n: "Knight",
  p: "Pawn",
};

function pieceKey(p: EditablePiece): string {
  return `${p.color}${p.type.toUpperCase()}`;
}

function isSame(a: EditablePiece | null, b: EditablePiece | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.type === b.type && a.color === b.color;
}

function PieceCell({
  piece,
  selected,
  onSelect,
}: {
  piece: EditablePiece;
  selected: EditablePiece | null;
  onSelect: (p: EditablePiece) => void;
}) {
  const key = pieceKey(piece) as keyof typeof defaultPieces;
  const PieceSvg = defaultPieces[key];
  const active = isSame(piece, selected);

  return (
    <button
      className={`${styles.cell} ${active ? styles.active : ""}`}
      onClick={() => onSelect(piece)}
      aria-label={`${piece.color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece.type]}`}
      aria-pressed={active}
    >
      {PieceSvg && <PieceSvg />}
    </button>
  );
}

function IndicatorIcon({ selected, isErasing }: { selected: EditablePiece | null; isErasing: boolean }) {
  if (isErasing) {
    return <span className={styles.indicatorEraseIcon}>✕</span>;
  }
  if (!selected) return null;

  const key = pieceKey(selected) as keyof typeof defaultPieces;
  const PieceSvg = defaultPieces[key];
  if (!PieceSvg) return null;

  return (
    <span className={styles.indicatorIcon}>
      <PieceSvg />
    </span>
  );
}

export interface PiecePaletteProps {
  selected: EditablePiece | null;
  isErasing: boolean;
  turn: "w" | "b";
  onSelect: (piece: EditablePiece | null) => void;
  onToggleErase: () => void;
  onSetTurn: (turn: "w" | "b") => void;
  onReset: () => void;
  onClear: () => void;
  panelHeight: number;
}

export function PiecePalette({
  selected,
  isErasing,
  turn,
  onSelect,
  onToggleErase,
  onSetTurn,
  onReset,
  onClear,
  panelHeight,
}: PiecePaletteProps) {
  const activeName = isErasing
    ? "Erase"
    : selected
      ? `${selected.color === "w" ? "White" : "Black"} ${PIECE_NAMES[selected.type]}`
      : "Select a piece";

  return (
    <aside className={styles.panel} style={{ height: panelHeight }}>
      <div className={styles.indicator}>
        <IndicatorIcon selected={selected} isErasing={isErasing} />
        <span className={styles.indicatorLabel}>{activeName}</span>
      </div>

      <p className={styles.hint}>
        {isErasing
          ? "Click any piece on the board to remove it"
          : selected
            ? "Click a square to place · drag board pieces to move"
            : "Pick a piece below, then click the board"}
      </p>

      <div className={styles.gridWrapper}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <span className={styles.colLabel}>White</span>
            {PIECE_TYPES.map((type) => (
              <PieceCell
                key={`w-${type}`}
                piece={{ type, color: "w" }}
                selected={isErasing ? null : selected}
                onSelect={onSelect}
              />
            ))}
          </div>

          <div className={styles.column}>
            <span className={styles.colLabel}>Black</span>
            {PIECE_TYPES.map((type) => (
              <PieceCell
                key={`b-${type}`}
                piece={{ type, color: "b" }}
                selected={isErasing ? null : selected}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.turnRow}>
        <span className={styles.turnLabel}>Turn</span>
        <div className={styles.turnToggle} role="group" aria-label="Active side">
          <button
            className={`${styles.turnBtn} ${turn === "w" ? styles.turnActive : ""}`}
            onClick={() => onSetTurn("w")}
            aria-pressed={turn === "w"}
          >
            White
          </button>
          <button
            className={`${styles.turnBtn} ${turn === "b" ? styles.turnActive : ""}`}
            onClick={() => onSetTurn("b")}
            aria-pressed={turn === "b"}
          >
            Black
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${isErasing ? styles.eraseActive : ""}`}
          onClick={onToggleErase}
          aria-pressed={isErasing}
        >
          {isErasing ? "Stop erasing" : "Erase piece"}
        </button>
        <button className={styles.actionBtn} onClick={onClear}>
          Clear board
        </button>
        <button className={styles.actionBtn} onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}