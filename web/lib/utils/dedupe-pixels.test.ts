import { describe, expect, test } from "vitest";
import { Pixel, pixelSchema } from "../pixel";
import { dedupePixels } from "./dedupe-pixels";

describe("dedupe pixels", () => {
  test("happy path", () => {
    const arr: Pixel[] = [
      pixelSchema.parse({ x: 1, y: 1, colorRef: 1 }),
      pixelSchema.parse({ x: 1, y: 1, colorRef: 0 }),
    ];

    expect(dedupePixels(arr)).toEqual([
      pixelSchema.parse({ x: 1, y: 1, colorRef: 0 }),
    ]);
  });
});
