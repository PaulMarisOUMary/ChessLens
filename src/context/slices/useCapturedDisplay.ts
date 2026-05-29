import { useMemo } from "react";
import { computeCapturedPieces } from "../../utils/captures";
import { CAPTURE_STRIP_HEIGHT } from "../../constants";
import type { CapturedPieceEntry } from "../../types";
import type { UseChessGame } from "../../hooks/useChessGame";

export interface UseCapturedDisplay {
  topPieces: CapturedPieceEntry[];
  bottomPieces: CapturedPieceEntry[];
  topAdvantage: number;
  bottomAdvantage: number;
  columnHeight: number;
}

interface UseCapturedDisplayArgs {
  chess: UseChessGame;
  boardWidth: number;
  isFlipped: boolean;
  isEditMode: boolean;
}

export function useCapturedDisplay({
  chess,
  boardWidth,
  isFlipped,
  isEditMode,
}: UseCapturedDisplayArgs): UseCapturedDisplay {
  const { byWhite, byBlack, advantage } = useMemo(
    () => computeCapturedPieces(chess.history, chess.activePly),
    [chess.history, chess.activePly],
  );

  const topPieces    = isFlipped ? byBlack : byWhite;
  const bottomPieces = isFlipped ? byWhite : byBlack;

  const abs = Math.abs(advantage);
  const whiteAhead = advantage > 0;
  const topAdvantage    = (whiteAhead !== isFlipped) ? abs : 0;
  const bottomAdvantage = (whiteAhead === isFlipped) ? abs : 0;

  const columnHeight = isEditMode
    ? boardWidth
    : boardWidth + CAPTURE_STRIP_HEIGHT * 2;

  return { topPieces, bottomPieces, topAdvantage, bottomAdvantage, columnHeight };
}