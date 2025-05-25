import { z } from "zod";
import { AbsolutePoint, absolutePointSchema } from "./coord";

export const lineSchema = z
  .tuple([absolutePointSchema, absolutePointSchema])
  .brand<"Line">();

export type Line = z.infer<typeof lineSchema>;

function distance(a: AbsolutePoint, b: AbsolutePoint): number {
  return Math.sqrt(
    Math.pow(Math.abs(a.x - b.x), 2) + Math.pow(Math.abs(a.y - b.y), 2),
  );
}

function length(line: Line): number {
  return distance(line[0], line[1]);
}

export function insideLine(point: AbsolutePoint, line: Line): boolean {
  console.log({
    total: length(line),
    one: distance(line[0], point),
    two: distance(line[1], point),
  });
  if (length(line) === distance(line[0], point) + distance(line[1], point))
    return true;

  return false;
}
