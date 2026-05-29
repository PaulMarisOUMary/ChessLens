import { useState, useCallback, useRef, useMemo } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { GameStatus, HistoryEntry, Side } from "../types";
import { INITIAL_FEN, getGameStatus, getLegalDestinations } from "../utils/fen";

export interface UseChessGame {
  fen: string;
  turn: Side;
  status: GameStatus;
  isGameOver: boolean;
  history: HistoryEntry[];
  activePly: number;
  isRewinding: boolean;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  getLegalMoves: (square: string) => string[];
  goToPly: (ply: number) => void;
  reset: () => void;
  loadFen: (fen: string) => boolean;
}

export function useChessGame(): UseChessGame {
  const gameRef = useRef(new Chess());

  const [fen, setFen] = useState(INITIAL_FEN);
  const [turn, setTurn] = useState<Side>("w");
  const [status, setStatus] = useState<GameStatus>("playing");
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activePly, setActivePly] = useState(0);

  const historyRef = useRef<HistoryEntry[]>([]);

  const isRewinding = activePly < history.length;

  const syncFromGame = useCallback((game: Chess) => {
    setFen(game.fen());
    setTurn(game.turn() as Side);
    setStatus(getGameStatus(game));
    setIsGameOver(game.isGameOver());
  }, []);

  const makeMove = useCallback(
    (from: string, to: string, promotion = "q"): boolean => {
      if (activePly < historyRef.current.length) return false;

      const game = gameRef.current;
      const prevTurn = game.turn() as Side;

      try {
        const result = game.move({
          from: from as Square,
          to: to as Square,
          promotion,
        });
        if (!result) return false;

        const entry: HistoryEntry = {
          fen: game.fen(),
          san: result.san,
          uci: `${from}${to}`,
          side: prevTurn,
          ply: historyRef.current.length + 1,
          capturedPiece: (result.captured as HistoryEntry["capturedPiece"]) ?? null,
        };

        const nextHistory = [...historyRef.current, entry];
        historyRef.current = nextHistory;
        setHistory(nextHistory);
        setActivePly(nextHistory.length);
        syncFromGame(game);
        return true;
      } catch {
        return false;
      }
    },
    [activePly, syncFromGame],
  );

  const getLegalMoves = useMemo(
    () =>
      (square: string): string[] =>
        getLegalDestinations(fen, square),
    [fen],
  );

  const goToPly = useCallback(
    (ply: number) => {
      const clamped = Math.max(0, Math.min(historyRef.current.length, ply));
      const targetFen =
        clamped === 0 ? INITIAL_FEN : historyRef.current[clamped - 1].fen;

      gameRef.current = new Chess(targetFen);
      setActivePly(clamped);
      syncFromGame(gameRef.current);
    },
    [syncFromGame],
  );

  const reset = useCallback(() => {
    gameRef.current = new Chess();
    historyRef.current = [];
    setHistory([]);
    setActivePly(0);
    syncFromGame(gameRef.current);
  }, [syncFromGame]);

  const loadFen = useCallback(
    (newFen: string): boolean => {
      let game: Chess;
      try {
        game = new Chess(newFen);
      } catch {
        try {
          game = new Chess();
          game.load(newFen, { skipValidation: true });
          if (import.meta.env.DEV) {
            console.warn(
              "[useChessGame] Loaded FEN with skipValidation — position may be invalid:",
              newFen,
            );
          }
        } catch {
          return false;
        }
      }
      gameRef.current = game;
      historyRef.current = [];
      setHistory([]);
      setActivePly(0);
      syncFromGame(game);
      return true;
    },
    [syncFromGame],
  );

  return {
    fen,
    turn,
    status,
    isGameOver,
    history,
    activePly,
    isRewinding,
    makeMove,
    getLegalMoves,
    goToPly,
    reset,
    loadFen,
  };
}