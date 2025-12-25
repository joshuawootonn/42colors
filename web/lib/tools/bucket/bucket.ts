import { toasts } from "@/components/ui/toast";
import {
  AbsolutePointTuple,
  absolutePointTupleSchema,
  absolutePointTupleToPixels,
} from "@/lib/line";

import { ACTION_TYPES } from "../../action-types";
import { isAdminUser } from "../../admin";
import { getZoomMultiplier } from "../../camera";
import { getPixelSize } from "../../canvas/canvas";
import {
  getChunkKey,
  getChunkOrigin,
  getUniqueChunksFromAbsolutePointTuples,
} from "../../canvas/chunk";
import { getCachedPixelsFromActions } from "../../canvas/realtime";
import { X_MAX, X_MIN, Y_MAX, Y_MIN } from "../../constants";
import { AbsolutePoint, Pixel, getLastPixelValue } from "../../geometry/coord";
import { Polygon, getCanvasPolygon } from "../../geometry/polygon";
import { inside } from "../../geometry/polygon";
import { ColorRef, TRANSPARENT_REF } from "../../palette";
import { findPlotAtPoint, searchPlotAtPoint } from "../../plots/plots.rest";
import { InitializedStore, store } from "../../store";
import { isInitialStore } from "../../utils/is-initial-store";
import { uuid } from "../../utils/uuid";
import { getColorFromRef } from "../../webgpu/colors";
import { EnqueueObject } from "../../xstate-internal-types";
import { getAbsolutePoint, getCameraOffset } from "../brush/brush";

function getPixelColor(x: number, y: number, context: InitializedStore): ColorRef {
  // First check realtime actions (most recent changes) using cached pixels
  const { dedupedPixels: actionPixels } = getCachedPixelsFromActions(context);
  const pixelFromActions = getLastPixelValue(actionPixels, {
    x,
    y,
    color_ref: TRANSPARENT_REF,
  } as Pixel);
  if (pixelFromActions != null) {
    return pixelFromActions.color_ref;
  }

  // Fall back to checking chunk canvases
  const chunkOrigin = getChunkOrigin(x, y);
  const chunkKey = getChunkKey(x, y);
  const chunk = context.canvas.chunkCanvases[chunkKey];

  if (chunk == null) {
    return TRANSPARENT_REF;
  }

  const chunkPixelX = x - chunkOrigin.x;
  const chunkPixelY = y - chunkOrigin.y;

  const pixel = chunk.getPixelValue(chunkPixelX, chunkPixelY);
  if (pixel != null) {
    return pixel.color_ref;
  }

  return TRANSPARENT_REF;
}

const MAX_FLOOD_FILL_PIXELS = 50000;
const MAX_TELEGRAPH_PREVIEW_PIXELS = 5000;

function floodFill(
  startX: number,
  startY: number,
  targetColor: ColorRef,
  context: InitializedStore,
  visited: Set<string>,
  plotPolygon?: Polygon,
  maxPixels: number = MAX_FLOOD_FILL_PIXELS,
): AbsolutePointTuple[] {
  const filledPixels: AbsolutePointTuple[] = [];
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const visitedSet = visited;

  while (queue.length > 0) {
    // Safety limit to prevent freezing on very large fills
    if (filledPixels.length >= maxPixels) {
      console.warn("Flood fill hit max pixel limit:", maxPixels);
      break;
    }

    const { x, y } = queue.shift()!;
    const absolutePoint = absolutePointTupleSchema.parse([x, y]);
    const key = `${x},${y}`;

    if (visitedSet.has(key)) {
      continue;
    }

    if (x < X_MIN || x > X_MAX || y < Y_MIN || y > Y_MAX) {
      continue;
    }

    // If we have a plot polygon, only fill pixels within it
    if (plotPolygon && !inside(absolutePoint, plotPolygon)) {
      continue;
    }

    const currentColor = getPixelColor(x, y, context);
    if (currentColor !== targetColor) {
      continue;
    }

    visitedSet.add(key);
    filledPixels.push(absolutePoint);

    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (!visitedSet.has(neighborKey)) {
        queue.push(neighbor);
      }
    }
  }

  return filledPixels;
}

export type BucketActive = {
  type: typeof ACTION_TYPES.BUCKET_ACTIVE;
  action_id: string;
  color_ref: ColorRef;
  points: AbsolutePointTuple[];
  chunkKeys: string[];
};

export function startBucketAction(
  startPoint: AbsolutePoint,
  color_ref: ColorRef,
  context: InitializedStore,
  plotPolygon?: Polygon,
): BucketActive {
  const targetColor = getPixelColor(startPoint.x, startPoint.y, context);
  console.debug("Bucket: Target color at start point", targetColor, "Fill color", color_ref);

  // If target color is already the fill color, we can still fill (allows re-filling)
  // But we need to make sure we're actually finding pixels to fill
  const visited = new Set<string>();
  const points = floodFill(startPoint.x, startPoint.y, targetColor, context, visited, plotPolygon);

  console.debug("Bucket: Flood fill found", points.length, "pixels");

  return {
    type: ACTION_TYPES.BUCKET_ACTIVE,
    action_id: uuid(),
    color_ref,
    points,
    chunkKeys: getUniqueChunksFromAbsolutePointTuples(points),
  };
}

function executeBucketFill(
  startPoint: AbsolutePoint,
  color_ref: ColorRef,
  context: InitializedStore,
  plotPolygon: Polygon | null | undefined,
) {
  console.debug("Bucket: Starting fill at", startPoint, "with color", color_ref);

  const nextActiveAction = startBucketAction(
    startPoint,
    color_ref,
    context,
    plotPolygon ?? undefined,
  );

  console.debug("Bucket: Filled", nextActiveAction.points.length, "pixels");

  if (nextActiveAction.points.length === 0) {
    console.debug("Bucket: No pixels to fill");
    return;
  }

  const action_id = nextActiveAction.action_id;
  store.trigger.completeCurrentAction({ action: nextActiveAction });
  store.trigger.newPixels({
    pixels: absolutePointTupleToPixels(nextActiveAction.points, color_ref),
    action_id,
  });
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const startPoint = getAbsolutePoint(e.clientX, e.clientY, context);

  // Check if the clicked point is within a plot owned by the user
  if (context.user == null) {
    enqueue.effect(() => {
      toasts.loginToUseBucket({
        label: "Log in",
        onClick: () => {
          window.location.href = "/login";
        },
      });
    });
    return context;
  }

  const isAdminOverride =
    isAdminUser(context.user) && context.adminSettings.isAdminCanvasEditingEnabled;

  const absolutePointTuple = absolutePointTupleSchema.parse([startPoint.x, startPoint.y]);
  const userId = context.user.id;

  const color_ref =
    e.button === 2
      ? context.toolSettings.palette.backgroundColorRef
      : context.toolSettings.palette.foregroundColorRef;

  const plotAtPoint = findPlotAtPoint(absolutePointTuple, context);

  // If not found locally, try searching remotely
  if (plotAtPoint == null && !isAdminOverride) {
    enqueue.effect(async () => {
      const remotePlot = await searchPlotAtPoint(absolutePointTuple[0], absolutePointTuple[1]);

      if (remotePlot == null) {
        toasts.cannotBucketOutsidePlot();
        return;
      }

      if (remotePlot.userId !== userId) {
        console.debug("Bucket: Plot not owned by user", remotePlot.userId, userId);
        toasts.cannotBucketOtherPlot();
        return;
      }

      // Found plot remotely, execute bucket fill
      const currentContext = store.getSnapshot().context;
      if (isInitialStore(currentContext)) {
        return;
      }
      executeBucketFill(startPoint, color_ref, currentContext, remotePlot.polygon);
    });
    return context;
  }

  // Verify the plot is owned by the current user (unless admin override)
  if (plotAtPoint != null && plotAtPoint.userId !== userId && !isAdminOverride) {
    console.debug("Bucket: Plot not owned by user", plotAtPoint.userId, userId);
    enqueue.effect(() => {
      toasts.cannotBucketOtherPlot();
    });
    return context;
  }

  // Execute bucket fill immediately (found locally)
  enqueue.effect(() => {
    executeBucketFill(startPoint, color_ref, context, plotAtPoint?.polygon);
  });

  return context;
}

function onPointerMove(
  _: PointerEvent,
  context: InitializedStore,
  _enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const canvas = context.canvas.rootCanvas;
  if (context.interaction?.cursorPosition == null) {
    canvas.style.cursor = "";
    return context;
  }

  const { clientX, clientY } = context.interaction.cursorPosition;
  const absolutePoint = getAbsolutePoint(clientX, clientY, context);

  if (context.user == null) {
    canvas.style.cursor = "not-allowed";
    return context;
  }

  const isAdminOverride =
    isAdminUser(context.user) && context.adminSettings.isAdminCanvasEditingEnabled;

  // Admin with override can bucket anywhere
  if (isAdminOverride) {
    canvas.style.cursor = "pointer";
    return context;
  }

  const plotAtPoint = findPlotAtPoint(
    absolutePointTupleSchema.parse([absolutePoint.x, absolutePoint.y]),
    context,
  );

  if (plotAtPoint == null || plotAtPoint.userId !== context.user.id) {
    canvas.style.cursor = "not-allowed";
    return context;
  }

  canvas.style.cursor = "pointer";
  return context;
}

function redrawTelegraph(context: InitializedStore) {
  const pixelTelegraphWebGPUManager = context.canvas.pixelTelegraphWebGPUManager;
  if (pixelTelegraphWebGPUManager == null) {
    console.error("Telegraph WebGPU manager not available for brush telegraph rendering");
    return;
  }

  if (context.interaction.cursorPosition == null) {
    return;
  }

  const clientX = context.interaction.cursorPosition.clientX;
  const clientY = context.interaction.cursorPosition.clientY;
  const absolutePoint = getAbsolutePoint(clientX, clientY, context);
  const absolutePointTuple = absolutePointTupleSchema.parse([absolutePoint.x, absolutePoint.y]);

  if (context.user == null) {
    return;
  }

  const isAdminOverride =
    isAdminUser(context.user) && context.adminSettings.isAdminCanvasEditingEnabled;

  const plotAtPoint = findPlotAtPoint(absolutePointTuple, context);
  if (!isAdminOverride && (plotAtPoint == null || plotAtPoint.userId !== context.user.id)) {
    return;
  }

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
  const color = getColorFromRef(context.toolSettings.palette.foregroundColorRef);

  // Run flood fill to preview what would be filled (with smaller limit for performance)
  const targetColor = getPixelColor(absolutePoint.x, absolutePoint.y, context);
  const visited = new Set<string>();
  const previewPixels = floodFill(
    absolutePoint.x,
    absolutePoint.y,
    targetColor,
    context,
    visited,
    plotAtPoint?.polygon,
    MAX_TELEGRAPH_PREVIEW_PIXELS,
  );

  // Convert pixels to polygons for rendering
  const webGPUPolygons = previewPixels.map((pixel) => ({
    polygon: getCanvasPolygon(pixel[0], pixel[1], 1),
  }));

  if (webGPUPolygons.length === 0) {
    return;
  }

  const { xOffset, yOffset } = getCameraOffset(context.camera);

  pixelTelegraphWebGPUManager.redrawPolygons(webGPUPolygons, {
    xOffset,
    yOffset,
    xCamera: context.camera.x,
    yCamera: context.camera.y,
    pixelSize,
    color,
    filled: true,
  });
}

export const BucketTool = {
  onPointerDown,
  onPointerMove,
  redrawTelegraph,
};

export type BucketTool = typeof BucketTool;
