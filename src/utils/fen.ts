import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { Side, GameStatus } from "../types";

export const INITIAL_FEN = new Chess().fen();

function safeChess(fen: string): Chess {
  const game = new Chess();
  try {
    game.load(fen, { skipValidation: true });
  } catch {
    game.load(INITIAL_FEN);
  }
  return game;
}

export function isFenPlayable(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

export function getGameStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return "checkmate";
  if (game.isStalemate()) return "stalemate";
  if (game.isDraw()) return "draw";
  if (game.isCheck()) return "check";
  return "playing";
}

export function getTurn(fen: string): Side {
  return safeChess(fen).turn() as Side;
}

export function isCheckmate(fen: string): boolean {
  if (!isFenPlayable(fen)) return false;
  return new Chess(fen).isCheckmate();
}

export function getLegalDestinations(fen: string, square: string): string[] {
  if (!isFenPlayable(fen)) return [];
  const game = new Chess(fen);
  return game
    .moves({ square: square as Square, verbose: true })
    .map((m) => m.to);
}

export function getLegalMoves(
  fen: string,
): Array<{ from: string; to: string; san: string; promotion?: string }> {
  if (!isFenPlayable(fen)) return [];
  const game = new Chess(fen);
  return game.moves({ verbose: true }).map((m) => ({
    from: m.from,
    to: m.to,
    san: m.san,
    promotion: m.promotion,
  }));
}

export function isPromotionMove(
  fen: string,
  from: string,
  to: string,
): boolean {
  if (!isFenPlayable(fen)) return false;
  const game = new Chess(fen);
  const moves = game.moves({ square: from as Square, verbose: true });
  return moves.some((m) => m.to === to && m.flags.includes("p"));
}

export function sanitizeFen(fen: string): string {
  const parts = fen.split(" ");
  parts[2] = "-";
  parts[3] = "-";
  return parts.join(" ");
}

export function setFenTurn(fen: string, turn: "w" | "b"): string {
  const parts = fen.split(" ");
  parts[1] = turn;
  return parts.join(" ");
}