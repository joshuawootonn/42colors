import {
  CHUNK_RENDER_SCALE,
  CANVAS_PIXEL_RATIO,
  CHUNK_LENGTH,
} from "./constants";
import { Pixel } from "./pixel";

export function createChunkCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_PIXEL_RATIO * CHUNK_LENGTH * CHUNK_RENDER_SCALE;
  canvas.height = CANVAS_PIXEL_RATIO * CHUNK_LENGTH * CHUNK_RENDER_SCALE;
  return canvas;
}

export function drawToChunkCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  pixels: Pixel[],
): HTMLCanvasElement {
  context.imageSmoothingEnabled = false;
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    context.fillStyle = pixel.color;
    context.fillRect(
      pixel.x * CANVAS_PIXEL_RATIO * CHUNK_RENDER_SCALE,
      pixel.y * CANVAS_PIXEL_RATIO * CHUNK_RENDER_SCALE,
      CANVAS_PIXEL_RATIO * CHUNK_RENDER_SCALE,
      CANVAS_PIXEL_RATIO * CHUNK_RENDER_SCALE,
    );
  }

  return canvas;
}
