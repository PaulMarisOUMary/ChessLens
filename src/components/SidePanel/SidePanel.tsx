import { useEffect, useRef } from "react";
import type {
  HistoryEntry,
  GameStatus,
  Settings,
  EngineStatus,
  Side,
} from "../../types";
import styles from "./SidePanel.module.scss";

interface SidePanelProps {
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
  onGoToPly: (ply: number) => void;
  onReset: () => void;
  onSetDepth: (v: number) => void;
  onSetHeatmapEnabled: (v: boolean) => void;
  onSetHeatmapOpacity: (v: number) => void;
}

function statusLabel(status: GameStatus, turn: Side): string {
  const side = turn === "w" ? "White" : "Black";
  const other = turn === "w" ? "Black" : "White";
  switch (status) {
    case "checkmate":
      return `Checkmate | ${other} wins`;
    case "stalemate":
      return "Stalemate";
    case "draw":
      return "Draw";
    case "check":
      return `Check | ${side} to play`;
    case "playing":
      return `${side} to play`;
  }
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
  onGoToPly,
  onReset,
  onSetDepth,
  onSetHeatmapEnabled,
  onSetHeatmapOpacity,
}: SidePanelProps) {
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRewinding) {
      historyEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [history.length, isRewinding]);

  return (
    <aside className={styles.panel} style={{ height: boardHeight }}>
      <div className={styles.statusRow}>
        <span className={`${styles.statusDot} ${styles[status]}`} />
        <span className={`${styles.statusText} ${styles[status]}`}>
          {statusLabel(status, turn)}
        </span>
        {isRewinding && <span className={styles.rewindBadge}>rewind</span>}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Advantage</p>
        <AdvantageBar
          score={globalScore}
          isAnalysing={isAnalysing}
          turn={turn}
        />
      </div>

      <div
        className={styles.historySection}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p className={styles.sectionTitle}>Moves</p>
        <div className={styles.historyHeader}>
          <span />
          <span className={styles.colLabel}>White</span>
          <span className={styles.colLabel}>Black</span>
        </div>
        <div className={styles.historyList}>
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
          <div ref={historyEndRef} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.rewindControls}>
          <button
            className={styles.rewindBtn}
            onClick={() => onGoToPly(0)}
            disabled={activePly === 0}
            title="Start"
          >
            ⏮
          </button>
          <button
            className={styles.rewindBtn}
            onClick={() => onGoToPly(activePly - 1)}
            disabled={activePly === 0}
            title="Previous"
          >
            ◀
          </button>
          <button
            className={styles.rewindBtn}
            onClick={() => onGoToPly(activePly + 1)}
            disabled={activePly >= history.length}
            title="Next"
          >
            ▶
          </button>
          <button
            className={styles.rewindBtn}
            onClick={() => onGoToPly(history.length)}
            disabled={activePly >= history.length}
            title="End"
          >
            ⏭
          </button>
          <button
            className={styles.resetBtn}
            onClick={onReset}
            title="New game"
          >
            ↺
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.settingsHeader}>
          <p className={styles.sectionTitle}>Settings</p>

          <div className={styles.engineStatus}>
            <span className={`${styles.engineDot} ${styles[engineStatus]}`} />
            <span className={styles.engineLabel}>
              {engineStatus === "loading" && "Loading engine..."}
              {engineStatus === "ready" && "Engine ready"}
              {engineStatus === "analysing" && "Engine analysing..."}
              {engineStatus === "error" && "Engine error"}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>Heatmap</span>
          <button
            className={`${styles.toggle} ${settings.heatmapEnabled ? styles.on : ""}`}
            onClick={() => onSetHeatmapEnabled(!settings.heatmapEnabled)}
          >
            {settings.heatmapEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>
            Depth <em>{displayDepth}</em>
          </span>
          <input
            type="range"
            min={1}
            max={18}
            step={1}
            value={displayDepth}
            className={styles.slider}
            onChange={(e) => onSetDepth(Number(e.target.value))}
          />
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>
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
          />
        </div>
      </div>
    </aside>
  );
}

interface AdvantageBarProps {
  score: number | null;
  isAnalysing: boolean;
  turn: Side;
}

function AdvantageBar({ score, isAnalysing, turn }: AdvantageBarProps) {
  const absoluteScore = score !== null ? (turn === "w" ? score : -score) : null;

  let whitePercent = 50;
  let label = "—";

  if (absoluteScore !== null) {
    if (absoluteScore >= 9000) {
      whitePercent = 100;
      label = "M♙";
    } else if (absoluteScore <= -9000) {
      whitePercent = 0;
      label = "M♟";
    } else {
      whitePercent = 50 + 50 * (2 / Math.PI) * Math.atan(absoluteScore / 400);

      const evalInPawns = absoluteScore / 100;
      label =
        evalInPawns > 0 ? `+${evalInPawns.toFixed(1)}` : evalInPawns.toFixed(1);
    }
  }

  return (
    <div className={styles.advantageBar}>
      <span className={styles.pieceLabel}>♙</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${whitePercent}%` }} />
        {isAnalysing && <div className={styles.barScan} />}
      </div>
      <span className={styles.pieceLabel}>♟</span>
      <span className={styles.advantageScore}>{label}</span>
    </div>
  );
}