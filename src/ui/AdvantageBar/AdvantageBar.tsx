import { memo, createElement } from "react";
import type { Side } from "../../types";
import { getPieceSvg } from "../../utils/pieces";
import {
  ADVANTAGE_MATE_THRESHOLD,
  ADVANTAGE_ATAN_SCALE,
} from "../../constants";
import styles from "./AdvantageBar.module.scss";

const WhitePawn = getPieceSvg("wP");
const BlackPawn = getPieceSvg("bP");

export interface AdvantageBarProps {
  score: number | null;
  isAnalysing: boolean;
  turn: Side;
}

export const AdvantageBar = memo(function AdvantageBar({
  score,
  isAnalysing,
  turn,
}: AdvantageBarProps) {
  const absoluteScore = score !== null ? (turn === "w" ? score : -score) : null;

  let whitePercent = 50;
  let label = "—";

  if (absoluteScore !== null) {
    if (absoluteScore >= ADVANTAGE_MATE_THRESHOLD) {
      whitePercent = 100;
      label = "M+";
    } else if (absoluteScore <= -ADVANTAGE_MATE_THRESHOLD) {
      whitePercent = 0;
      label = "M-";
    } else {
      whitePercent =
        50 +
        50 * (2 / Math.PI) * Math.atan(absoluteScore / ADVANTAGE_ATAN_SCALE);
      const pawns = absoluteScore / 100;
      label = pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
    }
  }

  return (
    <div className={styles.advantageBar}>
      <span className={styles.pawnIcon} aria-hidden="true">
        {WhitePawn && createElement(WhitePawn)}
      </span>

      <div
        className={styles.barTrack}
        role="meter"
        aria-label="Position advantage"
        aria-valuenow={Math.round(whitePercent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.barFill} style={{ width: `${whitePercent}%` }} />
        {isAnalysing && <div className={styles.barScan} />}
      </div>

      <span className={`${styles.pawnIcon} ${styles.darkPawn}`} aria-hidden="true">
        {BlackPawn && createElement(BlackPawn)}
      </span>

      <span className={styles.advantageScore}>{label}</span>
    </div>
  );
});