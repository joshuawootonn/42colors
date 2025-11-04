import { InitializedStore } from '../store';
import { Tool } from '../tool-settings';
import { BrushTool } from '../tools/brush/brush';
import { ClaimerTool } from '../tools/claimer/claimer';
import { ErasureTool } from '../tools/erasure/erasure';
import { LineTool } from '../tools/line/line';
import { isInitialStore } from '../utils/is-initial-store';

export function renderTelegraph(context: InitializedStore) {
    if (isInitialStore(context)) return;

    context.canvas.telegraphWebGPUManager?.clear();
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
        case Tool.Claimer:
            ClaimerTool.redrawTelegraph(context);
            break;
        default:
            console.log('No telegraph rendering for tool:', tool);
    }
}
