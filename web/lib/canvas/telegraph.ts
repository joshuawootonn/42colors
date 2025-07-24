import { HydratedStore } from '../store';
import { BrushTool } from '../tools/brush/brush';
import { ClaimerTool } from '../tools/claimer/claimer';
import { ErasureTool } from '../tools/erasure/erasure';
import { isInitializedStore } from '../utils/is-initial-store';

export function renderTelegraph(context: HydratedStore) {
    if (!isInitializedStore(context)) return;

    const tool = context.toolSettings.currentTool;

    switch (tool) {
        case 'brush':
            BrushTool.redrawTelegraph(context);
            break;
        case 'erasure':
            ErasureTool.redrawTelegraph(context);
            break;
        case 'claimer':
            ClaimerTool.redrawTelegraph(context);
            break;
        default:
            console.log('No telegraph rendering for tool:', tool);
    }
}
