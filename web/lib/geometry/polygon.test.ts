import { describe, expect, test } from 'vitest';

import { absolutePointTupleSchema } from '../line';
import { bunchOfTuplePointsSchema } from '../utils/testing';
import {
    getCanvasPolygon,
    getCenterPoint,
    inside,
    isEligiblePolygon,
    isIneligiblePolygon,
    polygonSchema,
    rectToPolygonSchema,
    sortIntoClockwiseOrder,
} from './polygon';
import { rectSchema } from './rect';
import {
    rect1,
    rect2,
    rect3,
    rect4,
    rect5,
    rect6,
    rect7,
} from './rectilinear.test';

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

describe('sortIntoClockwiseOrder', () => {
    test('already sorted', () => {
        expect(sortIntoClockwiseOrder(sortedPoints)).toEqual(sortedPoints);
    });
    test('sorting needed', () => {
        expect(sortIntoClockwiseOrder(scrambledPoints)).toEqual(sortedPoints);
    });
    test('sorted all positive points', () => {
        expect(sortIntoClockwiseOrder(scrambledPositivePoints)).toEqual(
            sortedPositivePoints,
        );
    });
});

describe('inside', () => {
    test('no', () => {
        expect(
            inside(absolutePointTupleSchema.parse([20, 20]), polygon1),
        ).toBeFalsy();
    });
    test('yes', () => {
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

describe('isEligiblePolygon', () => {
    test('happy', () => {
        expect(isEligiblePolygon(polygon1)).toBeTruthy();
        expect(isEligiblePolygon(polygon2)).toBeTruthy();
        expect(isEligiblePolygon(polygon3)).toBeTruthy();
        expect(isEligiblePolygon(polygon4)).toBeTruthy();
        expect(isEligiblePolygon(polygon5)).toBeTruthy();
        expect(isEligiblePolygon(polygon6)).toBeTruthy();
        expect(isEligiblePolygon(polygon7)).toBeTruthy();
    });

    test('point', () => {
        expect(isEligiblePolygon(polygon8)).toBeFalsy();
    });

    test('line', () => {
        expect(isEligiblePolygon(polygon9)).toBeFalsy();
    });
});

describe('isIneligiblePolygon', () => {
    test('happy', () => {
        expect(isIneligiblePolygon(polygon1)).toBeFalsy();
        expect(isIneligiblePolygon(polygon2)).toBeFalsy();
        expect(isIneligiblePolygon(polygon3)).toBeFalsy();
        expect(isIneligiblePolygon(polygon4)).toBeFalsy();
        expect(isIneligiblePolygon(polygon5)).toBeFalsy();
        expect(isIneligiblePolygon(polygon6)).toBeFalsy();
        expect(isIneligiblePolygon(polygon7)).toBeFalsy();
    });

    test('point', () => {
        expect(isIneligiblePolygon(polygon8)).toBeTruthy();
    });

    test('line', () => {
        expect(isIneligiblePolygon(polygon9)).toBeTruthy();
    });
});

describe('getCenterPoint', () => {
    test('square polygon - should return center', () => {
        const square = polygonSchema.parse({
            vertices: [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
            ],
        });

        const center = getCenterPoint(square);
        expect(center).toEqual([5, 5]);
    });

    test('triangle polygon - should return centroid', () => {
        const triangle = polygonSchema.parse({
            vertices: [
                [0, 0],
                [6, 0],
                [3, 6],
            ],
        });

        const center = getCenterPoint(triangle);
        expect(center).toEqual([3, 2]);
    });

    test('rectangle polygon - should return center', () => {
        const rectangle = polygonSchema.parse({
            vertices: [
                [2, 3],
                [8, 3],
                [8, 7],
                [2, 7],
            ],
        });

        const center = getCenterPoint(rectangle);
        expect(center).toEqual([5, 5]);
    });

    test('single point polygon - should return the point', () => {
        const singlePoint = polygonSchema.parse({
            vertices: [[5, 3]],
        });

        const center = getCenterPoint(singlePoint);
        expect(center).toEqual([5, 3]);
    });

    test('two point polygon - should return midpoint', () => {
        const twoPoints = polygonSchema.parse({
            vertices: [
                [0, 0],
                [10, 6],
            ],
        });

        const center = getCenterPoint(twoPoints);
        expect(center).toEqual([5, 3]);
    });

    test('irregular polygon - should return average of vertices', () => {
        const irregular = polygonSchema.parse({
            vertices: [
                [1, 1],
                [4, 1],
                [5, 3],
                [3, 5],
                [0, 4],
            ],
        });

        // Sum: x = 1+4+5+3+0 = 13, y = 1+1+3+5+4 = 14
        // Average: x = 13/5 = 2.6, y = 14/5 = 2.8
        const center = getCenterPoint(irregular);
        expect(center).toEqual([2.6, 2.8]);
    });

    test('polygon with negative coordinates', () => {
        const negativeCoords = polygonSchema.parse({
            vertices: [
                [-5, -5],
                [5, -5],
                [5, 5],
                [-5, 5],
            ],
        });

        const center = getCenterPoint(negativeCoords);
        expect(center).toEqual([0, 0]);
    });

    test('polygon with decimal coordinates', () => {
        const decimalCoords = polygonSchema.parse({
            vertices: [
                [1.5, 2.5],
                [3.7, 1.2],
                [2.8, 4.9],
            ],
        });

        // Sum: x = 1.5+3.7+2.8 = 8.0, y = 2.5+1.2+4.9 = 8.6
        // Average: x = 8.0/3 ≈ 2.6667, y = 8.6/3 ≈ 2.8667
        const center = getCenterPoint(decimalCoords);
        expect(center[0]).toBeCloseTo(2.6667, 4);
        expect(center[1]).toBeCloseTo(2.8667, 4);
    });

    test('empty polygon - should throw error', () => {
        const emptyPolygon = polygonSchema.parse({
            vertices: [],
        });

        expect(() => getCenterPoint(emptyPolygon)).toThrow(
            'Cannot calculate center point of polygon with no vertices',
        );
    });

    test('polygon from rect1 - should match expected center', () => {
        const polygon = rectToPolygonSchema.parse(rect1);
        const center = getCenterPoint(polygon);

        // rect1 is from (0,0) to (10,10), so center should be (5, 5)
        expect(center).toEqual([5, 5]);
    });

    test('polygon from rect2 - should match expected center', () => {
        const polygon = rectToPolygonSchema.parse(rect2);
        const center = getCenterPoint(polygon);

        // rect2 is from (10,0) to (20,10), so center should be (15, 5)
        expect(center).toEqual([15, 5]);
    });

    test('polygon from rect5 - should match expected center', () => {
        const polygon = rectToPolygonSchema.parse(rect5);
        const center = getCenterPoint(polygon);

        // rect5 is from (5,5) to (15,15), so center should be (10, 10)
        expect(center).toEqual([10, 10]);
    });

    test('large coordinates polygon', () => {
        const largeCoords = polygonSchema.parse({
            vertices: [
                [1000, 2000],
                [3000, 2000],
                [3000, 4000],
                [1000, 4000],
            ],
        });

        const center = getCenterPoint(largeCoords);
        expect(center).toEqual([2000, 3000]);
    });
});

describe('getCanvasPolygon', () => {
    test('size 1 - single pixel square', () => {
        const polygon = getCanvasPolygon(5, 5, 1);
        expect(polygon.vertices).toEqual([
            [5, 5],
            [6, 5],
            [6, 6],
            [5, 6],
        ]);
    });

    test('size 2 - 2x2 square', () => {
        const polygon = getCanvasPolygon(5, 5, 2);
        expect(polygon.vertices).toEqual([
            [4, 4],
            [6, 4],
            [6, 6],
            [4, 6],
        ]);
    });

    test('size 3 - cross-like shape', () => {
        const polygon = getCanvasPolygon(5, 5, 3);
        expect(polygon.vertices).toEqual([
            [5, 4],
            [6, 4],
            [6, 5],
            [7, 5],
            [7, 6],
            [6, 6],
            [6, 7],
            [5, 7],
            [5, 6],
            [4, 6],
            [4, 5],
            [5, 5],
        ]);
    });

    test('size 4 - rounded rectangle', () => {
        const polygon = getCanvasPolygon(5, 5, 4);
        expect(polygon.vertices).toEqual([
            [4, 3],
            [6, 3],
            [6, 4],
            [7, 4],
            [7, 6],
            [6, 6],
            [6, 7],
            [4, 7],
            [4, 6],
            [3, 6],
            [3, 4],
            [4, 4],
        ]);
    });

    test('size 5 - larger rounded shape', () => {
        const polygon = getCanvasPolygon(5, 5, 5);
        expect(polygon.vertices).toEqual([
            [4, 3],
            [7, 3],
            [7, 4],
            [8, 4],
            [8, 7],
            [7, 7],
            [7, 8],
            [4, 8],
            [4, 7],
            [3, 7],
            [3, 4],
            [4, 4],
        ]);
    });

    test('size 6 - rounded 6x6 shape', () => {
        const polygon = getCanvasPolygon(5, 5, 6);
        expect(polygon.vertices).toEqual([
            [3, 2],
            [7, 2],
            [7, 3],
            [8, 3],
            [8, 7],
            [7, 7],
            [7, 8],
            [3, 8],
            [3, 7],
            [2, 7],
            [2, 3],
            [3, 3],
        ]);
    });

    test('size 7 - rounded 7x7 shape', () => {
        const polygon = getCanvasPolygon(5, 5, 7);
        expect(polygon.vertices).toEqual([
            [3, 2],
            [8, 2],
            [8, 3],
            [9, 3],
            [9, 8],
            [8, 8],
            [8, 9],
            [3, 9],
            [3, 8],
            [2, 8],
            [2, 3],
            [3, 3],
        ]);
    });

    test('size 8 - rounded 8x8 shape', () => {
        const polygon = getCanvasPolygon(5, 5, 8);
        expect(polygon.vertices).toEqual([
            [2, 1],
            [8, 1],
            [8, 2],
            [9, 2],
            [9, 8],
            [8, 8],
            [8, 9],
            [2, 9],
            [2, 8],
            [1, 8],
            [1, 2],
            [2, 2],
        ]);
    });

    test('size 9 - rounded 9x9 shape', () => {
        const polygon = getCanvasPolygon(5, 5, 9);
        expect(polygon.vertices).toEqual([
            [2, 1],
            [9, 1],
            [9, 2],
            [10, 2],
            [10, 9],
            [9, 9],
            [9, 10],
            [2, 10],
            [2, 9],
            [1, 9],
            [1, 2],
            [2, 2],
        ]);
    });

    test('size 10 - rounded 10x10 shape', () => {
        const polygon = getCanvasPolygon(5, 5, 10);
        expect(polygon.vertices).toEqual([
            [1, 0],
            [9, 0],
            [9, 1],
            [10, 1],
            [10, 9],
            [9, 9],
            [9, 10],
            [1, 10],
            [1, 9],
            [0, 9],
            [0, 1],
            [1, 1],
        ]);
    });

    test('different center coordinates', () => {
        const polygon = getCanvasPolygon(10, 15, 2);
        expect(polygon.vertices).toEqual([
            [9, 14],
            [11, 14],
            [11, 16],
            [9, 16],
        ]);
    });

    test('negative center coordinates', () => {
        const polygon = getCanvasPolygon(-5, -3, 1);
        expect(polygon.vertices).toEqual([
            [-5, -3],
            [-4, -3],
            [-4, -2],
            [-5, -2],
        ]);
    });

    test('size 0 falls back to size 1', () => {
        const polygon = getCanvasPolygon(5, 5, 0);
        expect(polygon.vertices).toEqual([
            [5, 5],
            [6, 5],
            [6, 6],
            [5, 6],
        ]);
    });

    test('negative size falls back to size 1', () => {
        const polygon = getCanvasPolygon(5, 5, -1);
        expect(polygon.vertices).toEqual([
            [5, 5],
            [6, 5],
            [6, 6],
            [5, 6],
        ]);
    });

    test('size beyond 10 falls back to size 1', () => {
        const polygon = getCanvasPolygon(5, 5, 15);
        expect(polygon.vertices).toEqual([
            [5, 5],
            [6, 5],
            [6, 6],
            [5, 6],
        ]);
    });

    test('decimal coordinates should work', () => {
        const polygon = getCanvasPolygon(5.5, 3.7, 1);
        expect(polygon.vertices).toEqual([
            [5.5, 3.7],
            [6.5, 3.7],
            [6.5, 4.7],
            [5.5, 4.7],
        ]);
    });
});
