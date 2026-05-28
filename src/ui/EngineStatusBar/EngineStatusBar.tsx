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
    <div className={styles.row} aria-live="polite" aria-atomic="true">
      <span className={`${styles.dot} ${styles[status]}`} aria-hidden="true" />
      <span className={styles.label}>{STATUS_LABELS[status]}</span>
    </div>
  );
});