import { memo } from "react";
import type { Settings } from "../../types";
import { DEPTH_MIN, DEPTH_MAX } from "../../constants";
import styles from "./SettingsPanel.module.scss";

export interface SettingsPanelProps {
  settings: Settings;
  displayDepth: number;
  isFlipped: boolean;
  isEditMode: boolean;
  onSetDepth: (v: number) => void;
  onSetHeatmapEnabled: (v: boolean) => void;
  onSetHeatmapOpacity: (v: number) => void;
  onFlipBoard: () => void;
  onToggleEditMode: () => void;
}

export const SettingsPanel = memo(function SettingsPanel({
  settings,
  displayDepth,
  isFlipped,
  isEditMode,
  onSetDepth,
  onSetHeatmapEnabled,
  onSetHeatmapOpacity,
  onFlipBoard,
  onToggleEditMode,
}: SettingsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>Heatmap</span>
        <button
          className={`${styles.toggle} ${settings.heatmapEnabled ? styles.on : ""}`}
          onClick={() => onSetHeatmapEnabled(!settings.heatmapEnabled)}
          aria-pressed={settings.heatmapEnabled}
        >
          {settings.heatmapEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>
          Depth <em>{displayDepth}</em>
        </span>
        <input
          type="range"
          min={DEPTH_MIN}
          max={DEPTH_MAX}
          step={1}
          value={displayDepth}
          className={styles.slider}
          onChange={(e) => onSetDepth(Number(e.target.value))}
          aria-label="Analysis depth"
        />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>
          Opacity <em>{Math.round(settings.heatmapOpacity * 100)}%</em>
        </span>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={Math.round(settings.heatmapOpacity * 100)}
          className={styles.slider}
          onChange={(e) => onSetHeatmapOpacity(Number(e.target.value) / 100)}
          aria-label="Heatmap opacity"
        />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Orientation</span>
        <button
          className={`${styles.toggle} ${isFlipped ? styles.on : ""}`}
          onClick={onFlipBoard}
          aria-pressed={isFlipped}
        >
          {isFlipped ? "BLACK" : "WHITE"}
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Edit board</span>
        <button
          className={`${styles.toggle} ${isEditMode ? styles.on : ""}`}
          onClick={onToggleEditMode}
          aria-pressed={isEditMode}
        >
          {isEditMode ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
});