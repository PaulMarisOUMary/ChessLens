import type {
  HistoryEntry,
  GameStatus,
  Settings,
  EngineStatus,
  Side,
} from "../../types";
import { formatGameStatusLabel } from "../../utils/fen";
import { AdvantageBar } from "../AdvantageBar/AdvantageBar";
import { MoveHistory } from "../MoveHistory/MoveHistory";
import { RewindControls } from "../RewindControls/RewindControls";
import { EngineStatusBar } from "../EngineStatusBar/EngineStatusBar";
import { SettingsPanel } from "../SettingsPanel/SettingsPanel";
import styles from "./SidePanel.module.scss";

export interface SidePanelProps {
  history: HistoryEntry[];
  activePly: number;
  isRewinding: boolean;
  globalScore: number | null;
  isAnalysing: boolean;
  engineStatus: EngineStatus;
  settings: Settings;
  isGameOver: boolean;
  status: GameStatus;
  turn: Side;
  boardHeight: number;
  displayDepth: number;
  isFlipped: boolean;
  isEditMode: boolean;
  selectedSquare: string | null;
  onGoToPly: (ply: number) => void;
  onReset: () => void;
  onSetDepth: (v: number) => void;
  onSetHeatmapEnabled: (v: boolean) => void;
  onSetHeatmapOpacity: (v: number) => void;
  onFlipBoard: () => void;
  onToggleEditMode: () => void;
}

export function SidePanel({
  history,
  activePly,
  isRewinding,
  globalScore,
  isAnalysing,
  engineStatus,
  settings,
  status,
  turn,
  boardHeight,
  displayDepth,
  isFlipped,
  isEditMode,
  onGoToPly,
  onReset,
  onSetDepth,
  onSetHeatmapEnabled,
  onSetHeatmapOpacity,
  onFlipBoard,
  onToggleEditMode,
}: SidePanelProps) {
  return (
    <aside className={styles.panel} style={{ height: boardHeight }}>
      <div className={styles.statusRow}>
        <span
          className={`${styles.statusDot} ${isEditMode ? styles.edit : styles[status]}`}
          aria-hidden="true"
        />
        <span
          className={`${styles.statusText} ${isEditMode ? styles.edit : styles[status]}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {formatGameStatusLabel(status, turn, isEditMode)}
        </span>
        {isRewinding && !isEditMode && (
          <span className={styles.rewindBadge}>rewind</span>
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Advantage</p>
        <AdvantageBar
          score={globalScore}
          isAnalysing={isAnalysing}
          turn={turn}
        />
      </div>

      <div className={styles.historySection}>
        <p className={styles.sectionTitle}>Moves</p>
        <MoveHistory
          history={history}
          activePly={activePly}
          isRewinding={isRewinding}
          onGoToPly={onGoToPly}
        />
      </div>

      <div className={styles.section}>
        <RewindControls
          activePly={activePly}
          historyLength={history.length}
          onGoToPly={onGoToPly}
          onReset={onReset}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.settingsHeader}>
          <p className={styles.sectionTitle}>Settings</p>
          <EngineStatusBar status={engineStatus} />
        </div>
        <SettingsPanel
          settings={settings}
          displayDepth={displayDepth}
          isFlipped={isFlipped}
          isEditMode={isEditMode}
          onSetDepth={onSetDepth}
          onSetHeatmapEnabled={onSetHeatmapEnabled}
          onSetHeatmapOpacity={onSetHeatmapOpacity}
          onFlipBoard={onFlipBoard}
          onToggleEditMode={onToggleEditMode}
        />
      </div>
    </aside>
  );
}