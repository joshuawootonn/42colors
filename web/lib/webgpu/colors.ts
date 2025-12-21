import { isNewPaletteEnabled } from "../new-palette";
import { COLOR_TABLE, ColorRef, V2_COLOR_TABLE, mapV1ToV2ColorRef } from "../palette";

export type Color = [number, number, number, number];

export const BLUE: Color = [0, 0, 1, 1];
export const BLACK: Color = [0, 0, 0, 1];
export const WHITE: Color = [1, 1, 1, 1];
export const LIGHT_GRAY: Color = [0.9, 0.9, 0.9, 1];
export const GRAY_800: Color = [0.8, 0.8, 0.8, 1];
export const DARK_RED: Color = [0.8, 0, 0, 1]; // Darker red for outline
export const CLAIMER_YELLOW: Color = [246 / 255, 240 / 255, 74 / 255, 1];

export function hexToRgbaColor(hex: string): Color {
  // Remove # if present
  hex = hex.replace("#", "");

  // Handle 'transparent' case
  if (hex === "transparent") {
    return [0, 0, 0, 0];
  }

  // Parse hex color
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return [r, g, b, 1];
}

export function getColorFromRef(colorRef: number, useNewPalette?: boolean): Color {
  const shouldUseNewPalette = useNewPalette ?? isNewPaletteEnabled();

  if (shouldUseNewPalette) {
    const v2Ref = mapV1ToV2ColorRef(colorRef as ColorRef);
    const colorHex = V2_COLOR_TABLE[v2Ref as keyof typeof V2_COLOR_TABLE];
    return hexToRgbaColor(colorHex);
  }

  const colorHex = COLOR_TABLE[colorRef as keyof typeof COLOR_TABLE];
  return hexToRgbaColor(colorHex);
}
