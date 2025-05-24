import { z } from "zod";
import { AbsolutePoint, absolutePointSchema } from "./coord";
import { rectSchema } from "./rect";

export const polygon = z
  .object({
    origin: absolutePointSchema,
    target: absolutePointSchema,
    vertices: z.array(absolutePointSchema),
  })
  .brand<"Polygon">();

export type Polygon = z.infer<typeof polygon>;

export function sortIntoClockwiseOrder(points: AbsolutePoint[]) {
  const centerX = points.reduce((p, c) => p + c.x, 0) / points.length;
  const centerY = points.reduce((p, c) => p + c.y, 0) / points.length;

  // Compute angle of each point with respect to the center coordinate
  const pointsAndAngs = points.map((p) => ({
    p: p,
    ang: Math.atan2(centerX - p.x, centerY - p.y),
  }));

  // Sort points by angular value
  const sorted = pointsAndAngs.sort((a, b) => b.ang - a.ang).map((a) => a.p);

  return sorted;
}

export const rectToPolygonSchema = rectSchema.transform((rect) =>
  polygon.parse({
    ...rect,
    vertices: sortIntoClockwiseOrder([
      absolutePointSchema.parse({ x: rect.origin.x, y: rect.origin.y }),
      absolutePointSchema.parse({ x: rect.origin.x, y: rect.target.y }),
      absolutePointSchema.parse({ x: rect.target.x, y: rect.origin.y }),
      absolutePointSchema.parse({ x: rect.target.x, y: rect.target.y }),
    ]),
  }),
);
