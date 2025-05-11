import { CHUNK_LENGTH } from "./constants";
import { COLOR_TABLE } from "./palette";
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
    context.fillStyle = COLOR_TABLE[pixel.colorRef];
    context.fillRect(pixel.x, pixel.y, 1, 1);
  }

  return canvas;
}

export function getChunkKey(x: number, y: number) {
  const chunkX = Math.floor(x / CHUNK_LENGTH) * CHUNK_LENGTH;
  const chunkY = Math.floor(y / CHUNK_LENGTH) * CHUNK_LENGTH;
  return `x: ${chunkX} y: ${chunkY}`;
}
