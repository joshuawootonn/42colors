import { z } from "zod";
import { TOOL_SETTINGS } from "./storage-keys";
import { BrushSettings } from "./tools/brush";
import { ErasureSettings } from "./tools/erasure";

const toolSettingsSchema = z.object({
  brush: z.object({ size: z.number() }),
  erasure: z.object({ size: z.number() }),
});

export type ToolSettings = {
  brush: BrushSettings;
  erasure: ErasureSettings;
};

export const DEFAULT_TOOL_SETTINGS = {
  erasure: {
    size: 2,
  },
  brush: {
    size: 2,
  },
};

export function updateToolSettings(toolSettings: ToolSettings) {
  window.localStorage.setItem(TOOL_SETTINGS, JSON.stringify(toolSettings));
}

const optionalToolSettingsSchema = z.string().transform((val) => {
  try {
    const json = JSON.parse(val);
    return toolSettingsSchema.optional().parse(json);
  } catch {
    return;
  }
});

export function getToolSettings(): ToolSettings | undefined {
  const value = window.localStorage.getItem(TOOL_SETTINGS);

  const toolSettingsOption = optionalToolSettingsSchema.safeParse(value);

  if (!toolSettingsOption.success) {
    return;
  }

  return toolSettingsOption.data;
}
