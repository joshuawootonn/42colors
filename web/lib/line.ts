import { z } from "zod";

export const absolutePointTupleSchema = z
  .tuple([z.number(), z.number()])
  .brand<"Absolute Point in Tuple">();

export type AbsolutePointTuple = z.infer<typeof absolutePointTupleSchema>;

export const lineSchema = z
  .tuple([absolutePointTupleSchema, absolutePointTupleSchema])
  .brand<"Line">();

export type Line = z.infer<typeof lineSchema>;

function distance(a: AbsolutePointTuple, b: AbsolutePointTuple): number {
  return Math.sqrt(
    Math.pow(Math.abs(a[0] - b[0]), 2) + Math.pow(Math.abs(a[1] - b[1]), 2),
  );
}

export function length(line: Line): number {
  return distance(line[0], line[1]);
}

export function insideLine(point: AbsolutePointTuple, line: Line): boolean {
  if (length(line) === distance(line[0], point) + distance(line[1], point))
    return true;

  return false;
}
