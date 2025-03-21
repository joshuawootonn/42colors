import { CANVAS_PIXEL_RATIO, ZOOM_DEFAULT } from "../constants";

/**
 * @param {number} clientX or clientY - A pixel from the clients viewport
 * @returns {number} x or y - The cooresponding pixel from the canvas
 */
export function clientToCanvasConversion(
  clientX: number,
  zoom: number,
): number {
  const pixelDensity = zoom / (ZOOM_DEFAULT / CANVAS_PIXEL_RATIO);
  return Math.round(clientX / pixelDensity);
}

export function canvasToClientConversion(
  canvasX: number,
  zoom: number,
): number {
  const pixelDensity = zoom / (ZOOM_DEFAULT / CANVAS_PIXEL_RATIO);
  return Math.round(canvasX * pixelDensity);
}
