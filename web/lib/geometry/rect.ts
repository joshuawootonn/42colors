import { z } from "zod";
import { absolutePointSchema } from "./coord";

export const rectSchema = z
  .object({ origin: absolutePointSchema, target: absolutePointSchema })
  .brand<"Rect">();

export type Rect = z.infer<typeof rectSchema>;
