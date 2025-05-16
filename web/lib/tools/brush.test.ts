import { describe, expect, test } from "vitest";
import { coordSort, Point } from "../coord";
import { pointSchema } from "../coord";
import { getBrushPoints } from "./brush";

const camera = { x: 0, y: 0, zoom: 100 };

const arr: Point[] = [
  pointSchema.parse({ x: 1, y: 1, camera }),
  pointSchema.parse({ x: 2, y: 2, camera }),
];

describe("brush", () => {
  test("brush size 1", () => {
    expect(getBrushPoints(arr, 1, 1).sort(coordSort)).toEqual(
      [
        pointSchema.parse({ x: 1, y: 1, camera }),
        pointSchema.parse({ x: 2, y: 2, camera }),
      ].sort(coordSort),
    );
  });
  test("brush size 2", () => {
    expect(getBrushPoints(arr, 2, 1).sort(coordSort)).toEqual(
      [
        pointSchema.parse({ x: 0, y: 0, camera }),
        pointSchema.parse({ x: 0, y: 1, camera }),
        pointSchema.parse({ x: 1, y: 0, camera }),
        pointSchema.parse({ x: 1, y: 1, camera }),
        pointSchema.parse({ x: 1, y: 2, camera }),
        pointSchema.parse({ x: 2, y: 1, camera }),
        pointSchema.parse({ x: 2, y: 2, camera }),
      ].sort(coordSort),
    );
  });
  test("brush size 3", () => {
    expect(getBrushPoints(arr, 3, 1).sort(coordSort)).toEqual(
      [
        pointSchema.parse({ x: 0, y: 1, camera }),
        pointSchema.parse({ x: 1, y: 0, camera }),
        pointSchema.parse({ x: 1, y: 1, camera }),
        pointSchema.parse({ x: 2, y: 1, camera }),
        pointSchema.parse({ x: 1, y: 2, camera }),
        pointSchema.parse({ x: 2, y: 2, camera }),
        pointSchema.parse({ x: 2, y: 3, camera }),
        pointSchema.parse({ x: 3, y: 2, camera }),
      ].sort(coordSort),
    );
  });
  test("brush size 4", () => {
    expect(getBrushPoints(arr, 4, 1).sort(coordSort)).toEqual(
      [
        pointSchema.parse({ x: -1, y: 0, camera }),
        pointSchema.parse({ x: -1, y: 1, camera }),
        pointSchema.parse({ x: 0, y: -1, camera }),
        pointSchema.parse({ x: 0, y: 0, camera }),
        pointSchema.parse({ x: 0, y: 1, camera }),
        pointSchema.parse({ x: 0, y: 2, camera }),
        pointSchema.parse({ x: 1, y: -1, camera }),
        pointSchema.parse({ x: 1, y: 0, camera }),
        pointSchema.parse({ x: 1, y: 1, camera }),
        pointSchema.parse({ x: 1, y: 2, camera }),
        pointSchema.parse({ x: 1, y: 3, camera }),
        pointSchema.parse({ x: 2, y: 0, camera }),
        pointSchema.parse({ x: 2, y: 1, camera }),
        pointSchema.parse({ x: 2, y: 2, camera }),
        pointSchema.parse({ x: 2, y: 3, camera }),
        pointSchema.parse({ x: 3, y: 1, camera }),
        pointSchema.parse({ x: 3, y: 2, camera }),
      ].sort(coordSort),
    );
  });
  test("brush size 5", () => {
    expect(getBrushPoints(arr, 5, 1).sort(coordSort)).toEqual(
      [
        pointSchema.parse({ x: -1, y: 0, camera }),
        pointSchema.parse({ x: -1, y: 1, camera }),
        pointSchema.parse({ x: -1, y: 2, camera }),
        pointSchema.parse({ x: 0, y: -1, camera }),
        pointSchema.parse({ x: 0, y: 0, camera }),
        pointSchema.parse({ x: 0, y: 1, camera }),
        pointSchema.parse({ x: 0, y: 2, camera }),
        pointSchema.parse({ x: 0, y: 3, camera }),
        pointSchema.parse({ x: 1, y: -1, camera }),
        pointSchema.parse({ x: 1, y: 0, camera }),
        pointSchema.parse({ x: 1, y: 1, camera }),
        pointSchema.parse({ x: 1, y: 2, camera }),
        pointSchema.parse({ x: 1, y: 3, camera }),
        pointSchema.parse({ x: 1, y: 4, camera }),
        pointSchema.parse({ x: 2, y: -1, camera }),
        pointSchema.parse({ x: 2, y: 0, camera }),
        pointSchema.parse({ x: 2, y: 1, camera }),
        pointSchema.parse({ x: 2, y: 2, camera }),
        pointSchema.parse({ x: 2, y: 3, camera }),
        pointSchema.parse({ x: 2, y: 4, camera }),
        pointSchema.parse({ x: 3, y: 0, camera }),
        pointSchema.parse({ x: 3, y: 1, camera }),
        pointSchema.parse({ x: 3, y: 2, camera }),
        pointSchema.parse({ x: 3, y: 3, camera }),
        pointSchema.parse({ x: 3, y: 4, camera }),
        pointSchema.parse({ x: 4, y: 1, camera }),
        pointSchema.parse({ x: 4, y: 2, camera }),
        pointSchema.parse({ x: 4, y: 3, camera }),
      ].sort(coordSort),
    );
  });
});
