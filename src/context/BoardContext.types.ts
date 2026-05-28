import type { UseChessGame } from "../hooks/useChessGame";
import type { UseHeatmap } from "../hooks/useHeatmap";
import type { UseSettings } from "../hooks/useSettings";
import type { UseEditMode } from "../hooks/useEditMode";
import type { ChessPieceKey, HeatmapMode, PromotionPiece } from "../types";

export interface PendingPromotion {
  from: string;
  to: string;
}

export interface BoardContextValue {
  chess: UseChessGame;
  heatmap: UseHeatmap;
  settingsApi: UseSettings;
  edit: UseEditMode;

  boardWidth: number;
  isMobile: boolean;

  isFlipped: boolean;
  selectedSquare: string | null;
  pendingPromotion: PendingPromotion | null;
  editDragSource: string | null;

  boardCursorStyle: string;

  displayScores: UseHeatmap["moveScores"];
  showHeatmap: boolean;
  heatmapMode: HeatmapMode;

  flipBoard: () => void;
  toggleEditMode: () => void;
  onDrop: (args: {
    piece: { isSparePiece?: boolean };
    sourceSquare: string;
    targetSquare: string | null;
  }) => boolean;
  onSquareClick: (args: { square: string; piece?: ChessPieceKey }) => void;
  onPromotionSelect: (piece: PromotionPiece | null) => void;
  handleClearBoard: () => void;
  handleResetBoard: () => void;
  handleSetTurn: (turn: "w" | "b") => void;
}