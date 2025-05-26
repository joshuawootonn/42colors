import { clipArray } from "polyclip-js";
import { Polygon, polygonSchema } from "./polygon";

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
  } catch (e) {
    //throws when polygon2 is essentially a point
    console.log("error", polygon2);
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
