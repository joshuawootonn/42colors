import posthog from "posthog-js";

import {
  BLACK_REF,
  COLOR_ORDER,
  COLOR_TABLE,
  ColorRef,
  TRANSPARENT_REF,
  V2_BLACK_REF,
  V2_COLOR_ORDER,
  V2_COLOR_TABLE,
  V2_TRANSPARENT_REF,
  V2_WHITE_REF,
  V2ColorRef,
  WHITE_REF,
  getNextColor,
  getNextV2Color,
  getPreviousColor,
  getPreviousV2Color,
  mapV1ToV2ColorRef,
} from "./palette";

export const FEATURE_FLAG_KEY = "use-new-color-palette";

export function isNewPaletteEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return posthog.isFeatureEnabled(FEATURE_FLAG_KEY) ?? false;
}

export type PaletteConfig = {
  colorTable: typeof COLOR_TABLE | typeof V2_COLOR_TABLE;
  colorOrder: ColorRef[] | V2ColorRef[];
  transparentRef: number;
  blackRef: number;
  whiteRef: number;
  getNextColor: (ref: number) => number;
  getPreviousColor: (ref: number) => number;
  getColorHex: (colorRef: number) => string;
};

export function getPaletteConfig(useNewPalette: boolean): PaletteConfig {
  if (useNewPalette) {
    return {
      colorTable: V2_COLOR_TABLE,
      colorOrder: V2_COLOR_ORDER,
      transparentRef: V2_TRANSPARENT_REF,
      blackRef: V2_BLACK_REF,
      whiteRef: V2_WHITE_REF,
      getNextColor: getNextV2Color as (ref: number) => number,
      getPreviousColor: getPreviousV2Color as (ref: number) => number,
      getColorHex: (colorRef: number) => {
        const v2Ref = mapV1ToV2ColorRef(colorRef as ColorRef);
        return V2_COLOR_TABLE[v2Ref as keyof typeof V2_COLOR_TABLE];
      },
    };
  }

  return {
    colorTable: COLOR_TABLE,
    colorOrder: COLOR_ORDER,
    transparentRef: TRANSPARENT_REF,
    blackRef: BLACK_REF,
    whiteRef: WHITE_REF,
    getNextColor: getNextColor as (ref: number) => number,
    getPreviousColor: getPreviousColor as (ref: number) => number,
    getColorHex: (colorRef: number) => COLOR_TABLE[colorRef as keyof typeof COLOR_TABLE],
  };
}
