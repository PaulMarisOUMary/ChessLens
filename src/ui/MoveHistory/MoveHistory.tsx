import { memo, useEffect, useRef } from "react";
import type { HistoryEntry } from "../../types";
import styles from "./MoveHistory.module.scss";

export interface MoveHistoryProps {
  history: HistoryEntry[];
  activePly: number;
  isRewinding: boolean;
  onGoToPly: (ply: number) => void;
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
      <div className={styles.list}>
        {history.length === 0 && (
          <span className={styles.empty}>No moves yet</span>
        )}
        {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => {
          const white = history[i * 2];
          const black = history[i * 2 + 1];
          const whitePly = i * 2 + 1;
          const blackPly = i * 2 + 2;
          return (
            <div key={i} className={styles.moveRow}>
              <span className={styles.moveNumber}>{i + 1}.</span>
              <button
                className={`${styles.moveBtn} ${activePly === whitePly ? styles.active : ""}`}
                onClick={() => onGoToPly(whitePly)}
              >
                {white?.san ?? ""}
              </button>
              <button
                className={`${styles.moveBtn} ${activePly === blackPly ? styles.active : ""}`}
                onClick={() => onGoToPly(blackPly)}
                disabled={!black}
              >
                {black?.san ?? "…"}
              </button>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
});