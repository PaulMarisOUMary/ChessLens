import { useState, useCallback, useRef, useEffect } from "react";
import type { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";
import {
  DEPTH_MIN,
  DEPTH_MAX,
  DEPTH_DEBOUNCE_MS,
  HEATMAP_OPACITY_MIN,
  HEATMAP_OPACITY_MAX,
} from "../constants";

export interface UseSettings {
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const setDepth = useCallback((v: number) => {
    const clamped = Math.min(DEPTH_MAX, Math.max(DEPTH_MIN, v));
    setDisplayDepth(clamped);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSettings((s) => ({ ...s, depth: clamped }));
    }, DEPTH_DEBOUNCE_MS);
  }, []);

  const setHeatmapEnabled = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, heatmapEnabled: v }));
  }, []);

  const setHeatmapOpacity = useCallback((v: number) => {
    setSettings((s) => ({
      ...s,
      heatmapOpacity: Math.min(
        HEATMAP_OPACITY_MAX,
        Math.max(HEATMAP_OPACITY_MIN, v),
      ),
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