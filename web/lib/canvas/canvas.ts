import z from "zod";

import { Camera, ZoomMultiplier, getZoomMultiplier } from "../camera";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { AbsolutePointTuple, absolutePointTupleSchema } from "../line";
import { getFullsizeHeight, getFullsizeWidth } from "./fullsize";

const pixelSizeSchema = z.number().brand<"PixelSize">();
export type PixelSize = z.infer<typeof pixelSizeSchema>;

export function getPixelSize(zoomMultiplier: ZoomMultiplier): PixelSize {
  return pixelSizeSchema.parse(CANVAS_PIXEL_RATIO * zoomMultiplier);
}

/**
 * Calculates a size that maintains consistent screen appearance regardless of zoom level.
 * When zoomed out, world-unit sizes need to be larger to appear the same on screen.
 *
 * @param baseSize - The size in world units at default zoom (zoomMultiplier = 1)
 * @param zoomMultiplier - Current zoom multiplier
 * @param minSize - Minimum size to prevent elements from getting too small when zoomed in
 * @param maxSize - Maximum size to prevent elements from getting too large when zoomed out
 */
export function getZoomIndependentSize(
  baseSize: number,
  zoomMultiplier: ZoomMultiplier,
  minSize: number = baseSize * 0.5,
  maxSize: number = baseSize * 4,
): number {
  const scaledSize = baseSize / zoomMultiplier;
  return Math.min(maxSize, Math.max(minSize, scaledSize));
}

export function getSizeInPixels(length: number, pixelSize: PixelSize) {
  return length / pixelSize;
}

export function getSizeInPixelsPlusBleed(length: number, pixelSize: PixelSize) {
  return Math.ceil(length / pixelSize) + 1;
}

/**
 * Gets the center point of the camera view in absolute coordinates
 */
export function getCameraCenterPoint(camera: Camera): AbsolutePointTuple {
  const zoomMultiplier = getZoomMultiplier(camera);
  const pixelSize = getPixelSize(zoomMultiplier);

  const canvasWidth = getFullsizeWidth();
  const canvasHeight = getFullsizeHeight();

  const canvasPixelWidth = getSizeInPixels(canvasWidth, pixelSize);
  const canvasPixelHeight = getSizeInPixels(canvasHeight, pixelSize);

  const centerX = camera.x + Math.floor(canvasPixelWidth / 2);
  const centerY = camera.y + Math.floor(canvasPixelHeight / 2);

  return absolutePointTupleSchema.parse([centerX, centerY]);
}
