import styles from "./RewindControls.module.scss";

export interface RewindControlsProps {
  activePly: number;
  historyLength: number;
  onGoToPly: (ply: number) => void;
  onReset: () => void;
}

export function RewindControls({
  activePly,
  historyLength,
  onGoToPly,
  onReset,
}: RewindControlsProps) {
  const atStart = activePly === 0;
  const atEnd = activePly >= historyLength;

  return (
    <div className={styles.row}>
      <button
        className={styles.btn}
        onClick={() => onGoToPly(0)}
        disabled={atStart}
        title="Start"
        aria-label="Go to start"
      >
        ⏮
      </button>
      <button
        className={styles.btn}
        onClick={() => onGoToPly(activePly - 1)}
        disabled={atStart}
        title="Previous"
        aria-label="Previous move"
      >
        ◀
      </button>
      <button
        className={styles.btn}
        onClick={() => onGoToPly(activePly + 1)}
        disabled={atEnd}
        title="Next"
        aria-label="Next move"
      >
        ▶
      </button>
      <button
        className={styles.btn}
        onClick={() => onGoToPly(historyLength)}
        disabled={atEnd}
        title="End"
        aria-label="Go to end"
      >
        ⏭
      </button>
      <button
        className={styles.resetBtn}
        onClick={onReset}
        title="New game"
        aria-label="New game"
      >
        ↺
      </button>
    </div>
  );
}