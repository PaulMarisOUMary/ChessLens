import { useEffect, useRef, useCallback } from "react";
import type { WorkerInMessage, WorkerOutMessage } from "../types";

type ScoreHandler = (
  moveLabel: string,
  score: number,
  isMate: boolean,
  mateIn: number | null,
) => void;
type BestmoveHandler = (moveLabel: string) => void;
type ReadyHandler = () => void;

interface UseStockfish {
  analyse: (fen: string, depth: number, moveLabel: string) => void;
  stop: () => void;
}

interface Options {
  onReady: ReadyHandler;
  onScore: ScoreHandler;
  onBestmove: BestmoveHandler;
}

export function useStockfish({
  onReady,
  onScore,
  onBestmove,
}: Options): UseStockfish {
  const workerRef = useRef<Worker | null>(null);
  const onReadyRef = useRef(onReady);
  const onScoreRef = useRef(onScore);
  const onBestmoveRef = useRef(onBestmove);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);
  useEffect(() => {
    onBestmoveRef.current = onBestmove;
  }, [onBestmove]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/stockfish.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = ({ data }: MessageEvent<WorkerOutMessage>) => {
      switch (data.type) {
        case "ready":
          onReadyRef.current();
          break;
        case "score":
          onScoreRef.current(
            data.moveLabel,
            data.score,
            data.isMate,
            data.mateIn,
          );
          break;
        case "bestmove":
          onBestmoveRef.current(data.moveLabel);
          break;
      }
    };

    workerRef.current = worker;

    return () => {
      worker.postMessage({ type: "quit" } satisfies WorkerInMessage);
      worker.terminate();
    };
  }, []);

  const analyse = useCallback(
    (fen: string, depth: number, moveLabel: string) => {
      workerRef.current?.postMessage({
        type: "analyse",
        fen,
        depth,
        moveLabel,
      } satisfies WorkerInMessage);
    },
    [],
  );

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" } satisfies WorkerInMessage);
  }, []);

  return { analyse, stop };
}