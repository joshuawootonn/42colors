import { z } from "zod";
import { absolutePointSchema } from "../coord";
import { lineSchema } from "../line";

export const bunchOfPointsSchema = z.array(absolutePointSchema);
export const bunchOfLinesSchema = z.array(lineSchema);
