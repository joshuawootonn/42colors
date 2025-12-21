"use client";

import posthog from "posthog-js";
import { useEffect, useState } from "react";

import { FEATURE_FLAG_KEY, PaletteConfig, getPaletteConfig } from "./new-palette";

export { isNewPaletteEnabled, getPaletteConfig } from "./new-palette";
export type { PaletteConfig } from "./new-palette";

export function useNewPaletteEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const checkFlag = () => {
      const isEnabled = posthog.isFeatureEnabled(FEATURE_FLAG_KEY) ?? false;
      console.log("isEnabled", isEnabled);
      setEnabled(isEnabled);
    };

    checkFlag();

    // Re-check when feature flags are loaded
    posthog.onFeatureFlags(checkFlag);
  }, []);

  return enabled;
}

export function usePaletteConfig(): PaletteConfig {
  const useNewPalette = useNewPaletteEnabled();
  return getPaletteConfig(useNewPalette);
}
