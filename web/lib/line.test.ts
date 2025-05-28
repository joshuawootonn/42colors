import { describe, expect, test } from "vitest";
import { absolutePointTupleSchema, insideLine, lineSchema } from "./line";

describe("inside", () => {
  test("no", () => {
    expect(
      insideLine(
        absolutePointTupleSchema.parse([5, 5]),
        lineSchema.parse([
          { x: 0, y: 0 },
          { x: 0, y: 10 },
        ]),
      ),
    ).toBeFalsy();
  });
  test("yes", () => {
    expect(
      insideLine(
        absolutePointTupleSchema.parse([0, 5]),
        lineSchema.parse([
          { x: 0, y: 0 },
          { x: 0, y: 10 },
        ]),
      ),
    ).toBeTruthy();
  });
});
