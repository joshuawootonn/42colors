import { describe, expect, test } from "vitest";
import { rectSchema } from "./rect";
import {
  areRectsIntersecting,
  findRectilinearShapes,
  getIntersectionPoints,
} from "./rectilinear";
import { absolutePointSchema } from "./coord";

const rect1 = rectSchema.parse({
  origin: { x: 0, y: 0 },
  target: { x: 10, y: 10 },
});

const rect2 = rectSchema.parse({
  origin: { x: 10, y: 0 },
  target: { x: 20, y: 10 },
});
const rect3 = rectSchema.parse({
  origin: { x: 15, y: 0 },
  target: { x: 25, y: 10 },
});

const rect4 = rectSchema.parse({
  origin: { x: 20, y: 0 },
  target: { x: 30, y: 10 },
});
const rect5 = rectSchema.parse({
  origin: { x: 5, y: 5 },
  target: { x: 15, y: 15 },
});

describe("areRectsIntersecting", () => {
  test("no", () => {
    expect(areRectsIntersecting(rect1, rect3)).toBeFalsy();
  });

  test("touching", () => {
    expect(areRectsIntersecting(rect1, rect2)).toBeTruthy();
  });

  test("overlapping", () => {
    expect(areRectsIntersecting(rect2, rect3)).toBeTruthy();
  });
});

describe("findRectilinearShape", () => {
  test("no", () => {
    expect(findRectilinearShapes([rect1, rect3])).toEqual({
      rectilinearShapes: [],
      rects: [rect1, rect3],
    });
  });
  test.skip("touching", () => {
    expect(findRectilinearShapes([rect1, rect2])).toEqual({
      rectilinearShapes: [
        {
          //skip
          rects: [rect1, rect2],
          points: [rect1.origin, rect2.target],
        },
      ],
      rects: [],
    });
  });
});

describe("getIntersectionPoints", () => {
  test("no", () => {
    expect(getIntersectionPoints(rect1, rect3)).toEqual([]);
  });
  test("two points", () => {
    expect(getIntersectionPoints(rect1, rect5)).toEqual([
      absolutePointSchema.parse({ x: 10, y: 5 }),
      absolutePointSchema.parse({ x: 5, y: 10 }),
    ]);
  });
  test("many overlapping points", () => {
    expect(getIntersectionPoints(rect2, rect3)).toEqual([
      absolutePointSchema.parse({ x: 20, y: 0 }),
      absolutePointSchema.parse({ x: 20, y: 10 }),
      absolutePointSchema.parse({ x: 15, y: 0 }),
      absolutePointSchema.parse({ x: 15, y: 10 }),
    ]);
  });
});
