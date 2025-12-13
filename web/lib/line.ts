import { z } from "zod";

import { Pixel } from "./geometry/coord";
import { ColorRef } from "./palette";

export const absolutePointTupleSchema = z
  .tuple([z.number(), z.number()])
  .brand<"Absolute Point in Tuple">();

export type AbsolutePointTuple = z.infer<typeof absolutePointTupleSchema>;

export function absolutePointTupleToPixels(
  points: AbsolutePointTuple[],
  color_ref: ColorRef,
): Pixel[] {
  return points.map(
    (point) =>
      ({
        x: point[0],
        y: point[1],
        color_ref,
      }) as Pixel,
  );
}
