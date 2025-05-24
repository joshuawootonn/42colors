import { z } from "zod";
import { Rect as Rect, rectSchema } from "./rect";
import { absolutePointSchema } from "./coord";

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
