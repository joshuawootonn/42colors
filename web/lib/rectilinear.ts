import { z } from "zod";
import { Rect as Rect, rectSchema } from "./rect";
import { AbsolutePoint, absolutePointSchema } from "./coord";
import {
  polygonSchema,
  Polygon,
  rectToPolygonSchema,
  sortIntoClockwiseOrder,
} from "./polygon";

export const rectilinearShapeSchema = z
  .object({
    points: z.array(absolutePointSchema),
    rects: z.array(rectSchema),
  })
  .brand<"RectilinearShape">();

export type RectilinearShape = z.infer<typeof rectilinearShapeSchema>;

export function areRectsIntersecting(rect1: Rect, rect2: Rect): boolean {
  const rect1Left = Math.min(rect1.target.x, rect1.origin.x);
  const rect1Right = Math.max(rect1.target.x, rect1.origin.x);
  const rect1Top = Math.min(rect1.target.y, rect1.origin.y);
  const rect1Bottom = Math.max(rect1.target.y, rect1.origin.y);

  const rect2Left = Math.min(rect2.target.x, rect2.origin.x);
  const rect2Right = Math.max(rect2.target.x, rect2.origin.x);
  const rect2Top = Math.min(rect2.target.y, rect2.origin.y);
  const rect2Bottom = Math.max(rect2.target.y, rect2.origin.y);

  return !(
    rect1Right < rect2Left ||
    rect1Left > rect2Right ||
    rect1Bottom < rect2Top ||
    rect1Top > rect2Bottom
  );
}

export type Shape = Rect | RectilinearShape;

export function findRectilinearShapes(_rects: Rect[]): {
  rectilinearShapes: RectilinearShape[];
  rects: Rect[];
} {
  const rects = _rects.slice();

  const usedIndices: number[] = [];
  const rectilinearShapes: RectilinearShape[] = [];
  for (let i = 0; i < _rects.length; i++) {
    console.log(i, _rects.length, rectilinearShapes.length);

    // const snapshot = rectilinearShapes.length;
    for (let j = i + 1; j < _rects.length; j++) {
      if (i === j) continue;
      if (usedIndices.includes(j)) continue;
      // console.log(">>>>>>>>>>>> " + i + " " + j, {
      //   i,
      //   j,
      //   rectLength: _rects.length,
      //   snapshot,
      //   usedIndices,
      // });

      if (areRectsIntersecting(rects[i], rects[j])) {
        rectilinearShapes.push(
          rectilinearShapeSchema.parse({
            //todo
            points: [],
            rects: [rects[i], rects[j]],
          }),
        );
        usedIndices.push(j);
        rects.splice(i);
      }
    }
  }

  return { rectilinearShapes, rects };
}

/*
  Line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/

  - Returns the coordinate of the intersection point
  - Returns FALSE if the lines don't intersect

  Coordinates x1, y1, x2 and y2 designate the start and end point of the first line
  Coordinates x3, y3, x4 and y4 designate the start and end point of the second line
*/
function intersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
) {
  // Check if none of the lines are of length 0
  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return false;
  }

  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

  // Lines are parallel
  if (denominator === 0) {
    return false;
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
    return false;
  }

  // Return a object with the x and y coordinates of the intersection
  const x = x1 + ua * (x2 - x1);
  const y = y1 + ua * (y2 - y1);

  return absolutePointSchema.parse({ x, y });
}

export function getIntersectionPoints(
  polygon1: Polygon,
  polygon2: Polygon,
): AbsolutePoint[] {
  // todo(josh): what if they are the same rect?

  const intersectionPoints: AbsolutePoint[] = [];

  for (let i = 0; i < polygon1.vertices.length; i++) {
    for (let j = 0; j < polygon2.vertices.length; j++) {
      const a1 = polygon1.vertices[i];
      const a2 = polygon1.vertices[(i + 1) % polygon1.vertices.length];
      const b1 = polygon2.vertices[j];
      const b2 = polygon2.vertices[(j + 1) % polygon2.vertices.length];

      const check = intersect(a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y);
      if (check) {
        intersectionPoints.push(check);
      }
    }
  }

  return intersectionPoints;
}

/*
  ray-casting algorithm based on
  https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
*/
export function inside(point: AbsolutePoint, polygon: Polygon) {
  const { x, y } = point;
  const vs = polygon.vertices;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const { x: xi, y: yi } = vs[i];
    const { x: xj, y: yj } = vs[j];

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
  const intersectionPoints = getIntersectionPoints(polygon1, polygon2);

  if (intersectionPoints.length === 0) return null;

  const aPointsNotWithinB = polygon1.vertices.filter(
    (point) => !inside(point, polygon2),
  );
  const bPointsNotWithinA = polygon2.vertices.filter(
    (point) => !inside(point, polygon1),
  );

  const vertices = sortIntoClockwiseOrder([
    ...intersectionPoints,
    ...aPointsNotWithinB,
    ...bPointsNotWithinA,
  ]);

  return polygonSchema.parse({ vertices });
}

export function getCompositePolygons(_polygons: Polygon[]): Polygon[] {
  let polygons = _polygons.slice();
  const polygonsToDraw: Polygon[] = [];

  for (let i = 0; i < polygons.length; i++) {
    let polygon = polygons[0];
    let polygonsToSearch = polygons.slice(1);
    const indexesToCombined: number[] = [0];
    for (let j = 0; j < polygonsToSearch.length; j++) {
      const nextPolygon = polygonsToSearch[j];
      const compositePolygon = getCompositePolygon(polygon, nextPolygon);

      if (compositePolygon != null) {
        polygon = compositePolygon;
      } else {
        indexesToCombined.push(j);
      }
    }

    polygonsToDraw.push(polygon);
    const next = [];
    for (let j = 0; j < indexesToCombined.length; j++) {
      next.push(polygonsToSearch[indexesToCombined[j]]);
    }
    polygons = next;
  }

  return polygonsToDraw;
}
