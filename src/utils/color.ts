export function scoreToColor(normalized: number, alpha: number): string {
  const n = Math.max(0, Math.min(1, normalized));
  let r: number, g: number, b: number;

  if (n < 0.5) {
    const t = n / 0.5;
    r = 220;
    g = Math.round(t * 160);
    b = 0;
  } else {
    const t = (n - 0.5) / 0.5;
    r = Math.round(220 * (1 - t));
    g = 180;
    b = 0;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const MATE_GOOD_COLOR = (alpha: number) =>
  `rgba(139, 92, 246, ${alpha})`;
export const MATE_BAD_COLOR = (alpha: number) => `rgba(220, 20,  60, ${alpha})`;