import { CHUNK_LENGTH } from "./constants";
import { Pixel } from "./pixel";

export function createChunkCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CHUNK_LENGTH;
  canvas.height = CHUNK_LENGTH;
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
    context.fillRect(pixel.x, pixel.y, 1, 1);
  }

  return canvas;
}
