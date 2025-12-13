import { Polygon, polygonSchema } from "./polygon";

type Point = [number, number];

/**
 * Simplifies a polygon by removing redundant vertices that cause:
 * 1. Backtracking (going out and coming back on the same line)
 * 2. Collinear segments (unnecessary intermediate points on straight lines)
 * 3. Self-intersecting loops
 *
 * @param polygon - The polygon to simplify
 *
 * Example: [[0,0], [1,0], [1,1], [1,0], [2,0], [2,2], [0,2]]
 * Becomes: [[0,0], [2,0], [2,2], [0,2]]
 */
export function simplifyPolygon(polygon: Polygon): Polygon {
  if (polygon.vertices.length < 3) {
    return polygon;
  }

  let vertices: Point[] = [...polygon.vertices];

  let simplified = false;

  // Keep iterating until no more simplifications can be made
  do {
    simplified = false;
    const newVertices: Point[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const prev = vertices[(i - 1 + vertices.length) % vertices.length];
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];

      // Check if current vertex should be removed
      if (shouldRemoveVertex(prev, curr, next)) {
        simplified = true;
        // Skip this vertex
        continue;
      }

      newVertices.push(curr);
    }

    vertices = newVertices;

    // Need at least 3 vertices for a valid polygon
    if (vertices.length < 3) {
      break;
    }
  } while (simplified);

  // Ensure we have at least 3 vertices
  if (vertices.length < 3) {
    return polygon; // Return original if simplification results in invalid polygon
  }

  // Remove self-intersecting loops, preserving section with dragged vertex if provided
  vertices = removeInternalLoops(vertices);

  // Ensure we still have at least 3 vertices after loop removal
  if (vertices.length < 3) {
    return polygon;
  }

  return polygonSchema.parse({
    vertices: vertices as Polygon["vertices"],
  });
}

/**
 * Determines if a vertex should be removed based on:
 * 1. Duplicate of prev or next
 * 2. Collinearity with neighbors
 * 3. Backtracking (spike that goes out and comes back)
 */
function shouldRemoveVertex(prev: Point, curr: Point, next: Point): boolean {
  // Remove if current is a duplicate of prev
  // (We only check prev to avoid removing both vertices in a consecutive duplicate pair)
  if (curr[0] === prev[0] && curr[1] === prev[1]) {
    return true;
  }

  // If prev and next are the same, curr is between two identical points and should be removed
  if (prev[0] === next[0] && prev[1] === next[1]) {
    return true;
  }

  // Check if the three points are collinear
  if (!areCollinear(prev, curr, next)) {
    return false;
  }

  // Points are collinear - now check if curr is between prev and next
  // or if it's a backtracking spike

  // Check if we're backtracking (curr is NOT between prev and next)
  // This means we went out from prev to curr, then back from curr toward prev to reach next
  if (isBetween(prev, next, curr)) {
    return true;
  }

  // Check if curr is simply a redundant intermediate point between prev and next
  if (isBetween(prev, curr, next)) {
    return true;
  }

  return false;
}

/**
 * Checks if three points are collinear (lie on the same line)
 */
export function areCollinear(p1: Point, p2: Point, p3: Point): boolean {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;

  // Use cross product: (p2 - p1) × (p3 - p1) = 0 for collinear points
  const crossProduct = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);

  // Use small epsilon for floating point comparison
  return Math.abs(crossProduct) < 1e-10;
}

/**
 * Checks if point is between start and end on a line
 */
export function isBetween(start: Point, point: Point, end: Point): boolean {
  const [sx, sy] = start;
  const [px, py] = point;
  const [ex, ey] = end;

  // If point and end are the same, point is not "between" start and end
  if (px === ex && py === ey) {
    return false;
  }

  // If point and start are the same, point is not "between" start and end
  if (px === sx && py === sy) {
    return false;
  }

  const sameXPlane = sx === px && px === ex;
  const sameYPlane = sy === py && py === ey;

  if (!sameXPlane && !sameYPlane) {
    return false;
  }

  if (sameXPlane) {
    return py >= Math.min(sy, ey) && py <= Math.max(sy, ey);
  }

  if (sameYPlane) {
    return px >= Math.min(sx, ex) && px <= Math.max(sx, ex);
  }

  return false;
}

/**
 * Checks if the path from start -> point -> end represents backtracking
 * (going out and coming back on the same line)
 */
export function isBacktracking(start: Point, point: Point, end: Point): boolean {
  // First check if the three points are collinear
  // Backtracking only makes sense for collinear points
  if (!areCollinear(start, point, end)) {
    return false;
  }

  const [sx, sy] = start;
  const [px, py] = point;
  const [ex, ey] = end;

  // Calculate distances
  const distStartToPoint = Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
  const distPointToEnd = Math.sqrt((ex - px) ** 2 + (ey - py) ** 2);
  const distStartToEnd = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);

  // If point is between start and end, it's not backtracking
  if (isBetween(start, point, end)) {
    return false;
  }

  // Check if we're going out and coming back
  // This happens when the distance from start to point + point to end > start to end
  // and point is NOT between start and end
  const totalDistance = distStartToPoint + distPointToEnd;
  const epsilon = 1e-10;

  // If total distance through point is greater than direct distance,
  // and they're collinear, it's backtracking
  return totalDistance > distStartToEnd + epsilon;
}

/**
 * Removes self-intersecting loops from a polygon
 * This handles cases where edges cross each other, creating invalid topology
 * When an intersection is found, keeps the section with the most original points
 *
 * @param vertices - The polygon vertices
 */
export function removeInternalLoops(vertices: Point[]): Point[] {
  if (vertices.length < 4) {
    return vertices; // Need at least 4 vertices to have a self-intersection
  }

  let hasIntersection = true;
  let result = [...vertices];

  // Keep iterating until no more intersections found
  while (hasIntersection && result.length >= 4) {
    hasIntersection = false;

    // Check each edge against all non-adjacent edges
    for (let i = 0; i < result.length; i++) {
      const p1 = result[i];
      const p2 = result[(i + 1) % result.length];

      // Check against all non-adjacent edges
      for (let j = i + 2; j < result.length; j++) {
        // Skip the edge that connects back to the start
        if (i === 0 && j === result.length - 1) {
          continue;
        }

        const p3 = result[j];
        const p4 = result[(j + 1) % result.length];

        // Calculate intersection point if segments intersect
        const intersection = getSegmentIntersection(p1, p2, p3, p4);

        if (intersection) {
          // Found an intersection - determine which section to keep
          const beforeLoop = result.slice(0, i + 1);
          const loopSection = result.slice(i + 1, j + 1);
          const afterLoop = result.slice(j + 1);

          // Choose the loop with the most original points
          const nonLoopSection = [...beforeLoop, ...afterLoop];

          if (loopSection.length > nonLoopSection.length) {
            // Keep the loop section (has more original points)
            result = [...loopSection, intersection];
          } else {
            // Keep before and after (has more original points)
            result = [...beforeLoop, intersection, ...afterLoop];
          }

          hasIntersection = true;
          break;
        }
      }

      if (hasIntersection) {
        break;
      }
    }
  }

  return result;
}

/**
 * Gets the intersection point of two line segments, or null if they don't intersect
 * Segments are defined by (p1,p2) and (p3,p4)
 */
function getSegmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const [x4, y4] = p4;

  // Calculate direction of the three points
  const d1 = direction(p1, p2, p3);
  const d2 = direction(p1, p2, p4);
  const d3 = direction(p3, p4, p1);
  const d4 = direction(p3, p4, p2);

  // Segments intersect if they have different orientations
  if (d1 !== d2 && d3 !== d4) {
    // Calculate intersection point using line equation
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denominator) < 1e-10) {
      return null; // Lines are parallel
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;

    const intersectionX = x1 + t * (x2 - x1);
    const intersectionY = y1 + t * (y2 - y1);

    // Round to avoid floating point errors for axis-aligned lines
    const roundedX =
      Math.abs(Math.round(intersectionX) - intersectionX) < 1e-10
        ? Math.round(intersectionX)
        : intersectionX;
    const roundedY =
      Math.abs(Math.round(intersectionY) - intersectionY) < 1e-10
        ? Math.round(intersectionY)
        : intersectionY;

    return [roundedX, roundedY];
  }

  // Check for collinear cases - we don't want to handle these as intersections
  // because they represent touching/overlapping segments, not crossing
  return null;
}

/**
 * Returns the direction/orientation of ordered triplet (p, q, r)
 * Returns:
 *  0 if collinear
 *  1 if clockwise
 * -1 if counterclockwise
 */
function direction(p: Point, q: Point, r: Point): number {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);

  if (Math.abs(val) < 1e-10) return 0; // Collinear
  return val > 0 ? 1 : -1; // Clockwise or counterclockwise
}
