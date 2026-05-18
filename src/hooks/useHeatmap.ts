import { useState, useRef, useCallback, useEffect } from "react";
import type { EngineStatus, MoveScore, Side } from "../types";
import { useStockfish } from "./useStockfish";
import { getLegalMoves, isCheckmate } from "../utils/fen";
import { normalizeScores } from "../utils/normalize";
import { Chess } from "chess.js";

interface UseHeatmap {
  moveScores: MoveScore[];
  globalScore: number | null;
  isReady: boolean;
  isAnalysing: boolean;
  engineStatus: EngineStatus;
  analyse: (fen: string, turn: Side, depth: number) => void;
  clear: () => void;
}

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

const GLOBAL_LABEL = "__global__";

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
        score: 9999,
        isMate: true,
        mateIn: 1,
      });
      setTimeout(() => processNextRef.current(), 0);
      return;
    }

    const labelToUse = item.type === "global" ? GLOBAL_LABEL : item.moveLabel!;
    engine.analyse(item.fen, item.depth, labelToUse);
  }, [engine]);

  useEffect(() => {
    processNextRef.current = processNext;
  }, [processNext]);

  const analyse = useCallback(
    (fen: string, _turn: Side, depth: number) => {
      if (!isReady) return;

      engine.stop();
      setMoveScores([]);

      const moves = getLegalMoves(fen);
      if (moves.length === 0) {
        setGlobalScore(null);
        return;
      }

      rawRef.current = new Map();

      const queue: QueueItem[] = [];

      queue.push({
        type: "global",
        fen,
        depth: depth + 2,
      });

      moves.forEach((m) => {
        const tmp = new Chess(fen);
        try {
          tmp.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
          queue.push({
            type: "move",
            moveLabel: `${m.from}${m.to}${m.promotion ?? ""}`,
            fen: tmp.fen(),
            depth,
            isImmediateMate: isCheckmate(tmp.fen()),
          });
        // eslint-disable-next-line no-empty
        } catch { }
      });

      queueRef.current = queue;
      setIsAnalysing(true);
      setEngineStatus("analysing");

      processNext();
    },
    [isReady, engine, processNext],
  );

  const clear = useCallback(() => {
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