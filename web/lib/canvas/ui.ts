import { createAtom } from "@xstate/store";

import { getZoomMultiplier } from "../camera";
import { findPlotById } from "../plots/plots.rest";
import { InitializedStore } from "../store";
import { getCameraOffset } from "../tools/brush/brush";
import { isInitialStore } from "../utils/is-initial-store";
import { BLUE, DARK_RED, LIGHT_GRAY } from "../webgpu/colors";
import { LineItem } from "../webgpu/web-gpu-manager";
import { getPixelSize, getSizeInPixelsPlusBleed } from "./canvas";
import { getFullsizeHeight, getFullsizeWidth } from "./fullsize";

export function redrawSelectedPlot(context: InitializedStore) {
  const webgpuManager = context.canvas.uiWebGPUManager;
  if (!webgpuManager) return;

  const selectedPlotId = context.toolSettings.claimer.selectedPlotId;
  if (selectedPlotId == null) return;

  const selectedPlot = findPlotById(selectedPlotId, context);
  if (selectedPlot?.polygon == null) return;

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
  const { xOffset, yOffset } = getCameraOffset(context.camera);

  webgpuManager.redrawPolygons([{ polygon: selectedPlot.polygon }], {
    xOffset,
    yOffset,
    xCamera: context.camera.x,
    yCamera: context.camera.y,
    pixelSize,
    containsMatchingEndpoints: true,
    lineWidth: 0.37,
    color: BLUE,
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
    const timer = current.rejected_plot_ids.has(plotId) && current.rejected_plot_ids.get(plotId);
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

  const polygonItems = Array.from(rejectedPlotsIds.rejected_plot_ids.keys())
    .map((plotId) => findPlotById(plotId, context)?.polygon)
    .filter((polygon) => polygon != null)
    .map((polygon) => ({ polygon }));

  if (polygonItems.length === 0) return;

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
  const { xOffset, yOffset } = getCameraOffset(context.camera);

  webgpuManager.redrawPolygons(polygonItems, {
    xOffset,
    yOffset,
    xCamera: context.camera.x,
    yCamera: context.camera.y,
    pixelSize,
    containsMatchingEndpoints: true,
    lineWidth: 0.5,
    color: DARK_RED,
    filled: false,
  });
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
    cameraMode: "absolute",
  });
}

export function renderUI(context: InitializedStore) {
  if (isInitialStore(context)) return;

  context.canvas.uiWebGPUManager.clear();

  redrawSelectedPlot(context);
  redrawRejectedPlots(context);
  redrawCrosshair(context);
}
