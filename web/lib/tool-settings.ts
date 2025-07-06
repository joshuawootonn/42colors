import { z } from 'zod';

import { colorRefSchema } from './palette';
import { TOOL_SETTINGS } from './storage-keys';
import { BrushSettings } from './tools/brush';
import {
    ClaimerSettings,
    claimerSettingsSchema,
} from './tools/claimer/claimer-settings';
import { ErasureSettings } from './tools/erasure';
import { PaletteSettings } from './tools/palette';

function createToolKey(key: string) {
    return `${TOOL_SETTINGS}-${key}`;
}

function getByKey(key: string) {
    return window.localStorage.getItem(createToolKey(key));
}

const BRUSH_SIZE = 'brush-size';
const ERASURE_SIZE = 'erasure-size';
const PALETTE_IS_OPEN = 'palette-is-open';
const PALETTE_CURRENT_COLOR_REF = 'palette-current-color-ref';
const CLAIMER_SELECTED_PLOT_ID = 'claimer-selected-plot-id';
const CURRENT_TOOL = 'current-tool';

export function updateToolSettings(toolSettings: ToolSettings) {
    window.localStorage.setItem(
        createToolKey(BRUSH_SIZE),
        toolSettings.brush.size.toString(),
    );
    window.localStorage.setItem(
        createToolKey(ERASURE_SIZE),
        toolSettings.erasure.size.toString(),
    );
    window.localStorage.setItem(
        createToolKey(PALETTE_IS_OPEN),
        toolSettings.palette.isOpen.toString(),
    );
    window.localStorage.setItem(
        createToolKey(PALETTE_CURRENT_COLOR_REF),
        toolSettings.palette.currentColorRef.toString(),
    );
    window.localStorage.setItem(
        createToolKey(CLAIMER_SELECTED_PLOT_ID),
        toolSettings.claimer.selectedPlotId?.toString() ?? '',
    );
    window.localStorage.setItem(
        createToolKey(CURRENT_TOOL),
        toolSettings.currentTool,
    );
}

const stringToNumberSchema = z
    .string()
    .transform((val) => z.number().safeParse(parseInt(val)).data);

const stringToBooleanSchema = z
    .string()
    .transform((val) => z.boolean().safeParse(/true/i.test(val)).data);

const stringToColorRefSchema = stringToNumberSchema.transform(
    (val) => colorRefSchema.safeParse(val).data,
);

const toolSchema = z.union([
    z.literal('brush'),
    z.literal('erasure'),
    z.literal('claimer'),
]);

export type Tool = z.infer<typeof toolSchema>;

const stringToToolSchema = z
    .string()
    .transform((val) => toolSchema.safeParse(val).data);

const toolSettingsSchema = z.object({
    brush: z.object({ size: z.number() }),
    erasure: z.object({ size: z.number() }),
    palette: z.object({ isOpen: z.boolean(), currentColorRef: colorRefSchema }),
    claimer: claimerSettingsSchema,
    currentTool: toolSchema,
});

export type ToolSettings = {
    brush: BrushSettings;
    erasure: ErasureSettings;
    palette: PaletteSettings;
    claimer: ClaimerSettings;
    currentTool: Tool;
};

export const DEFAULT_TOOL_SETTINGS = toolSettingsSchema.parse({
    erasure: {
        size: 2,
    },
    brush: {
        size: 2,
    },
    palette: {
        isOpen: true,
        currentColorRef: 1,
    },
    claimer: {
        selectedPlotId: undefined,
    },
    currentTool: 'brush',
});

export function getToolSettings(): ToolSettings | undefined {
    const currentTool = stringToToolSchema.safeParse(getByKey(CURRENT_TOOL));
    const brushSize = stringToNumberSchema.safeParse(getByKey(BRUSH_SIZE));
    const erasureSize = stringToNumberSchema.safeParse(getByKey(ERASURE_SIZE));
    const paletteIsOpen = stringToBooleanSchema.safeParse(
        getByKey(PALETTE_IS_OPEN),
    );
    const paletteCurrentColorRef = stringToColorRefSchema.safeParse(
        getByKey(PALETTE_CURRENT_COLOR_REF),
    );

    const toolSettings: ToolSettings = {
        brush: {
            size: brushSize.data ?? DEFAULT_TOOL_SETTINGS.brush.size,
        },
        erasure: {
            size: erasureSize.data ?? DEFAULT_TOOL_SETTINGS.erasure.size,
        },
        palette: {
            isOpen: paletteIsOpen.data ?? DEFAULT_TOOL_SETTINGS.palette.isOpen,
            currentColorRef:
                paletteCurrentColorRef.data ??
                DEFAULT_TOOL_SETTINGS.palette.currentColorRef,
        },
        claimer: {
            selectedPlotId: undefined,
        },
        currentTool: currentTool.data ?? DEFAULT_TOOL_SETTINGS.currentTool,
    };

    return toolSettings;
}
