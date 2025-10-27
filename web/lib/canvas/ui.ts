import { createAtom } from '@xstate/store';

import { getZoomMultiplier } from '../camera';
import { InitializedStore } from '../store';
import { getCameraOffset } from '../tools/brush/brush';
import { Plot } from '../tools/claimer/claimer.rest';
import { isInitialStore } from '../utils/is-initial-store';
import { BLUE, DARK_RED, LIGHT_GRAY } from '../webgpu/colors';
import { LineItem, RedrawPolygonsItem } from '../webgpu/web-gpu-manager';
import { getPixelSize, getSizeInPixelsPlusBleed } from './canvas';
import { getFullsizeHeight, getFullsizeWidth } from './fullsize';

export function redrawSelectedPlot(context: InitializedStore) {
    const webgpuManager = context.canvas.uiWebGPUManager;
    if (!webgpuManager) return;

    const cachedPlots = context.queryClient
        .getQueriesData({ queryKey: ['plots'] })
        .flatMap(([_, data]) => (data as Plot[]) || []);

    if (cachedPlots == null) return;

    // Prepare all polygons for batch rendering
    const selectedPlots = cachedPlots.filter(
        (plot) => plot.id === context.toolSettings.claimer.selectedPlotId,
    );

    if (selectedPlots.length === 0) return;

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const polygonRenderData = selectedPlots.map((plot) => ({
        polygon: plot.polygon,
        options: {
            containsMatchingEndpoints: true,
            xOffset,
            yOffset,
            xCamera: context.camera.x,
            yCamera: context.camera.y,
            pixelSize,
            lineWidth: 0.37,
            color: BLUE,
        },
    }));

    webgpuManager.redrawPolygons(polygonRenderData);
}

export function redrawSelectedPlotHandles(context: InitializedStore) {
    const webgpuManager = context.canvas.uiWebGPUManager;
    if (!webgpuManager) return;

    const cachedPlots = context.queryClient
        .getQueriesData({ queryKey: ['plots'] })
        .flatMap(([_, data]) => (data as Plot[]) || []);

    if (cachedPlots == null) return;

    const selectedPlot = cachedPlots.find(
        (plot) => plot.id === context.toolSettings.claimer.selectedPlotId,
    );

    if (!selectedPlot) return;

    // Only show handles if this plot belongs to the current user
    if (context.user?.id !== selectedPlot.userId) return;

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const lines: LineItem[] = (selectedPlot.polygon?.vertices || []).map(
        ([x, y]) => ({
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            color: LIGHT_GRAY,
            thickness: 0.45,
        }),
    );

    if (lines.length === 0) return;

    webgpuManager.redrawLines(lines, {
        xOffset,
        yOffset,
        xCamera: context.camera.x,
        yCamera: context.camera.y,
        pixelSize,
        cameraMode: 'relative',
    });
}

type PlotFlickerState = {
    rejected_plot_ids: Map<number, NodeJS.Timeout>;
};

export const rejectedPlotIdsAtom = createAtom<PlotFlickerState>({
    rejected_plot_ids: new Map<number, NodeJS.Timeout>(),
});

type CrosshairState = {
    visible: boolean;
    timeout?: NodeJS.Timeout;
};

export const crosshairAtom = createAtom<CrosshairState>({
    visible: false,
});

export function showCrosshair() {
    const current = crosshairAtom.get();

    // Clear existing timeout if any
    if (current.timeout) {
        clearTimeout(current.timeout);
    }

    // Show crosshair and set new timeout
    const timeout = setTimeout(() => {
        crosshairAtom.set({ visible: false });
    }, 4000);

    crosshairAtom.set({ visible: true, timeout });
}

export function startRejectedPlotsAnimation(rejected_plot_ids: number[]) {
    const current = rejectedPlotIdsAtom.get();

    for (const plotId of rejected_plot_ids) {
        const timer =
            current.rejected_plot_ids.has(plotId) &&
            current.rejected_plot_ids.get(plotId);
        if (timer) clearTimeout(timer);

        current.rejected_plot_ids.set(
            plotId,
            setTimeout(() => {
                current.rejected_plot_ids.delete(plotId);
            }, 2000),
        );
    }
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

export function redrawCrosshair(context: InitializedStore) {
    const webgpuManager = context.canvas.uiWebGPUManager;
    if (!webgpuManager) return;

    const crosshairState = crosshairAtom.get();
    if (!crosshairState.visible) return;

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

    const canvasWidth = getFullsizeWidth();
    const canvasHeight = getFullsizeHeight();

    const canvasPixelWidth = getSizeInPixelsPlusBleed(canvasWidth, pixelSize);
    const canvasPixelHeight = getSizeInPixelsPlusBleed(canvasHeight, pixelSize);
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const centerX = Math.floor(canvasPixelWidth / 2);
    const centerY = Math.floor(canvasPixelHeight / 2);

    const crosshairSize = 0.5; // Size of crosshair arms in world units
    const lineThickness = 0.25; // Thickness in world units

    const lines: LineItem[] = [
        // Horizontal line
        {
            startX: centerX - crosshairSize,
            startY: centerY,
            endX: centerX + crosshairSize,
            endY: centerY,
            color: LIGHT_GRAY,
            thickness: lineThickness,
        },
        // Vertical line
        {
            startX: centerX,
            startY: centerY - crosshairSize,
            endX: centerX,
            endY: centerY + crosshairSize,
            color: LIGHT_GRAY,
            thickness: lineThickness,
        },
    ];

    webgpuManager.redrawLines(lines, {
        xOffset,
        yOffset,
        xCamera: context.camera.x,
        yCamera: context.camera.y,
        pixelSize,
        cameraMode: 'absolute',
    });
}

export function renderUI(context: InitializedStore) {
    if (isInitialStore(context)) return;

    context.canvas.uiWebGPUManager.clear();

    redrawSelectedPlot(context);
    redrawRejectedPlots(context);
    redrawSelectedPlotHandles(context);
    redrawCrosshair(context);
}
