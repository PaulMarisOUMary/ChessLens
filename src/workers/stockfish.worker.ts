import type { WorkerInMessage, WorkerOutMessage } from "../types";

const STOCKFISH_PATH = "/stockfish/stockfish-18-lite-single.js";

type EngineState =
  | "uninitialized"
  | "initializing"
  | "idle"
  | "analysing"
  | "stopping";

let engine: Worker | null = null;
let state: EngineState = "uninitialized";
let currentLabel = "";

let pendingAnalysis: { fen: string; depth: number; moveLabel: string } | null =
  null;

function send(msg: WorkerOutMessage) {
  self.postMessage(msg);
}

function startAnalysis(fen: string, depth: number, moveLabel: string) {
  if (!engine || state !== "idle") return;
  currentLabel = moveLabel;
  state = "analysing";
  engine.postMessage(`position fen ${fen}`);
  engine.postMessage(`go depth ${depth}`);
}

function handleBestmove() {
  state = "idle";
  send({ type: "bestmove", moveLabel: currentLabel });

  if (pendingAnalysis) {
    const { fen, depth, moveLabel } = pendingAnalysis;
    pendingAnalysis = null;
    startAnalysis(fen, depth, moveLabel);
  }
}

function stopCurrent() {
  if (!engine) return;
  if (state === "analysing") {
    state = "stopping";
    engine.postMessage("stop");
    setTimeout(() => {
      if (state === "stopping") {
        state = "idle";
        if (pendingAnalysis) {
          const { fen, depth, moveLabel } = pendingAnalysis;
          pendingAnalysis = null;
          startAnalysis(fen, depth, moveLabel);
        }
      }
    }, 500);
  }
}

function initEngine() {
  state = "initializing";
  engine = new Worker(STOCKFISH_PATH);

  engine.onmessage = ({ data }: MessageEvent<string>) => {
    const line = data;

    if (line === "uciok") {
      engine?.postMessage("isready");
      return;
    }

    if (line === "readyok") {
      state = "idle";
      send({ type: "ready" });
      return;
    }

    if (line.startsWith("info") && line.includes("score")) {
      const mateMatch = line.match(/score mate (-?\d+)/);
      if (mateMatch) {
        const mateIn = parseInt(mateMatch[1]);
        send({
          type: "score",
          moveLabel: currentLabel,
          score: mateIn > 0 ? 9999 : -9999,
          isMate: true,
          mateIn,
        });
        return;
      }

      const cpMatch = line.match(/score cp (-?\d+)/);
      if (cpMatch) {
        send({
          type: "score",
          moveLabel: currentLabel,
          score: parseInt(cpMatch[1]),
          isMate: false,
          mateIn: null,
        });
      }
    }

    if (line.startsWith("bestmove")) {
      handleBestmove();
    }
  };

  engine.postMessage("uci");
}

self.onmessage = ({ data }: MessageEvent<WorkerInMessage>) => {
  switch (data.type) {
    case "analyse":
      if (state === "idle") {
        startAnalysis(data.fen, data.depth, data.moveLabel);
      } else if (state === "analysing" || state === "stopping") {
        pendingAnalysis = {
          fen: data.fen,
          depth: data.depth,
          moveLabel: data.moveLabel,
        };
        if (state === "analysing") stopCurrent();
      }
      break;

    case "stop":
      pendingAnalysis = null;
      stopCurrent();
      break;

    case "quit":
      pendingAnalysis = null;
      engine?.postMessage("quit");
      engine?.terminate();
      engine = null;
      state = "uninitialized";
      break;
  }
};

initEngine();