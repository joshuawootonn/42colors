import { z } from "zod";
import { colorRefSchema } from "./palette";
export const pixelSchema = z
  .object({ x: z.number(), y: z.number(), colorRef: colorRefSchema })
  .brand<"Pixel">();

export type Pixel = z.infer<typeof pixelSchema>;
