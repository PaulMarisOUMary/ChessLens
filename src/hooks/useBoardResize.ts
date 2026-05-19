import { useState, useEffect } from "react";
import {
  BOARD_DEFAULT_WIDTH,
  BOARD_MAX_WIDTH,
  BOARD_MIN_WIDTH,
  MOBILE_BREAKPOINT,
} from "../constants";

export function useBoardResize(): { boardWidth: number; isMobile: boolean } {
  const [boardWidth, setBoardWidth] = useState(BOARD_DEFAULT_WIDTH);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) {
        setBoardWidth(Math.min(window.innerWidth, window.innerHeight * 0.65));
      } else {
        setBoardWidth(
          Math.min(
            BOARD_MAX_WIDTH,
            Math.max(BOARD_MIN_WIDTH, window.innerHeight - 48),
          ),
        );
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { boardWidth, isMobile };
}