import { useContext } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue } from "./BoardContext.types";

export function useBoardContext(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoardContext must be used within <BoardProvider>");
  return ctx;
}
