import { describe, expect, test } from "vitest";

import { dedupe } from "./dedupe";

describe("dedupe", () => {
  test("happy path", () => {
    const arr = [1, 1, 1, 2, 3];

    expect(dedupe(arr)).toEqual([1, 2, 3]);
  });
});
