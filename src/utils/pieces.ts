import { defaultPieces } from "react-chessboard";
import type React from "react";
import type { ChessPieceKey } from "../types";

type PieceSvgComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const pieces = defaultPieces as Record<string, PieceSvgComponent>;

export function getPieceSvg(key: ChessPieceKey): PieceSvgComponent | null {
  return pieces[key] ?? null;
}