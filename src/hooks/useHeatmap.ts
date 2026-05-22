import { useState, useRef, useCallback, useEffect } from "react";
import type { EngineStatus, MoveScore, Side } from "../types";
import { useStockfish } from "./useStockfish";
import { getLegalMoves, isCheckmate } from "../utils/fen";
import { normalizeScores } from "../utils/score";
import { Chess } from "chess.js";
import { MATE_SENTINEL_CP, GLOBAL_DEPTH_BONUS } from "../constants";

const GLOBAL_LABEL = "__global__";

interface QueueItem {
  type: "global" | "move";
  moveLabel?: string;
  fen: string;
  depth: number;
  isImmediateMate?: boolean;
}

interface RawScore {
  score: number;
  isMate: boolean;
  mateIn: number | null;
}

interface PendingRequest {
  fen: string;
  depth: number;
}

export interface UseHeatmap {
  moveScores: MoveScore[];
  globalScore: number | null;
  isReady: boolean;
  isAnalysing: boolean;
  engineStatus: EngineStatus;
  analyse: (fen: string, turn: Side, depth: number) => void;
  clear: () => void;
}

export function useHeatmap(): UseHeatmap {
  const [moveScores, setMoveScores] = useState<MoveScore[]>([]);
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("loading");

  const queueRef = useRef<QueueItem[]>([]);
  const rawRef = useRef<Map<string, RawScore>>(new Map());
  const isMounted = useRef<boolean>(true);
  const processNextRef = useRef<() => void>(() => {});
  const pendingRequestRef = useRef<PendingRequest | null>(null);

  const onReady = useCallback(() => {
    setIsReady(true);
    setEngineStatus("ready");
  }, []);

  const onScore = useCallback(
    (label: string, score: number, isMate: boolean, mateIn: number | null) => {
      if (label === GLOBAL_LABEL) {
        setGlobalScore(score);
        return;
      }
      rawRef.current.set(label, {
        score: -score,
        isMate,
        mateIn: mateIn !== null ? -mateIn : null,
      });
    },
    [],
  );

  const engine = useStockfish({
    onReady,
    onScore,
    onBestmove: () => processNextRef.current(),
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      engine.stop();
    };
  }, [engine]);

  const processNext = useCallback(() => {
    if (!isMounted.current) return;

    if (pendingRequestRef.current) {
      const { fen, depth } = pendingRequestRef.current;
      pendingRequestRef.current = null;

      rawRef.current = new Map();
      const moves = getLegalMoves(fen);

      if (moves.length === 0) {
        setGlobalScore(null);
        setMoveScores([]);
        setIsAnalysing(false);
        setEngineStatus("ready");
        return;
      }

      const queue: QueueItem[] = [
        { type: "global", fen, depth: depth + GLOBAL_DEPTH_BONUS },
        ...moves.flatMap((m): QueueItem[] => {
          const tmp = new Chess(fen);
          try {
            tmp.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
            return [
              {
                type: "move",
                moveLabel: `${m.from}${m.to}${m.promotion ?? ""}`,
                fen: tmp.fen(),
                depth,
                isImmediateMate: isCheckmate(tmp.fen()),
              },
            ];
          } catch {
            return [];
          }
        }),
      ];

      queueRef.current = queue;
      setIsAnalysing(true);
      setEngineStatus("analysing");
    }

    const item = queueRef.current.shift();

    if (!item) {
      const raw = Array.from(rawRef.current.entries()).map(([move, data]) => ({
        move,
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        ...data,
      }));
      setMoveScores(normalizeScores(raw));
      setIsAnalysing(false);
      setEngineStatus("ready");
      return;
    }

    if (item.type === "move" && item.isImmediateMate) {
      rawRef.current.set(item.moveLabel!, {
        score: MATE_SENTINEL_CP,
        isMate: true,
        mateIn: 1,
      });
      setTimeout(() => processNextRef.current(), 0);
      return;
    }

    const label = item.type === "global" ? GLOBAL_LABEL : item.moveLabel!;
    engine.analyse(item.fen, item.depth, label);
  }, [engine]);

  useEffect(() => {
    processNextRef.current = processNext;
  }, [processNext]);

  const analyse = useCallback(
    (fen: string, _turn: Side, depth: number) => {
      if (!isReady) return;

      if (isAnalysing) {
        pendingRequestRef.current = { fen, depth };
        setMoveScores([]);
        engine.stop();
        return;
      }

      rawRef.current = new Map();
      setMoveScores([]);

      const moves = getLegalMoves(fen);
      if (moves.length === 0) {
        setGlobalScore(null);
        return;
      }

      const queue: QueueItem[] = [
        { type: "global", fen, depth: depth + GLOBAL_DEPTH_BONUS },
        ...moves.flatMap((m): QueueItem[] => {
          const tmp = new Chess(fen);
          try {
            tmp.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
            return [
              {
                type: "move",
                moveLabel: `${m.from}${m.to}${m.promotion ?? ""}`,
                fen: tmp.fen(),
                depth,
                isImmediateMate: isCheckmate(tmp.fen()),
              },
            ];
          } catch {
            return [];
          }
        }),
      ];

      queueRef.current = queue;
      setIsAnalysing(true);
      setEngineStatus("analysing");
      processNext();
    },
    [isReady, isAnalysing, engine, processNext],
  );

  const clear = useCallback(() => {
    pendingRequestRef.current = null;
    engine.stop();
    queueRef.current = [];
    rawRef.current = new Map();
    setMoveScores([]);
    setGlobalScore(null);
    setIsAnalysing(false);
    setEngineStatus("ready");
  }, [engine]);

  return {
    moveScores,
    globalScore,
    isReady,
    engineStatus,
    isAnalysing,
    analyse,
    clear,
  };
}