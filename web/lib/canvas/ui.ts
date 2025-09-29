import { createAtom } from '@xstate/store';

import { getZoomMultiplier } from '../camera';
import { InitializedStore } from '../store';
import { getCameraOffset } from '../tools/brush/brush';
import { Plot } from '../tools/claimer/claimer.rest';
import { isInitialStore } from '../utils/is-initial-store';
import { BLACK, BLUE, DARK_RED } from '../webgpu/colors';
import { RedrawPolygonsItem } from '../webgpu/web-gpu-manager';
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

type PlotFlickerState = {
    rejected_plot_ids: Set<number>;
};

export const rejectedPlotIdsAtom = createAtom<PlotFlickerState>({
    rejected_plot_ids: new Set<number>(),
});

export function startRejectedPlotsAnimation(plot_ids: number[]) {
    rejectedPlotIdsAtom.set({
        rejected_plot_ids: new Set(plot_ids),
    });

    setTimeout(() => {
        rejectedPlotIdsAtom.set({
            rejected_plot_ids: new Set<number>(),
        });
    }, 2000);
}

export function redrawRejectedPlots(context: InitializedStore) {
    const webgpuManager = context.canvas.uiWebGPUManager;
    if (!webgpuManager) return;

    const rejectedPlotsIds = rejectedPlotIdsAtom.get();

    if (rejectedPlotsIds.rejected_plot_ids.size === 0) return;

    const cachedPlots = context.queryClient
        .getQueriesData({ queryKey: ['plots'] })
        .flatMap(([_, data]) => (data as Plot[]) || []);

    if (cachedPlots.length === 0) return;

    const rejectedPlots = cachedPlots.filter((plot) =>
        rejectedPlotsIds.rejected_plot_ids.has(plot.id),
    );

    if (rejectedPlots.length === 0) return;

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const polygonItems: RedrawPolygonsItem[] = [];

    rejectedPlots.forEach((plot) => {
        polygonItems.push({
            polygon: plot.polygon,
            options: {
                containsMatchingEndpoints: true,
                xOffset,
                yOffset,
                xCamera: context.camera.x,
                yCamera: context.camera.y,
                pixelSize,
                lineWidth: 0.5,
                color: DARK_RED,
                filled: false,
            },
        });
    });

    webgpuManager.redrawPolygons(polygonItems);
}

export function renderUI(context: InitializedStore) {
    if (isInitialStore(context)) return;

    redrawUserPlots(context);
    redrawRejectedPlots(context);
}
