import { z } from "zod";
import { absolutePointSchema } from "../coord";

export const bunchOfPointsSchema = z.array(absolutePointSchema);
