import { memo } from "react";
import type { EngineStatus } from "../../types";
import styles from "./EngineStatusBar.module.scss";

export interface EngineStatusBarProps {
  status: EngineStatus;
}

const STATUS_LABELS: Record<EngineStatus, string> = {
  loading: "Loading engine...",
  ready: "Engine ready",
  analysing: "Engine analysing...",
  error: "Engine error",
};

export const EngineStatusBar = memo(function EngineStatusBar({
  status,
}: EngineStatusBarProps) {
  return (
    <div className={styles.row}>
      <span className={`${styles.dot} ${styles[status]}`} />
      <span className={styles.label}>{STATUS_LABELS[status]}</span>
    </div>
  );
});