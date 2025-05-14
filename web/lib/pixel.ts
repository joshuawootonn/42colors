import { z } from "zod";
import { colorRefSchema } from "./palette";
import { Chunk, ChunkCanvases } from "./chunk";
import { Action } from "./actions";
export const pixelSchema = z
  .object({ x: z.number(), y: z.number(), colorRef: colorRefSchema })
  .brand<"Pixel">();

export type Pixel = z.infer<typeof pixelSchema>;

export function isSamePixel(a: Pixel, b: Pixel) {
  return a.x === b.x && a.y === b.y;
}

export function getLastPixelValue(pixels: Pixel[], pixel: Pixel): Pixel | null {
  return [...pixels].reverse().find((p) => isSamePixel(p, pixel)) ?? null;
}
