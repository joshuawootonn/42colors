import { describe, expect, test } from "vitest";

import { getRectSize, rectSchema } from "./rect";

describe("getRectSize", () => {
  test("unit square - should return area 1", () => {
    const rect = rectSchema.parse({
      origin: { x: 0, y: 0 },
      target: { x: 1, y: 1 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(1);
  });

  test("10x10 square - should return area 100", () => {
    const rect = rectSchema.parse({
      origin: { x: 0, y: 0 },
      target: { x: 10, y: 10 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(100);
  });

  test("rectangle 5x3 - should return area 15", () => {
    const rect = rectSchema.parse({
      origin: { x: 0, y: 0 },
      target: { x: 5, y: 3 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(15);
  });

  test("rectangle 4x7 - should return area 28", () => {
    const rect = rectSchema.parse({
      origin: { x: 2, y: 3 },
      target: { x: 6, y: 10 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(28);
  });

  test("rectangle with negative coordinates - should return correct area", () => {
    const rect = rectSchema.parse({
      origin: { x: -5, y: -3 },
      target: { x: 5, y: 3 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(60); // 10x6 rectangle
  });

  test("rectangle with mixed positive/negative coordinates", () => {
    const rect = rectSchema.parse({
      origin: { x: -2, y: 1 },
      target: { x: 3, y: -4 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(25); // 5x5 rectangle
  });

  test("rectangle with decimal coordinates", () => {
    const rect = rectSchema.parse({
      origin: { x: 1.5, y: 2.5 },
      target: { x: 4.5, y: 5.5 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(9); // 3x3 rectangle
  });

  test("rectangle with precise decimal coordinates", () => {
    const rect = rectSchema.parse({
      origin: { x: 0.1, y: 0.2 },
      target: { x: 0.4, y: 0.7 },
    });

    const area = getRectSize(rect);
    expect(area).toBeCloseTo(0.15, 10); // 0.3x0.5 rectangle
  });

  test("reversed coordinates (target before origin) - should return same area", () => {
    const rect1 = rectSchema.parse({
      origin: { x: 0, y: 0 },
      target: { x: 4, y: 3 },
    });

    const rect2 = rectSchema.parse({
      origin: { x: 4, y: 3 },
      target: { x: 0, y: 0 },
    });

    const area1 = getRectSize(rect1);
    const area2 = getRectSize(rect2);
    expect(area1).toBe(area2);
    expect(area1).toBe(12);
  });

  test("rectangle with origin and target swapped on one axis", () => {
    const rect = rectSchema.parse({
      origin: { x: 5, y: 2 },
      target: { x: 1, y: 8 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(24); // 4x6 rectangle
  });

  test("large coordinates rectangle", () => {
    const rect = rectSchema.parse({
      origin: { x: 1000, y: 2000 },
      target: { x: 3000, y: 5000 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(6000000); // 2000x3000 rectangle
  });

  test("very small rectangle with tiny decimals", () => {
    const rect = rectSchema.parse({
      origin: { x: 0.001, y: 0.002 },
      target: { x: 0.004, y: 0.007 },
    });

    const area = getRectSize(rect);
    expect(area).toBeCloseTo(0.000015, 10); // 0.003x0.005 rectangle
  });

  test("zero width rectangle - should return area 0", () => {
    const rect = rectSchema.parse({
      origin: { x: 5, y: 2 },
      target: { x: 5, y: 8 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(0);
  });

  test("zero height rectangle - should return area 0", () => {
    const rect = rectSchema.parse({
      origin: { x: 2, y: 5 },
      target: { x: 8, y: 5 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(0);
  });

  test("point rectangle (same origin and target) - should return area 0", () => {
    const rect = rectSchema.parse({
      origin: { x: 3, y: 7 },
      target: { x: 3, y: 7 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(0);
  });

  test("rectangle with floating point precision", () => {
    const rect = rectSchema.parse({
      origin: { x: 0.1, y: 0.1 },
      target: { x: 0.2, y: 0.2 },
    });

    const area = getRectSize(rect);
    expect(area).toBeCloseTo(0.01, 10);
  });

  test("rectangle spanning multiple quadrants", () => {
    const rect = rectSchema.parse({
      origin: { x: -10, y: -5 },
      target: { x: 15, y: 8 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(325); // 25x13 rectangle
  });

  test("narrow tall rectangle", () => {
    const rect = rectSchema.parse({
      origin: { x: 0, y: 0 },
      target: { x: 1, y: 100 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(100);
  });

  test("wide short rectangle", () => {
    const rect = rectSchema.parse({
      origin: { x: 0, y: 0 },
      target: { x: 100, y: 1 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(100);
  });

  test("rectangle with extreme coordinates", () => {
    const rect = rectSchema.parse({
      origin: { x: -1000000, y: -500000 },
      target: { x: 1000000, y: 500000 },
    });

    const area = getRectSize(rect);
    expect(area).toBe(2000000000000); // 2,000,000 x 1,000,000
  });
});
