import { createContext } from "react";
import type { BoardContextValue } from "./BoardContext.types";

export const BoardContext = createContext<BoardContextValue | null>(null);
