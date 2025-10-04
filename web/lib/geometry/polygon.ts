import { clipArray } from 'polyclip-js';
import { z } from 'zod';

import { AbsolutePointTuple, absolutePointTupleSchema } from '../line';
import { rectSchema } from './rect';

export const polygonSchema = z
    .object({
        vertices: z.array(absolutePointTupleSchema),
    })
    .brand<'Polygon'>();

export type Polygon = z.infer<typeof polygonSchema>;

/**
 * Calculates the center point (centroid) of a polygon.
 * The centroid is the arithmetic mean of all vertices.
 *
 * @param polygon - The polygon to find the center point of
 * @returns The center point as an AbsolutePointTuple [x, y]
 * @throws Error if the polygon has no vertices
 */
export function getCenterPoint(polygon: Polygon): AbsolutePointTuple {
    if (polygon.vertices.length === 0) {
        throw new Error(
            'Cannot calculate center point of polygon with no vertices',
        );
    }

    const sumX = polygon.vertices.reduce((sum, vertex) => sum + vertex[0], 0);
    const sumY = polygon.vertices.reduce((sum, vertex) => sum + vertex[1], 0);

    const centerX = sumX / polygon.vertices.length;
    const centerY = sumY / polygon.vertices.length;

    return absolutePointTupleSchema.parse([centerX, centerY]);
}

/**
 * Calculates the area (size) of a polygon using the shoelace formula.
 * The shoelace formula works for any simple polygon (non-self-intersecting).
 *
 * @param polygon - The polygon to calculate the area of
 * @returns The area of the polygon as a positive number
 * @throws Error if the polygon has fewer than 3 vertices
 */
export function getPolygonSize(polygon: Polygon): number {
    if (polygon.vertices.length < 3) {
        throw new Error(
            'Cannot calculate area of polygon with fewer than 3 vertices',
        );
    }

    let area = 0;
    const vertices = polygon.vertices;
    const n = vertices.length;

    // Apply the shoelace formula
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += vertices[i][0] * vertices[j][1];
        area -= vertices[j][0] * vertices[i][1];
    }

    // Return the absolute value to ensure positive area
    return Math.abs(area) / 2;
}

export function sortIntoClockwiseOrder(points: AbsolutePointTuple[]) {
    const centerX = points.reduce((p, c) => p + c[0], 0) / points.length;
    const centerY = points.reduce((p, c) => p + c[1], 0) / points.length;

    // Compute angle of each point with respect to the center coordinate
    const pointsAndAngs = points.map((p) => ({
        p: p,
        ang: Math.atan2(centerX - p[0], centerY - p[1]),
    }));

    // Sort points by angular value
    const sorted = pointsAndAngs.sort((a, b) => b.ang - a.ang).map((a) => a.p);

    return sorted;
}

export function sortPolygonVerticesIntoClockwiseOrder(
    polygon: Polygon,
): Polygon {
    if (polygon.vertices.length < 3) {
        return polygon;
    }

    const p1 = polygon.vertices[0];
    const p2 = polygon.vertices[1];
    const p3 = polygon.vertices[2];

    const avgPoint = absolutePointTupleSchema.parse([
        (p1[0] + p3[0]) / 2,
        (p1[1] + p3[1]) / 2,
    ]);

    const isAvgPointInside = inside(avgPoint, polygon);

    const crossProduct =
        (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);

    // If cross product is positive (counterclockwise) and avg point is outside,
    // or if cross product is negative (clockwise) and avg point is inside,
    // then we need to reverse the vertices
    const shouldReverse =
        (crossProduct > 0 && !isAvgPointInside) ||
        (crossProduct < 0 && isAvgPointInside);

    if (shouldReverse) {
        return {
            ...polygon,
            vertices: [...polygon.vertices].reverse(),
        };
    }

    return polygon;
}

export const rectToPolygonSchema = rectSchema.transform((rect) => {
    const p1 = absolutePointTupleSchema.parse([rect.origin.x, rect.origin.y]);
    const p2 = absolutePointTupleSchema.parse([rect.target.x, rect.origin.y]);
    const p3 = absolutePointTupleSchema.parse([rect.target.x, rect.target.y]);
    const p4 = absolutePointTupleSchema.parse([rect.origin.x, rect.target.y]);
    return polygonSchema.parse({
        ...rect,
        vertices: sortIntoClockwiseOrder([p1, p2, p3, p4]),
    });
});

/*
  ray-casting algorithm based on
  https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
*/
export function inside(point: AbsolutePointTuple, polygon: Polygon) {
    const x = point[0],
        y = point[1];
    const vs = polygon.vertices;

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0],
            yi = vs[i][1];
        const xj = vs[j][0],
            yj = vs[j][1];

        const intersect =
            yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * This function should only be used before sending polygons to the backend.
 */
export function completePolygonRing(polygon: Polygon): Polygon {
    return { ...polygon, vertices: [...polygon.vertices, polygon.vertices[0]] };
}

export function getCompositePolygon(
    polygon1: Polygon,
    polygon2: Polygon,
): Polygon | null {
    if (isIneligiblePolygon(polygon1) || isIneligiblePolygon(polygon2))
        return null;

    try {
        const result = clipArray(
            [polygon1.vertices],
            [polygon2.vertices],
            true,
        );

        if (result.length !== 1) return null;

        const compo = result[0];

        return sortPolygonVerticesIntoClockwiseOrder(
            polygonSchema.parse({
                vertices: compo,
            }),
        );
    } catch {
        console.log(`Failed to find polygon union of:

    ${JSON.stringify(polygon1)}

    ${JSON.stringify(polygon2)}

    `);
    }

    return null;
}

export function getCompositePolygons(_polygons: Polygon[]): Polygon[] {
    const polygons = _polygons.slice();

    if (polygons.length < 2) return polygons;

    for (let i = 0; i < polygons.length; i++) {
        const iPolygon = polygons[i];
        for (let j = 0; j < polygons.length; j++) {
            const jPolygon = polygons[j];

            if (i === j) continue;

            const combo = getCompositePolygon(iPolygon, jPolygon);

            if (combo != null) {
                // delete the later one first
                polygons.splice(Math.max(i, j), 1);
                polygons.splice(Math.min(i, j), 1);

                return getCompositePolygons([combo, ...polygons]);
            }
        }
    }
    return polygons;
}

export function isEligiblePolygon(p: Polygon): boolean {
    const firstX = p.vertices[0][0],
        firstY = p.vertices[0][1];

    const pointsToCheck = p.vertices.slice(1);

    return (
        pointsToCheck.some((v) => v[0] !== firstX) &&
        pointsToCheck.some((v) => v[1] !== firstY)
    );
}

export function isIneligiblePolygon(p: Polygon): boolean {
    const firstX = p.vertices[0][0],
        firstY = p.vertices[0][1];
    const pointsToCheck = p.vertices.slice(1);
    return (
        pointsToCheck.every((v) => v[0] === firstX) ||
        pointsToCheck.every((v) => v[1] === firstY)
    );
}

export function getCanvasPolygon(
    centerX: number,
    centerY: number,
    size: number,
): Polygon {
    const vertices: AbsolutePointTuple[] = [];

    switch (size) {
        case 1:
            vertices.push(
                absolutePointTupleSchema.parse([centerX, centerY]),
                absolutePointTupleSchema.parse([centerX + 1, centerY]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX, centerY + 1]),
            );
            break;

        case 2:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 1, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX - 1, centerY + 1]),
            );
            break;

        case 3:
            vertices.push(
                absolutePointTupleSchema.parse([centerX, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY]),
                absolutePointTupleSchema.parse([centerX + 1 * 2, centerY]),
                absolutePointTupleSchema.parse([centerX + 1 * 2, centerY + 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1 * 2]),
                absolutePointTupleSchema.parse([centerX, centerY + 1 * 2]),
                absolutePointTupleSchema.parse([centerX, centerY + 1]),
                absolutePointTupleSchema.parse([centerX - 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX - 1, centerY]),
                absolutePointTupleSchema.parse([centerX, centerY]),
            );
            break;

        case 4:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 1, centerY - 1 * 2]),
                absolutePointTupleSchema.parse([centerX + 1, centerY - 1 * 2]),
                absolutePointTupleSchema.parse([centerX + 1, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1 * 2, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1 * 2, centerY + 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1 * 2]),
                absolutePointTupleSchema.parse([centerX - 1, centerY + 1 * 2]),
                absolutePointTupleSchema.parse([centerX - 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX - 1 * 2, centerY + 1]),
                absolutePointTupleSchema.parse([centerX - 1 * 2, centerY - 1]),
                absolutePointTupleSchema.parse([centerX - 1, centerY - 1]),
            );
            break;

        case 5:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 1, centerY - 1 * 2]),
                absolutePointTupleSchema.parse([
                    centerX + 1 * 2,
                    centerY - 1 * 2,
                ]),
                absolutePointTupleSchema.parse([centerX + 1 * 2, centerY - 1]),
                absolutePointTupleSchema.parse([centerX + 1 * 3, centerY - 1]),
                absolutePointTupleSchema.parse([
                    centerX + 1 * 3,
                    centerY + 1 * 2,
                ]),
                absolutePointTupleSchema.parse([
                    centerX + 1 * 2,
                    centerY + 1 * 2,
                ]),
                absolutePointTupleSchema.parse([
                    centerX + 1 * 2,
                    centerY + 1 * 3,
                ]),
                absolutePointTupleSchema.parse([centerX - 1, centerY + 1 * 3]),
                absolutePointTupleSchema.parse([centerX - 1, centerY + 1 * 2]),
                absolutePointTupleSchema.parse([
                    centerX - 1 * 2,
                    centerY + 1 * 2,
                ]),
                absolutePointTupleSchema.parse([centerX - 1 * 2, centerY - 1]),
                absolutePointTupleSchema.parse([centerX - 1, centerY - 1]),
            );
            break;

        case 6:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 2, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 2, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 2, centerY - 2]),
                absolutePointTupleSchema.parse([centerX + 3, centerY - 2]),
                absolutePointTupleSchema.parse([centerX + 3, centerY + 2]),
                absolutePointTupleSchema.parse([centerX + 2, centerY + 2]),
                absolutePointTupleSchema.parse([centerX + 2, centerY + 3]),
                absolutePointTupleSchema.parse([centerX - 2, centerY + 3]),
                absolutePointTupleSchema.parse([centerX - 2, centerY + 2]),
                absolutePointTupleSchema.parse([centerX - 3, centerY + 2]),
                absolutePointTupleSchema.parse([centerX - 3, centerY - 2]),
                absolutePointTupleSchema.parse([centerX - 2, centerY - 2]),
            );
            break;

        case 7:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 2, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 3, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 3, centerY - 2]),
                absolutePointTupleSchema.parse([centerX + 4, centerY - 2]),
                absolutePointTupleSchema.parse([centerX + 4, centerY + 3]),
                absolutePointTupleSchema.parse([centerX + 3, centerY + 3]),
                absolutePointTupleSchema.parse([centerX + 3, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 2, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 2, centerY + 3]),
                absolutePointTupleSchema.parse([centerX - 3, centerY + 3]),
                absolutePointTupleSchema.parse([centerX - 3, centerY - 2]),
                absolutePointTupleSchema.parse([centerX - 2, centerY - 2]),
            );
            break;

        case 8:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 3, centerY - 4]),
                absolutePointTupleSchema.parse([centerX + 3, centerY - 4]),
                absolutePointTupleSchema.parse([centerX + 3, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 4, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 4, centerY + 3]),
                absolutePointTupleSchema.parse([centerX + 3, centerY + 3]),
                absolutePointTupleSchema.parse([centerX + 3, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 3, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 3, centerY + 3]),
                absolutePointTupleSchema.parse([centerX - 4, centerY + 3]),
                absolutePointTupleSchema.parse([centerX - 4, centerY - 3]),
                absolutePointTupleSchema.parse([centerX - 3, centerY - 3]),
            );
            break;

        case 9:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 3, centerY - 4]),
                absolutePointTupleSchema.parse([centerX + 4, centerY - 4]),
                absolutePointTupleSchema.parse([centerX + 4, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 5, centerY - 3]),
                absolutePointTupleSchema.parse([centerX + 5, centerY + 4]),
                absolutePointTupleSchema.parse([centerX + 4, centerY + 4]),
                absolutePointTupleSchema.parse([centerX + 4, centerY + 5]),
                absolutePointTupleSchema.parse([centerX - 3, centerY + 5]),
                absolutePointTupleSchema.parse([centerX - 3, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 4, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 4, centerY - 3]),
                absolutePointTupleSchema.parse([centerX - 3, centerY - 3]),
            );
            break;

        case 10:
            vertices.push(
                absolutePointTupleSchema.parse([centerX - 4, centerY - 5]),
                absolutePointTupleSchema.parse([centerX + 4, centerY - 5]),
                absolutePointTupleSchema.parse([centerX + 4, centerY - 4]),
                absolutePointTupleSchema.parse([centerX + 5, centerY - 4]),
                absolutePointTupleSchema.parse([centerX + 5, centerY + 4]),
                absolutePointTupleSchema.parse([centerX + 4, centerY + 4]),
                absolutePointTupleSchema.parse([centerX + 4, centerY + 5]),
                absolutePointTupleSchema.parse([centerX - 4, centerY + 5]),
                absolutePointTupleSchema.parse([centerX - 4, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 5, centerY + 4]),
                absolutePointTupleSchema.parse([centerX - 5, centerY - 4]),
                absolutePointTupleSchema.parse([centerX - 4, centerY - 4]),
            );
            break;

        default:
            // Fallback for size 1
            vertices.push(
                absolutePointTupleSchema.parse([centerX, centerY]),
                absolutePointTupleSchema.parse([centerX + 1, centerY]),
                absolutePointTupleSchema.parse([centerX + 1, centerY + 1]),
                absolutePointTupleSchema.parse([centerX, centerY + 1]),
            );
            break;
    }

    return polygonSchema.parse({ vertices });
}
