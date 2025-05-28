import { describe, test, expect } from "vitest";
import { absolutePointTupleSchema } from "./line";
import {
  sortIntoClockwiseOrder,
  inside,
  rectToPolygonSchema,
  isEligiblePolygon,
  isIneligiblePolygon,
} from "./polygon";
import { rectSchema } from "./rect";
import {
  rect1,
  rect2,
  rect3,
  rect4,
  rect5,
  rect6,
  rect7,
} from "./rectilinear.test";
import { bunchOfTuplePointsSchema } from "./utils/testing";

const sortedPoints = bunchOfTuplePointsSchema.parse([
  [-1, 1],
  [-1, -1],
  [1, -1],
  [1, 1],
]);

const scrambledPoints = bunchOfTuplePointsSchema.parse([
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
]);

const scrambledPositivePoints = bunchOfTuplePointsSchema.parse([
  [15, 5],
  [5, 15],
  [10, 5],
  [0, 0],
  [10, 0],
  [15, 15],
  [0, 10],
  [5, 10],
]);

const sortedPositivePoints = bunchOfTuplePointsSchema.parse([
  [5, 15],
  [5, 10],
  [0, 10],
  [0, 0],
  [10, 0],
  [10, 5],
  [15, 5],
  [15, 15],
]);

describe("sortIntoClockwiseOrder", () => {
  test("already sorted", () => {
    expect(sortIntoClockwiseOrder(sortedPoints)).toEqual(sortedPoints);
  });
  test("sorting needed", () => {
    expect(sortIntoClockwiseOrder(scrambledPoints)).toEqual(sortedPoints);
  });
  test("sorted all positive points", () => {
    expect(sortIntoClockwiseOrder(scrambledPositivePoints)).toEqual(
      sortedPositivePoints,
    );
  });
});

describe("inside", () => {
  test("no", () => {
    expect(
      inside(absolutePointTupleSchema.parse([20, 20]), polygon1),
    ).toBeFalsy();
  });
  test("yes", () => {
    expect(
      inside(absolutePointTupleSchema.parse([5, 5]), polygon1),
    ).toBeTruthy();
  });
});

const polygon1 = rectToPolygonSchema.parse(rect1);
const polygon2 = rectToPolygonSchema.parse(rect2);
const polygon3 = rectToPolygonSchema.parse(rect3);
const polygon4 = rectToPolygonSchema.parse(rect4);
const polygon5 = rectToPolygonSchema.parse(rect5);
const polygon6 = rectToPolygonSchema.parse(rect6);
const polygon7 = rectToPolygonSchema.parse(rect7);

export const rect8 = rectSchema.parse({
  origin: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
});
const polygon8 = rectToPolygonSchema.parse(rect8);

export const rect9 = rectSchema.parse({
  origin: { x: 0, y: 0 },
  target: { x: 10, y: 0 },
});
const polygon9 = rectToPolygonSchema.parse(rect9);

describe("isEligiblePolygon", () => {
  test("happy", () => {
    expect(isEligiblePolygon(polygon1)).toBeTruthy();
    expect(isEligiblePolygon(polygon2)).toBeTruthy();
    expect(isEligiblePolygon(polygon3)).toBeTruthy();
    expect(isEligiblePolygon(polygon4)).toBeTruthy();
    expect(isEligiblePolygon(polygon5)).toBeTruthy();
    expect(isEligiblePolygon(polygon6)).toBeTruthy();
    expect(isEligiblePolygon(polygon7)).toBeTruthy();
  });

  test("point", () => {
    expect(isEligiblePolygon(polygon8)).toBeFalsy();
  });

  test("line", () => {
    expect(isEligiblePolygon(polygon9)).toBeFalsy();
  });
});

describe("isIneligiblePolygon", () => {
  test("happy", () => {
    expect(isIneligiblePolygon(polygon1)).toBeFalsy();
    expect(isIneligiblePolygon(polygon2)).toBeFalsy();
    expect(isIneligiblePolygon(polygon3)).toBeFalsy();
    expect(isIneligiblePolygon(polygon4)).toBeFalsy();
    expect(isIneligiblePolygon(polygon5)).toBeFalsy();
    expect(isIneligiblePolygon(polygon6)).toBeFalsy();
    expect(isIneligiblePolygon(polygon7)).toBeFalsy();
  });

  test("point", () => {
    expect(isIneligiblePolygon(polygon8)).toBeTruthy();
  });

  test("line", () => {
    expect(isIneligiblePolygon(polygon9)).toBeTruthy();
  });
});
