import { z } from "zod";
import { absolutePointSchema } from "../geometry/coord";
import { absolutePointTupleSchema } from "../line";

export const bunchOfPointsSchema = z.array(absolutePointSchema);
export const bunchOfTuplePointsSchema = z.array(absolutePointTupleSchema);
