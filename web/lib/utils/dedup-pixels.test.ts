import { describe, expect, test } from "vitest";
import { Pixel, pixelSchema } from "../pixel";
import { dedupPixels } from "./dedup-pixels";

describe("dedup pixels", () => {
  test("happy path", () => {
    const arr: Pixel[] = [
      pixelSchema.parse({ x: 1, y: 1, colorRef: 1 }),
      pixelSchema.parse({ x: 1, y: 1, colorRef: 0 }),
    ];

    expect(dedupPixels(arr)).toEqual([]);
  });
});
