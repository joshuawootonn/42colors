import { z } from "zod";
import { absolutePointSchema } from "../coord";
import { absolutePointTupleSchema, lineSchema } from "../line";

export const bunchOfPointsSchema = z.array(absolutePointSchema);
export const bunchOfTuplePointsSchema = z.array(absolutePointTupleSchema);
export const bunchOfLinesSchema = z.array(lineSchema);
