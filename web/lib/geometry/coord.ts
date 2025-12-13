import { z } from "zod";

import { cameraSchema } from "../camera";
import { colorRefSchema } from "../palette";

export const pixelSchema = z
  .object({ x: z.number(), y: z.number(), color_ref: colorRefSchema })
  .brand<"Pixel">();

export const pixelArraySchema = z.array(pixelSchema);

export type Pixel = z.infer<typeof pixelSchema>;

export function isSamePixel(a: Pixel, b: Pixel) {
  return a.x === b.x && a.y === b.y;
}

export function getLastPixelValue(pixels: Pixel[], pixel: Pixel): Pixel | null {
  return [...pixels].reverse().find((p) => isSamePixel(p, pixel)) ?? null;
}
export const cursorPositionSchema = z
  .object({ x: z.number(), y: z.number() })
  .brand<"CursorPosition">();

export const absolutePointSchema = z
  .object({ x: z.number(), y: z.number() })
  .brand<"Absolute Point">();

export const pointSchema = z
  .object({ x: z.number(), y: z.number(), camera: cameraSchema })
  .brand<"Point">();

export type Coord = { x: number; y: number };
export type CursorPosition = z.infer<typeof cursorPositionSchema>;
export type Point = z.infer<typeof pointSchema>;
export type AbsolutePoint = z.infer<typeof absolutePointSchema>;

export function coordSort(a: Coord, b: Coord) {
  return a.x === b.x ? a.y - b.y : a.x - b.x;
}
