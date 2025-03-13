import { CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from "./constants";
import { Pixel } from "./pixel";

export function createChunkCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_PIXEL_RATIO * CHUNK_LENGTH;
  canvas.height = CANVAS_PIXEL_RATIO * CHUNK_LENGTH;
  return canvas;
}

export function drawToChunkCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  pixels: Pixel[],
): HTMLCanvasElement {
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    context.fillStyle = pixel.color;
    context.fillRect(
      pixel.x * CANVAS_PIXEL_RATIO,
      pixel.y * CANVAS_PIXEL_RATIO,
      CANVAS_PIXEL_RATIO,
      CANVAS_PIXEL_RATIO,
    );
  }

  return canvas;
}
