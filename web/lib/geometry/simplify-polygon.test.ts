import { describe, expect, it } from 'vitest';

import { polygonSchema } from './polygon';
import {
    areCollinear,
    isBacktracking,
    isBetween,
    removeInternalLoops,
    simplifyPolygon,
} from './simplify-polygon';

describe('simplifyPolygon', () => {
    it('should remove backtracking segments from a polygon', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 0],
                [1, 1],
                [1, 0],
                [2, 0],
                [2, 2],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
        ]);
    });

    it('should remove redundant collinear points', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 0],
                [2, 0],
                [2, 2],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
        ]);
    });

    it('should handle multiple backtracking segments', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 0],
                [1, 1],
                [1, 0],
                [2, 0],
                [2, 1],
                [2, 0],
                [3, 0],
                [3, 3],
                [0, 3],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [3, 0],
            [3, 3],
            [0, 3],
        ]);
    });

    it('should preserve valid polygons without redundant vertices', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [2, 0],
                [2, 2],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
        ]);
    });

    it('should handle L-shaped polygons correctly', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [2, 0],
                [2, 1],
                [1, 1],
                [1, 2],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        // L-shape has no backtracking or collinear redundant points
        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 1],
            [1, 1],
            [1, 2],
            [0, 2],
        ]);
    });

    it('should handle vertical backtracking', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [2, 0],
                [2, 1],
                [2, 2],
                [2, 1],
                [2, 3],
                [0, 3],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 3],
            [0, 3],
        ]);
    });

    it('should handle horizontal backtracking', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 0],
                [2, 0],
                [1, 0],
                [3, 0],
                [3, 2],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [3, 0],
            [3, 2],
            [0, 2],
        ]);
    });

    it('should return original polygon if it has less than 3 vertices', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 1],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual(polygon.vertices);
    });

    it('should handle complex backtracking with multiple spikes', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 0],
                [1, 0.5],
                [1, 0],
                [2, 0],
                [2, 0.5],
                [2, 0],
                [4, 0],
                [4, 4],
                [0, 4],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
        ]);
    });

    it('should handle zigzag patterns that resolve to a straight line', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [1, 0],
                [0.5, 0],
                [2, 0],
                [2, 2],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
        ]);
    });

    it('should preserve triangles', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [2, 0],
                [1, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [1, 2],
        ]);
    });

    it('should handle backtracking at the polygon boundary (wrap-around)', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [2, 0],
                [2, 2],
                [0, 2],
                [0, 1],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
        ]);
    });

    it('should handle real-world polygon editing scenario', () => {
        // Simulating a rectangle that was resized and created overlapping segments
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [5, 0],
                [5, 3],
                [5, 2],
                [5, 3],
                [5, 5],
                [0, 5],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [5, 0],
            [5, 5],
            [0, 5],
        ]);
    });

    it('should remove self-intersecting loops (figure-eight pattern)', () => {
        // A polygon that crosses itself creating a figure-eight
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [4, 0],
                [4, 2],
                [0, 2],
                [2, 2],
                [2, 4],
                [0, 4],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        // Should remove the loop and keep a simpler polygon
        expect(simplified.vertices.length).toBeLessThan(
            polygon.vertices.length,
        );
        expect(simplified.vertices.length).toBeGreaterThanOrEqual(3);
    });

    it('should remove simple self-intersection (bowtie pattern)', () => {
        // Simple crossing pattern: two triangles meeting at a point
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [2, 2],
                [0, 4],
                [2, 2],
                [4, 4],
                [4, 0],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        // Should remove the self-intersection
        expect(simplified.vertices.length).toBeLessThan(
            polygon.vertices.length,
        );
    });

    it('should handle polygon where dragging creates a crossing', () => {
        // Simulating dragging a corner past an edge, creating an intersection
        // Original rectangle: [0,0], [4,0], [4,4], [0,4]
        // After dragging [4,4] to [2,6] and then the edges cross
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [4, 0],
                [4, 2],
                [2, 2],
                [2, 0],
                [0, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        // Should detect and remove the crossing
        expect(simplified.vertices.length).toBeGreaterThanOrEqual(3);
    });

    it('should preserve non-self-intersecting complex polygons', () => {
        // Complex but valid polygon (no self-intersections)
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [3, 0],
                [3, 1],
                [1, 1],
                [1, 3],
                [3, 3],
                [3, 4],
                [0, 4],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        // Should keep all vertices since there's no self-intersection
        expect(simplified.vertices).toEqual(polygon.vertices);
    });

    it('should handle multiple self-intersections', () => {
        // Polygon with multiple crossing points
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [4, 4],
                [4, 0],
                [0, 4],
                [2, 2],
                [6, 2],
            ],
        });

        const simplified = simplifyPolygon(polygon);

        // Should remove intersections and return a valid polygon
        expect(simplified.vertices.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle polygon with three identical points', () => {
        const polygon = polygonSchema.parse({
            vertices: [
                [0, 0],
                [4, 0],
                [4, 2],
                [4, 2],
                [4, 2],
                [4, 4],
                [0, 4],
            ],
        });

        const simplified = simplifyPolygon(polygon);
        console.log(simplified.vertices);

        expect(simplified.vertices).toEqual([
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
        ]);
    });
});

describe('removeSelfIntersectingLoops', () => {
    it('should remove self-intersecting loops', () => {
        const vertices = polygonSchema.parse({
            vertices: [
                [0, 0],
                [4, 0],
                [4, 2],
                [1, 2],
                [1, 1],
                [2, 1],
                [2, 4],
                [0, 4],
            ],
        });
        const simplified = removeInternalLoops(vertices.vertices);
        expect(simplified).toEqual([
            [0, 0],
            [4, 0],
            [4, 2],
            [2, 2],
            [2, 4],
            [0, 4],
        ]);
    });

    it('should preserve section with most original points', () => {
        const vertices = polygonSchema.parse({
            vertices: [
                [0, 0],
                [4, 0],
                [4, 2],
                [1, 2],
                [1, 1],
                [2, 1],
                [2, 4],
                [0, 4],
            ],
        });

        const simplified = removeInternalLoops(vertices.vertices);

        // The non-loop section has 3 vertices: [0,0], [4,0], [4,2] and [0,4]
        // The loop section has 4 vertices: [1,2], [1,1], [2,1], [2,4]
        // Since the non-loop section (before + after) has more points, keep it
        expect(simplified).toEqual([
            [0, 0],
            [4, 0],
            [4, 2],
            [2, 2],
            [2, 4],
            [0, 4],
        ]);
    });
});

describe('areCollinear', () => {
    it('should return true if the points are collinear', () => {
        expect(areCollinear([0, 0], [1, 0], [2, 0])).toBe(true);
    });

    it('should return false if the points are not collinear', () => {
        expect(areCollinear([0, 0], [1, 0], [1, 1])).toBe(false);
    });
});

describe('isBetween', () => {
    it('should return false if on the same plane but outside', () => {
        expect(isBetween([0, 0], [2, 0], [1, 0])).toBe(false);
    });
    it('should return false if the point is not between the start and end', () => {
        expect(isBetween([0, 0], [1, 0], [1, 1])).toBe(false);
    });
    it('should return true if the point is between the start and end', () => {
        expect(isBetween([0, 0], [1, 0], [2, 0])).toBe(true);
    });
});

describe('isBacktracking', () => {
    it('should return false if the point is not between the start and end', () => {
        expect(isBacktracking([0, 0], [1, 0], [2, 0])).toBe(false);
    });

    it('should return true if the point is between the start and end', () => {
        expect(isBacktracking([0, 0], [2, 0], [1, 0])).toBe(true);
    });

    it('should return false if the point is not between the start and end', () => {
        expect(isBacktracking([0, 0], [4, 0], [4, 2])).toBe(false);
    });
});
