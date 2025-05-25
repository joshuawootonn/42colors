import { describe, expect, test } from "vitest";
import { absolutePointSchema } from "./coord";
import { inside } from "./polygon";
import { insideLine, lineSchema } from "./line";

describe("inside", () => {
  test("no", () => {
    expect(
      insideLine(
        absolutePointSchema.parse({ x: 5, y: 5 }),
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
        absolutePointSchema.parse({ x: 0, y: 5 }),
        lineSchema.parse([
          { x: 0, y: 0 },
          { x: 0, y: 10 },
        ]),
      ),
    ).toBeTruthy();
  });
});
