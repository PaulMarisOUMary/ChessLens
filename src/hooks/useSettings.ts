import { useState, useCallback, useRef } from "react";
import type { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

interface UseSettings {
  settings: Settings;
  displayDepth: number;
  setDepth: (v: number) => void;
  setHeatmapEnabled: (v: boolean) => void;
  setHeatmapOpacity: (v: number) => void;
}

export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [displayDepth, setDisplayDepth] = useState(DEFAULT_SETTINGS.depth);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDepth = useCallback((v: number) => {
    const clamped = Math.min(18, Math.max(1, v));
    setDisplayDepth(clamped);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSettings((s) => ({ ...s, depth: clamped }));
    }, 800);
  }, []);

  const setHeatmapEnabled = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, heatmapEnabled: v }));
  }, []);

  const setHeatmapOpacity = useCallback((v: number) => {
    setSettings((s) => ({
      ...s,
      heatmapOpacity: Math.min(1, Math.max(0.1, v)),
    }));
  }, []);

  return {
    settings,
    displayDepth,
    setDepth,
    setHeatmapEnabled,
    setHeatmapOpacity,
  };
}