import { z } from "zod";
import { rectSchema } from "./rect";
import {
  AbsolutePointTuple,
  absolutePointTupleSchema,
  insideLine,
  isSubLine,
  Line,
  lineSchema,
  length,
} from "./line";

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

function decreasingX(line: Line): boolean {
  return line[1][0] - line[0][0] <= 0;
}

function decreasingY(line: Line): boolean {
  return line[1][1] - line[0][1] <= 0;
}

function increasingX(line: Line): boolean {
  return line[1][0] - line[0][0] >= 0;
}

function increasingY(line: Line): boolean {
  return line[1][1] - line[0][1] >= 0;
}

function orientLineBasedOnAngle(line: Line, angle: number) {
  if (angle <= Math.PI && angle > Math.PI / 2) {
    //x increasing y decreasing
    if (increasingX(line) && decreasingY(line)) {
      return line;
    }
    return lineSchema.parse(line.slice().reverse());
  } else if (angle <= Math.PI / 2 && angle > 0) {
    //x increasing y increasing
    if (increasingX(line) && increasingY(line)) {
      return line;
    }
    return lineSchema.parse(line.slice().reverse());
  } else if (angle <= 0 && angle > (-1 * Math.PI) / 2) {
    //x decreasing y increasing
    if (decreasingX(line) && increasingY(line)) {
      return line;
    }
    return lineSchema.parse(line.slice().reverse());
  } else if (angle >= -1 * Math.PI) {
    //x decreasing y decreasing
    if (decreasingX(line) && decreasingY(line)) {
      return line;
    }
    return lineSchema.parse(line.slice().reverse());
  }

  return line;
}

export function sortLinesClockwise(lines: Line[]): Line[] {
  const centerX =
    lines.reduce((acc, curr) => curr[0][0] + acc, 0) / lines.length;
  const centerY =
    lines.reduce((acc, curr) => curr[0][1] + acc, 0) / lines.length;

  const ang1 = Math.atan2(centerX - lines[0][0][0], centerY - lines[0][0][1]);
  const ang2 = Math.atan2(centerX - lines[0][1][0], centerY - lines[0][1][1]);

  if (ang1 < 0 && ang2 > 0) {
    // we are clockwise
  } else if (ang2 - ang1 > 0) {
    // we are clockwise
  } else {
    lines[0].reverse();
  }

  const linesAndAngs = lines.map((line) => ({
    line: line,
    ang: Math.atan2(
      centerX - (line[0][0] + line[1][0]) / 2,
      centerY - (line[0][1] + line[1][1]) / 2
    ),
    ang1: Math.atan2(centerX - line[0][0], centerY - line[0][1]),
    ang2: Math.atan2(centerX - line[1][0], centerY - line[1][1]),
  }));

  const sorted = linesAndAngs
    .sort((a, b) => b.ang - a.ang)
    .map((lineItem) => {
      if (lineItem.ang1 < 0 && lineItem.ang2 > 0) {
        return lineItem.line;
        // we are clockwise
      } else if (lineItem.ang1 < lineItem.ang2) {
        return lineSchema.parse(lineItem.line.slice().reverse());
        // we are clockwise
      } else {
        return lineItem.line;
      }
    });

  return sorted;
}

// export function connectLinesEnd2End(lines: Line[]): Line[] {
//   const connectedLines: Line[] = [lines[0]];
//   for (let i = 1; i < lines.length; i++) {
//     const prev = connectedLines[i - 1];
//     const line = lines[i];
//
//     if (prev[1][0] !== line[0][0] || prev[1][1] !== line[0][1]) {
//       connectedLines.push(lineSchema.parse(line.reverse()));
//     } else {
//       connectedLines.push(line);
//     }
//   }
//   return connectedLines;
// }

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
  y4: number
): AbsolutePointTuple | false {
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

  return absolutePointTupleSchema.parse([x, y]);
}

export function getIntersectionPoints(
  polygon1: Polygon,
  polygon2: Polygon
): { intersectionPoints: AbsolutePointTuple[]; intersectionSublines: Line[] } {
  // todo(josh): what if they are the same rect?

  const intersectionPoints: AbsolutePointTuple[] = [];
  const intersectionLines: Line[] = [];

  for (let i = 0; i < polygon1.lines.length; i++) {
    for (let j = 0; j < polygon2.lines.length; j++) {
      const line1 = polygon1.lines[i];
      const line2 = polygon2.lines[j];
      const a1 = line1[0];
      const a2 = line1[1];
      const b1 = line2[0];
      const b2 = line2[1];

      const check = intersect(
        a1[0],
        a1[1],
        a2[0],
        a2[1],
        b1[0],
        b1[1],
        b2[0],
        b2[1]
      );

      if (check) {
        intersectionPoints.push(check);

        const line1 = lineSchema.parse([check, a1]);
        const line2 = lineSchema.parse([check, a2]);
        const line3 = lineSchema.parse([check, b1]);
        const line4 = lineSchema.parse([check, b2]);

        intersectionLines.push(
          inside(a1, polygon2)
            ? line2
            : inside(a2, polygon2)
              ? line1
              : length(lineSchema.parse([check, a1])) <
                  length(lineSchema.parse([check, a2]))
                ? line1
                : line2,
          inside(b1, polygon1)
            ? line4
            : inside(b2, polygon1)
              ? line3
              : length(lineSchema.parse([check, b1])) <
                  length(lineSchema.parse([check, b2]))
                ? line3
                : line4
        );
      }
    }
  }

  return { intersectionPoints, intersectionSublines: intersectionLines };
}

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

export function lineInsidePolygon(line: Line, polygon: Polygon) {
  return inside(line[0], polygon) && inside(line[1], polygon);
}

export function getCompositePolygon(
  polygon1: Polygon,
  polygon2: Polygon
): Polygon | null {
  const { intersectionPoints, intersectionSublines } = getIntersectionPoints(
    polygon1,
    polygon2
  );

  //handle the case where line is entirely in another line

  if (intersectionPoints.length === 0) return null;

  const aPointsNotWithinB = polygon1.vertices.filter(
    (point) => !inside(point, polygon2)
  );
  const bPointsNotWithinA = polygon2.vertices.filter(
    (point) => !inside(point, polygon1)
  );

  const vertices = sortIntoClockwiseOrder([
    ...intersectionPoints,
    ...aPointsNotWithinB,
    ...bPointsNotWithinA,
  ]);

  const aLinesNotWithinB = polygon1.lines
    .filter((line) => !lineInsidePolygon(line, polygon2))
    .filter(
      (line) => !intersectionPoints.some((point) => insideLine(point, line))
    );
  const bLinesNotWithinA = polygon2.lines
    .filter((line) => !lineInsidePolygon(line, polygon1))
    .filter(
      (line) => !intersectionPoints.some((point) => insideLine(point, line))
    );

  // console.log(
  //   JSON.stringify(
  //     { intersectionSublines, aLinesNotWithinB, bLinesNotWithinA },
  //     null,
  //     2,
  //   ),
  // );

  const lines = sortLinesClockwise([
    ...intersectionSublines,
    ...aLinesNotWithinB,
    ...bLinesNotWithinA,
  ]);

  return polygonSchema.parse({ vertices, lines });
}

export function getCompositePolygons(_polygons: Polygon[]): Polygon[] {
  let polygons = _polygons.slice();
  const polygonsToDraw: Polygon[] = [];

  for (let i = 0; i < polygons.length; i++) {
    let polygon = polygons[0];
    const polygonsToSearch = polygons.slice(1);
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
