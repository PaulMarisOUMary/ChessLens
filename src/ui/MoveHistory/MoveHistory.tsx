import { memo, useEffect, useRef, createElement } from "react";
import type { HistoryEntry, ChessPieceKey } from "../../types";
import { getPieceSvg } from "../../utils/pieces";
import styles from "./MoveHistory.module.scss";

export interface MoveHistoryProps {
  history: HistoryEntry[];
  activePly: number;
  isRewinding: boolean;
  onGoToPly: (ply: number) => void;
}

function getPieceKey(entry: HistoryEntry): ChessPieceKey | null {
  const { san, side } = entry;
  if (!san) return null;
  let type: string;
  if (san.startsWith("O-O")) {
    type = "K";
  } else {
    const first = san[0];
    type = first >= "A" && first <= "Z" ? first : "P";
  }
  return `${side}${type}` as ChessPieceKey;
}

interface MoveCellProps {
  entry: HistoryEntry | undefined;
  ply: number;
  activePly: number;
  onGoToPly: (ply: number) => void;
}

function MoveCell({ entry, ply, activePly, onGoToPly }: MoveCellProps) {
  const isActive = activePly === ply;
  const PieceSvg = entry ? getPieceSvg(getPieceKey(entry)!) : null;

  return (
    <button
      className={`${styles.moveBtn} ${isActive ? styles.active : ""}`}
      onClick={() => entry && onGoToPly(ply)}
      disabled={!entry}
      aria-label={entry ? `Go to move ${entry.san}` : undefined}
      aria-current={isActive ? "true" : undefined}
    >
      {entry ? (
        <>
          {PieceSvg && (
            <span className={styles.pieceIcon} aria-hidden="true">
              {createElement(PieceSvg)}
            </span>
          )}
          <span className={styles.san}>{entry.san}</span>
        </>
      ) : (
        <span className={styles.san}>…</span>
      )}
    </button>
  );
}

export const MoveHistory = memo(function MoveHistory({
  history,
  activePly,
  isRewinding,
  onGoToPly,
}: MoveHistoryProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRewinding) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [history.length, isRewinding]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span />
        <span className={styles.colLabel}>White</span>
        <span className={styles.colLabel}>Black</span>
      </div>
      <div className={styles.list} role="list" aria-label="Move history">
        {history.length === 0 && (
          <span className={styles.empty}>No moves yet</span>
        )}
        {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => {
          const whitePly = i * 2 + 1;
          const blackPly = i * 2 + 2;
          return (
            <div key={whitePly} className={styles.moveRow} role="listitem">
              <span className={styles.moveNumber}>{i + 1}.</span>
              <MoveCell
                entry={history[i * 2]}
                ply={whitePly}
                activePly={activePly}
                onGoToPly={onGoToPly}
              />
              <MoveCell
                entry={history[i * 2 + 1]}
                ply={blackPly}
                activePly={activePly}
                onGoToPly={onGoToPly}
              />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
});