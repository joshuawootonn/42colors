import { describe, expect, test } from "vitest";
import { AbsolutePoint, absolutePointSchema, coordSort } from "../coord";
import { getBrushPoints } from "./brush";

const arr: AbsolutePoint[] = [
  absolutePointSchema.parse({ x: 1, y: 1 }),
  absolutePointSchema.parse({ x: 2, y: 2 }),
];

describe("brush", () => {
  test("brush size 1", () => {
    expect(getBrushPoints(arr, 1, 1).sort(coordSort)).toEqual(
      [
        absolutePointSchema.parse({ x: 1, y: 1 }),
        absolutePointSchema.parse({ x: 2, y: 2 }),
      ].sort(coordSort),
    );
  });
  test("brush size 2", () => {
    expect(getBrushPoints(arr, 2, 1).sort(coordSort)).toEqual(
      [
        absolutePointSchema.parse({ x: 0, y: 0 }),
        absolutePointSchema.parse({ x: 0, y: 1 }),
        absolutePointSchema.parse({ x: 1, y: 0 }),
        absolutePointSchema.parse({ x: 1, y: 1 }),
        absolutePointSchema.parse({ x: 1, y: 2 }),
        absolutePointSchema.parse({ x: 2, y: 1 }),
        absolutePointSchema.parse({ x: 2, y: 2 }),
      ].sort(coordSort),
    );
  });
  test("brush size 3", () => {
    expect(getBrushPoints(arr, 3, 1).sort(coordSort)).toEqual(
      [
        absolutePointSchema.parse({ x: 0, y: 1 }),
        absolutePointSchema.parse({ x: 1, y: 0 }),
        absolutePointSchema.parse({ x: 1, y: 1 }),
        absolutePointSchema.parse({ x: 2, y: 1 }),
        absolutePointSchema.parse({ x: 1, y: 2 }),
        absolutePointSchema.parse({ x: 2, y: 2 }),
        absolutePointSchema.parse({ x: 2, y: 3 }),
        absolutePointSchema.parse({ x: 3, y: 2 }),
      ].sort(coordSort),
    );
  });
  test("brush size 4", () => {
    expect(getBrushPoints(arr, 4, 1).sort(coordSort)).toEqual(
      [
        absolutePointSchema.parse({ x: -1, y: 0 }),
        absolutePointSchema.parse({ x: -1, y: 1 }),
        absolutePointSchema.parse({ x: 0, y: -1 }),
        absolutePointSchema.parse({ x: 0, y: 0 }),
        absolutePointSchema.parse({ x: 0, y: 1 }),
        absolutePointSchema.parse({ x: 0, y: 2 }),
        absolutePointSchema.parse({ x: 1, y: -1 }),
        absolutePointSchema.parse({ x: 1, y: 0 }),
        absolutePointSchema.parse({ x: 1, y: 1 }),
        absolutePointSchema.parse({ x: 1, y: 2 }),
        absolutePointSchema.parse({ x: 1, y: 3 }),
        absolutePointSchema.parse({ x: 2, y: 0 }),
        absolutePointSchema.parse({ x: 2, y: 1 }),
        absolutePointSchema.parse({ x: 2, y: 2 }),
        absolutePointSchema.parse({ x: 2, y: 3 }),
        absolutePointSchema.parse({ x: 3, y: 1 }),
        absolutePointSchema.parse({ x: 3, y: 2 }),
      ].sort(coordSort),
    );
  });
  test("brush size 5", () => {
    expect(getBrushPoints(arr, 5, 1).sort(coordSort)).toEqual(
      [
        absolutePointSchema.parse({ x: -1, y: 0 }),
        absolutePointSchema.parse({ x: -1, y: 1 }),
        absolutePointSchema.parse({ x: -1, y: 2 }),
        absolutePointSchema.parse({ x: 0, y: -1 }),
        absolutePointSchema.parse({ x: 0, y: 0 }),
        absolutePointSchema.parse({ x: 0, y: 1 }),
        absolutePointSchema.parse({ x: 0, y: 2 }),
        absolutePointSchema.parse({ x: 0, y: 3 }),
        absolutePointSchema.parse({ x: 1, y: -1 }),
        absolutePointSchema.parse({ x: 1, y: 0 }),
        absolutePointSchema.parse({ x: 1, y: 1 }),
        absolutePointSchema.parse({ x: 1, y: 2 }),
        absolutePointSchema.parse({ x: 1, y: 3 }),
        absolutePointSchema.parse({ x: 1, y: 4 }),
        absolutePointSchema.parse({ x: 2, y: -1 }),
        absolutePointSchema.parse({ x: 2, y: 0 }),
        absolutePointSchema.parse({ x: 2, y: 1 }),
        absolutePointSchema.parse({ x: 2, y: 2 }),
        absolutePointSchema.parse({ x: 2, y: 3 }),
        absolutePointSchema.parse({ x: 2, y: 4 }),
        absolutePointSchema.parse({ x: 3, y: 0 }),
        absolutePointSchema.parse({ x: 3, y: 1 }),
        absolutePointSchema.parse({ x: 3, y: 2 }),
        absolutePointSchema.parse({ x: 3, y: 3 }),
        absolutePointSchema.parse({ x: 3, y: 4 }),
        absolutePointSchema.parse({ x: 4, y: 1 }),
        absolutePointSchema.parse({ x: 4, y: 2 }),
        absolutePointSchema.parse({ x: 4, y: 3 }),
      ].sort(coordSort),
    );
  });
});
