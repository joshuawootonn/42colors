import { z } from "zod";
import { CHUNK_LENGTH } from "./constants";
import { COLOR_TABLE } from "./palette";
import { Pixel, pixelSchema } from "./pixel";
import { dedupe } from "./utils/dedupe";

export type Chunk = {
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  pixels: Pixel[];
  renderConditions: {
    zoom: number;
  };
};

export type ChunkCanvases = Record<string, Chunk>;

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
 * Redraw pixels in their respective chunks
 */
export function unsetChunkPixels(
  chunkCanvases: ChunkCanvases,
  pixels: Pixel[],
) {
  const chunkKeys = [];
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    chunkKeys.push(getChunkKey(pixel.x, pixel.y));
  }
  const uniqueChunkKeys = dedupe(chunkKeys);
  for (let i = 0; i < uniqueChunkKeys.length; i++) {
    const chunk = chunkCanvases[uniqueChunkKeys[i]];
    drawToChunkCanvas(chunk.element, chunk.context, chunk.pixels);
  }
}

/**
 * Clear pixels on chunk that are defined in realtime or local work
 */
export function clearChunkPixels(
  chunkCanvases: ChunkCanvases,
  pixels: Pixel[],
) {
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
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
