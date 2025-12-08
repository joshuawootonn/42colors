import { InitializedStore } from '../store';
import { Tool } from '../tool-settings';
import { BrushTool } from '../tools/brush/brush';
import { BucketTool } from '../tools/bucket/bucket';
import { ClaimerTool } from '../tools/claimer/claimer';
import { ErasureTool } from '../tools/erasure/erasure';
import { LineTool } from '../tools/line/line';
import { isInitialStore } from '../utils/is-initial-store';

export function renderPixelTelegraph(context: InitializedStore) {
    if (isInitialStore(context)) return;

    context.canvas.pixelTelegraphWebGPUManager?.clear();
    const tool = context.toolSettings.currentTool;

    switch (tool) {
        case Tool.Brush:
            BrushTool.redrawTelegraph(context);
            break;
        case Tool.Erasure:
            ErasureTool.redrawTelegraph(context);
            break;
        case Tool.Line:
            LineTool.redrawTelegraph(context);
            break;
        case Tool.Bucket:
            BucketTool.redrawTelegraph(context);
            break;
    }
}

export function renderUITelegraph(context: InitializedStore) {
    if (isInitialStore(context)) return;

    context.canvas.uiTelegraphWebGPUManager?.clear();
    const tool = context.toolSettings.currentTool;

    switch (tool) {
        case Tool.Claimer:
            ClaimerTool.redrawTelegraph(context);
            break;
    }
}
