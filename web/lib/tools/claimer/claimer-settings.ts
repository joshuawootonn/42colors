import { z } from "zod";

export const claimerSettingsSchema = z.object({
  selectedPlotId: z.number().optional(),
});

export type ClaimerSettings = z.infer<typeof claimerSettingsSchema>;
