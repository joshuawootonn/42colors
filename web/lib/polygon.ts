import { z } from "zod";
import { rectSchema } from "./rect";
import {
  AbsolutePointTuple,
  absolutePointTupleSchema,
  lineSchema,
} from "./line";
import { clipArray } from "polyclip-js";

export const polygonSchema = z
  .object({
    vertices: z.array(absolutePointTupleSchema),
    lines: z.array(lineSchema),
  })
  .brand<"Polygon">();

export type Polygon = z.infer<typeof polygonSchema>;

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

export const rectToPolygonSchema = rectSchema.transform((rect) => {
  const p1 = absolutePointTupleSchema.parse([rect.origin.x, rect.origin.y]);
  const p2 = absolutePointTupleSchema.parse([rect.target.x, rect.origin.y]);
  const p3 = absolutePointTupleSchema.parse([rect.target.x, rect.target.y]);
  const p4 = absolutePointTupleSchema.parse([rect.origin.x, rect.target.y]);
  return polygonSchema.parse({
    ...rect,
    lines: [
      [p1, p2],
      [p2, p3],
      [p3, p4],
      [p4, p1],
    ],
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

export function getCompositePolygon(
  polygon1: Polygon,
  polygon2: Polygon,
): Polygon | null {
  if (isIneligiblePolygon(polygon1) || isIneligiblePolygon(polygon2))
    return null;

  try {
    const result = clipArray([polygon1.vertices], [polygon2.vertices], true);

    if (result.length !== 1) return null;

    const compo = result[0];

    const lines = [];
    for (let i = 1; i < compo.length + 1; i++) {
      const prev = compo[i - 1];
      const point = compo[i % compo.length];
      lines.push([prev, point]);
    }

    return polygonSchema.parse({ vertices: compo, lines });
  } catch (_) {
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
