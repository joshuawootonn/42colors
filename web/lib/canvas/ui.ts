import { getZoomMultiplier } from '../camera';
import { InitializedStore } from '../store';
import { getCameraOffset } from '../tools/brush/brush';
import { Plot } from '../tools/claimer/claimer.rest';
import { isInitialStore } from '../utils/is-initial-store';
import { BLACK, BLUE } from '../webgpu/colors';
import { getPixelSize } from './realtime';

export function redrawUserPlots(context: InitializedStore) {
    const webgpuManager = context.canvas.uiWebGPUManager;
    if (!webgpuManager) return;

    const userPlotData: Plot[] | undefined = context.queryClient.getQueryData([
        'user',
        'plots',
    ]);

    if (userPlotData == null) {
        return;
    }

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    // Prepare all polygons for batch rendering
    const polygonRenderData = userPlotData.map((plot) => ({
        polygon: plot.polygon,
        options: {
            containsMatchingEndpoints: true,
            xOffset,
            yOffset,
            xCamera: context.camera.x,
            yCamera: context.camera.y,
            pixelSize,
            lineWidth: 0.25, // 3px thick lines
            color:
                plot.id === context.toolSettings.claimer.selectedPlotId
                    ? BLUE
                    : BLACK,
        },
    }));

    webgpuManager.redrawPolygons(polygonRenderData);
}

export function renderUI(context: InitializedStore) {
    if (isInitialStore(context)) return;

    redrawUserPlots(context);
}
