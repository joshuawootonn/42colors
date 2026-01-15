import { z } from "zod";

import { Tool } from "../../tool-settings";

export const shapePickerSettingsSchema = z.object({
  lastTool: z.nativeEnum(Tool),
});

export type ShapePickerSettings = z.infer<typeof shapePickerSettingsSchema>;
