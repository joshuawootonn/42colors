import { describe, expect, test } from "vitest";
import { bunchOfPointsSchema } from "./utils/testing";
import {
  polygonSchema,
  rectToPolygonSchema,
  sortIntoClockwiseOrder,
} from "./polygon";
import { absolutePointSchema } from "./coord";
import { rectSchema } from "./rect";
import {
  getIntersectionPoints,
  inside,
  getCompositePolygon,
  getCompositePolygons,
} from "./rectilinear";
import { rect1, rect2, rect3, rect4, rect5 } from "./rectilinear.test";

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

const polygon1 = rectToPolygonSchema.parse(rect1);
const polygon2 = rectToPolygonSchema.parse(rect2);
const polygon3 = rectToPolygonSchema.parse(rect3);
const polygon4 = rectToPolygonSchema.parse(rect4);
const polygon5 = rectToPolygonSchema.parse(rect5);

describe("getIntersectionPoints", () => {
  test("no", () => {
    expect(getIntersectionPoints(polygon1, polygon3)).toEqual([]);
  });
  test("two points", () => {
    expect(getIntersectionPoints(polygon1, polygon5)).toEqual([
      absolutePointSchema.parse({ x: 10, y: 5 }),
      absolutePointSchema.parse({ x: 5, y: 10 }),
    ]);
  });
  test("many overlapping points", () => {
    expect(getIntersectionPoints(polygon2, polygon3)).toEqual([
      absolutePointSchema.parse({ x: 15, y: 0 }),
      absolutePointSchema.parse({ x: 20, y: 0 }),
      absolutePointSchema.parse({ x: 20, y: 10 }),
      absolutePointSchema.parse({ x: 15, y: 10 }),
    ]);
  });
});

describe("inside", () => {
  test("no", () => {
    expect(
      inside(absolutePointSchema.parse({ x: 20, y: 20 }), polygon1),
    ).toBeFalsy();
  });
  test("yes", () => {
    expect(
      inside(absolutePointSchema.parse({ x: 5, y: 5 }), polygon1),
    ).toBeTruthy();
  });
});

describe("getCompositePolygon", () => {
  test("no", () => {
    expect(getCompositePolygon(polygon1, polygon5)).toEqual(
      polygonSchema.parse({
        vertices: [
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
        ],
      }),
    );
  });
});

describe("getCompositePolygons", () => {
  test("no", () => {
    expect(getCompositePolygons([polygon1, polygon5])).toEqual([
      polygonSchema.parse({
        vertices: [
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
        ],
      }),
    ]);
  });
});
