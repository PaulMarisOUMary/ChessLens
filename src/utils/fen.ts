import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { Side, GameStatus } from "../types";

export const INITIAL_FEN = new Chess().fen();

export function getGameStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return "checkmate";
  if (game.isStalemate()) return "stalemate";
  if (game.isDraw()) return "draw";
  if (game.isCheck()) return "check";
  return "playing";
}

export function getLegalDestinations(fen: string, square: string): string[] {
  const game = new Chess(fen);
  const moves = game.moves({ square: square as Square, verbose: true });
  return moves.map((m) => m.to);
}

export function getLegalMoves(
  fen: string,
): Array<{ from: string; to: string; san: string; promotion?: string }> {
  const game = new Chess(fen);
  return game.moves({ verbose: true }).map((m) => ({
    from: m.from,
    to: m.to,
    san: m.san,
    promotion: m.promotion,
  }));
}

export function isCheckmate(fen: string): boolean {
  return new Chess(fen).isCheckmate();
}

export function getTurn(fen: string): Side {
  return new Chess(fen).turn() as Side;
}