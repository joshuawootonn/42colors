import { z } from "zod";
import { CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from "../constants";
import { COLOR_TABLE } from "../palette";
import { Coord, Pixel, pixelSchema } from "../geometry/coord";
import { dedupe } from "../utils/dedupe";
import { Plot } from "../tools/claimer.rest";
import { Camera, getZoomMultiplier } from "../camera";
import {
  redrawPolygonToUIChunkCanvas,
} from "../tools/claimer";
import { getPixelSize } from "./realtime";

export type Chunk = {
  x: number;
  y: number;
  pixels: Pixel[];
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  plots: Plot[];
  elementUI: HTMLCanvasElement;
  contextUI: CanvasRenderingContext2D;
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

export function createUIChunkCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CHUNK_LENGTH * CANVAS_PIXEL_RATIO;
  canvas.height = CHUNK_LENGTH * CANVAS_PIXEL_RATIO;
  return canvas;
}

export function drawPixelsToChunkCanvas(
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

export function drawPlotsToUIChunkCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  plots: Plot[],
  camera: Camera,
): HTMLCanvasElement {
  context.imageSmoothingEnabled = false;

  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    const polygon = plot.polygon;
    context.fillStyle = "rgba(0,0,0,0)";
    context.strokeStyle = "rgba(0,0,0,1)";

    console.log(polygon);

    redrawPolygonToUIChunkCanvas(context, polygon, 5, {
      containsMatchingEndpoints: true,
    });
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
    drawPixelsToChunkCanvas(chunk.element, chunk.context, chunk.pixels);
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
    const chunkOrigin = getChunkOrigin(p.x, p.y);
    const chunk = chunkCanvases[getChunkKey(p.x, p.y)];
    const chunkPixel = getChunkPixel(chunkOrigin, p);

    chunk.context.clearRect(chunkPixel.x, chunkPixel.y, 1, 1);
  }
}

export const chunkPixelSchema = pixelSchema.brand<"ChunkPixel">();
export type ChunkPixel = z.infer<typeof chunkPixelSchema>;

function getChunkPixel(chunkOrigin: Coord, pixel: Pixel): ChunkPixel {
  return {
    x: pixel.x - chunkOrigin.x,
    y: pixel.y - chunkOrigin.y,
    colorRef: pixel.colorRef,
  } as ChunkPixel;
}

export function getChunkOrigin(x: number, y: number): Coord {
  const chunkX = Math.floor(x / CHUNK_LENGTH) * CHUNK_LENGTH;
  const chunkY = Math.floor(y / CHUNK_LENGTH) * CHUNK_LENGTH;
  return { x: chunkX, y: chunkY };
}

export function getChunkKey(x: number, y: number): string {
  const chunkOrigin = getChunkOrigin(x, y);
  return `x: ${chunkOrigin.x} y: ${chunkOrigin.y}`;
}
