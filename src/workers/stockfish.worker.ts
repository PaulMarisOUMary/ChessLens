import type { StockfishMessage, WorkerResponse } from "../types/stockfish";

const wasmPath = "/stockfish/stockfish-18-lite-single.js";

let stockfish: Worker | null = null;
let currentMoveLabel: string | null = null;

function initEngine() {
  stockfish = new Worker(wasmPath);

  stockfish.onmessage = (e: MessageEvent<string>) => {
    const line: string = e.data;
    const response = parseLine(line);
    if (response) {
      self.postMessage(response);
    }
  };

  stockfish.postMessage("uci");
  stockfish.postMessage("isready");
}

function parseLine(line: string): WorkerResponse | null {
  if (line === "uciok" || line === "readyok") {
    return { type: "ready" };
  }

  if (
    line.startsWith("info") &&
    line.includes("score") &&
    line.includes("depth")
  ) {
    const depthMatch = line.match(/depth (\d+)/);
    const cpMatch = line.match(/score cp (-?\d+)/);
    const mateMatch = line.match(/score mate (-?\d+)/);

    const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
    if (depth < 8) return null;

    if (mateMatch) {
      const mateIn = parseInt(mateMatch[1]);
      const score = mateIn > 0 ? 9999 : -9999;
      return {
        type: "score",
        move: "",
        score,
        moveLabel: currentMoveLabel ?? "",
      };
    }

    if (cpMatch) {
      const score = parseInt(cpMatch[1]);
      return {
        type: "score",
        move: "",
        score,
        moveLabel: currentMoveLabel ?? "",
      };
    }
  }

  if (line.startsWith("bestmove")) {
    const match = line.match(/bestmove ([a-h][1-8][a-h][1-8])/);
    const move = match ? match[1] : null;
    return { type: "bestmove", move, moveLabel: currentMoveLabel ?? "" };
  }

  return null;
}

self.onmessage = (e: MessageEvent<StockfishMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init":
      initEngine();
      break;

    case "analyse":
      if (!stockfish) return;
      currentMoveLabel = msg.moveLabel ?? null;
      stockfish.postMessage("stop");
      stockfish.postMessage(`position fen ${msg.fen}`);
      stockfish.postMessage(`go depth ${msg.depth ?? 12}`);
      break;

    case "stop":
      stockfish?.postMessage("stop");
      break;

    case "quit":
      stockfish?.postMessage("quit");
      stockfish?.terminate();
      stockfish = null;
      break;
  }
};

initEngine();