import { z } from "zod";
import { CHUNK_LENGTH } from "./constants";
import { COLOR_TABLE } from "./palette";
import { Pixel, pixelSchema } from "./pixel";

export type ChunkCanvases = Record<
  string,
  {
    element: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    x: number;
    y: number;
    pixels: [];
    renderConditions: {
      zoom: number;
    };
  }
>;

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

/**
 * Clear pixels on chunk that are defined in realtime or local work
 */
export function clearChunkPixels(
  chunkCanvases: ChunkCanvases,
  pixels: Pixel[],
) {
  for (let index = 0; index < pixels.length; index++) {
    const p = pixels[index];
    const chunk = chunkCanvases[getChunkKey(p.x, p.y)];
    const chunkPixel = getChunkPixel(p);
    chunk.context.clearRect(chunkPixel.x, chunkPixel.y, 1, 1);
  }
}

export const chunkPixelSchema = pixelSchema.brand<"ChunkPixel">();
export type ChunkPixel = z.infer<typeof chunkPixelSchema>;

function getChunkPixel(pixel: Pixel): ChunkPixel {
  return chunkPixelSchema.parse({
    ...pixel,
    x: pixel.x - Math.floor(pixel.x / CHUNK_LENGTH),
    y: pixel.y - Math.floor(pixel.y / CHUNK_LENGTH),
    type: "chunk",
  });
}

export function getChunkKey(x: number, y: number) {
  const chunkX = Math.floor(x / CHUNK_LENGTH) * CHUNK_LENGTH;
  const chunkY = Math.floor(y / CHUNK_LENGTH) * CHUNK_LENGTH;
  return `x: ${chunkX} y: ${chunkY}`;
}
