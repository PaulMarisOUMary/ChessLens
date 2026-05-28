import { useState, useRef, useCallback, useEffect } from "react";
import type { EngineStatus, MoveScore } from "../types";
import { useStockfish } from "./useStockfish";
import { getLegalMoves } from "../utils/fen";
import { normalizeScores } from "../utils/score";
import { buildAnalysisQueue, type QueueItem } from "../utils/analysis";
import { MATE_SENTINEL_CP } from "../constants";

const GLOBAL_LABEL = "__global__";

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
  analyse: (fen: string, depth: number) => void;
  clear: () => void;
}

export function useHeatmap(): UseHeatmap {
  const [moveScores, setMoveScores] = useState<MoveScore[]>([]);
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("loading");
  const [isAnalysing, setIsAnalysing] = useState(false);

  const isReady = engineStatus === "ready" || engineStatus === "analysing";

  const queueRef = useRef<QueueItem[]>([]);
  const rawRef = useRef<Map<string, RawScore>>(new Map());
  const isMounted = useRef<boolean>(true);

  const processNextRef = useRef<() => void>(() => {});

  const pendingRequestRef = useRef<PendingRequest | null>(null);

  const onReady = useCallback(() => {
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

  const onError = useCallback((message: string) => {
    if (import.meta.env.DEV) {
      console.error("[useHeatmap] Stockfish error:", message);
    }
    setEngineStatus("error");
  }, []);

  const engine = useStockfish({
    onReady,
    onScore,
    onBestmove: () => processNextRef.current(),
    onError,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processNext = useCallback(() => {
    if (!isMounted.current) return;

    if (pendingRequestRef.current) {
      const { fen, depth } = pendingRequestRef.current;
      pendingRequestRef.current = null;

      rawRef.current = new Map();
      const queue = buildAnalysisQueue(fen, depth);

      if (queue.length === 0) {
        const moves = getLegalMoves(fen);
        if (moves.length === 0) {
          setGlobalScore(null);
          setMoveScores([]);
          setIsAnalysing(false);
          setEngineStatus("ready");
          return;
        }
      }

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
    (fen: string, depth: number) => {
      if (!isReady) return;

      if (isAnalysing) {
        pendingRequestRef.current = { fen, depth };
        setMoveScores([]);
        engine.stop();
        return;
      }

      rawRef.current = new Map();
      setMoveScores([]);

      const queue = buildAnalysisQueue(fen, depth);
      if (queue.length === 0) {
        setGlobalScore(null);
        return;
      }

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