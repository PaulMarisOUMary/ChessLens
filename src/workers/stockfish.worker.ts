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

function send(msg: WorkerOutMessage): void {
  self.postMessage(msg);
}

function sendToEngine(cmd: string): void {
  engine?.postMessage(cmd);
}

function startAnalysis(fen: string, depth: number, moveLabel: string): void {
  if (!engine || state !== "idle") return;
  currentLabel = moveLabel;
  state = "analysing";
  sendToEngine(`position fen ${fen}`);
  sendToEngine(`go depth ${depth}`);
}

function handleBestmove(): void {
  state = "idle";
  send({ type: "bestmove", moveLabel: currentLabel });

  if (pendingAnalysis) {
    const next = pendingAnalysis;
    pendingAnalysis = null;
    startAnalysis(next.fen, next.depth, next.moveLabel);
  }
}

function stopCurrent(): void {
  if (!engine || state !== "analysing") return;
  state = "stopping";
  sendToEngine("stop");
  setTimeout(() => {
    if (state === "stopping") {
      state = "idle";
      if (pendingAnalysis) {
        const next = pendingAnalysis;
        pendingAnalysis = null;
        startAnalysis(next.fen, next.depth, next.moveLabel);
      }
    }
  }, 500);
}

function handleEngineLine(line: string): void {
  if (line === "uciok") {
    sendToEngine("isready");
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
      const mateIn = parseInt(mateMatch[1], 10);
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
        score: parseInt(cpMatch[1], 10),
        isMate: false,
        mateIn: null,
      });
    }
    return;
  }

  if (line.startsWith("bestmove")) {
    handleBestmove();
  }
}

function initEngine(): void {
  state = "initializing";
  engine = new Worker(STOCKFISH_PATH);
  engine.onmessage = ({ data }: MessageEvent<string>) => handleEngineLine(data);
  sendToEngine("uci");
}

self.onmessage = ({ data }: MessageEvent<WorkerInMessage>): void => {
  switch (data.type) {
    case "analyse": {
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
    }
    case "stop": {
      pendingAnalysis = null;
      stopCurrent();
      break;
    }
    case "quit": {
      pendingAnalysis = null;
      sendToEngine("quit");
      engine?.terminate();
      engine = null;
      state = "uninitialized";
      break;
    }
  }
};

initEngine();