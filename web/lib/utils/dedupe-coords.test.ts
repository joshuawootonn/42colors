import { describe, expect, test } from "vitest";
import { Pixel, pixelSchema, Point, pointSchema } from "../coord";
import { dedupeCoords } from "./dedupe-coords";

describe("dedupe pixels", () => {
  test("happy path", () => {
    const arr: Pixel[] = [
      pixelSchema.parse({ x: 1, y: 1, colorRef: 1 }),
      pixelSchema.parse({ x: 1, y: 1, colorRef: 0 }),
    ];

    expect(dedupeCoords(arr)).toEqual([
      pixelSchema.parse({ x: 1, y: 1, colorRef: 0 }),
    ]);
  });
});

describe("dedupe points", () => {
  test("happy path", () => {
    const arr: Point[] = [
      pointSchema.parse({ x: 1, y: 1, camera: { x: 0, y: 0, zoom: 100 } }),
      pointSchema.parse({ x: 1, y: 1, camera: { x: 0, y: 0, zoom: 100 } }),
    ];

    expect(dedupeCoords(arr)).toEqual([
      pointSchema.parse({ x: 1, y: 1, camera: { x: 0, y: 0, zoom: 100 } }),
    ]);
  });
});
