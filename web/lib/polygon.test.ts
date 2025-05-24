import { describe, expect, test } from "vitest";
import { bunchOfPointsSchema } from "./utils/testing";
import { sortIntoClockwiseOrder } from "./polygon";

const sortedPoints = bunchOfPointsSchema.parse([
  { x: -1, y: 1 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
]);

const scrambledPoints = bunchOfPointsSchema.parse([
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
]);

const scrambledPositivePoints = bunchOfPointsSchema.parse([
  {
    x: 15,
    y: 5,
  },
  {
    x: 5,
    y: 15,
  },
  {
    x: 10,
    y: 5,
  },
  {
    x: 0,
    y: 0,
  },
  {
    x: 10,
    y: 0,
  },
  {
    x: 15,
    y: 15,
  },
  {
    x: 0,
    y: 10,
  },
  {
    x: 5,
    y: 10,
  },
]);

const sortedPositivePoints = bunchOfPointsSchema.parse([
  {
    x: 5,
    y: 15,
  },
  {
    x: 5,
    y: 10,
  },
  {
    x: 0,
    y: 10,
  },
  {
    x: 0,
    y: 0,
  },
  {
    x: 10,
    y: 0,
  },
  {
    x: 10,
    y: 5,
  },
  {
    x: 15,
    y: 5,
  },
  {
    x: 15,
    y: 15,
  },
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
