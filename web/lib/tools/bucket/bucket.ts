import { toasts } from '@/components/ui/toast';
import {
    AbsolutePointTuple,
    absolutePointTupleSchema,
    absolutePointTupleToPixels,
} from '@/lib/line';

import { ACTION_TYPES } from '../../action-types';
import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/canvas';
import {
    getChunkKey,
    getChunkOrigin,
    getUniqueChunksFromAbsolutePointTuples,
} from '../../canvas/chunk';
import { getCachedPixelsFromActions } from '../../canvas/realtime';
import { X_MAX, X_MIN, Y_MAX, Y_MIN } from '../../constants';
import { AbsolutePoint, Pixel, getLastPixelValue } from '../../geometry/coord';
import { Polygon, getCanvasPolygon } from '../../geometry/polygon';
import { inside } from '../../geometry/polygon';
import { COLOR_TABLE, ColorRef, TRANSPARENT_REF } from '../../palette';
import { findPlotAtPoint } from '../../plots/plots.rest';
import { InitializedStore, store } from '../../store';
import { uuid } from '../../utils/uuid';
import { hexToRgbaColor } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint, getCameraOffset } from '../brush/brush';

function getPixelColor(
    x: number,
    y: number,
    context: InitializedStore,
): ColorRef {
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

function floodFill(
    startX: number,
    startY: number,
    targetColor: ColorRef,
    context: InitializedStore,
    visited: Set<string>,
    plotPolygon?: Polygon,
): AbsolutePointTuple[] {
    const filledPixels: AbsolutePointTuple[] = [];
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    const visitedSet = visited;

    while (queue.length > 0) {
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
    console.debug(
        'Bucket: Target color at start point',
        targetColor,
        'Fill color',
        color_ref,
    );

    // If target color is already the fill color, we can still fill (allows re-filling)
    // But we need to make sure we're actually finding pixels to fill
    const visited = new Set<string>();
    const points = floodFill(
        startPoint.x,
        startPoint.y,
        targetColor,
        context,
        visited,
        plotPolygon,
    );

    console.debug('Bucket: Flood fill found', points.length, 'pixels');

    return {
        type: ACTION_TYPES.BUCKET_ACTIVE,
        action_id: uuid(),
        color_ref,
        points,
        chunkKeys: getUniqueChunksFromAbsolutePointTuples(points),
    };
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
                label: 'Log in',
                onClick: () => {
                    window.location.href = '/login';
                },
            });
        });
        return context;
    }

    const absolutePointTuple = absolutePointTupleSchema.parse([
        startPoint.x,
        startPoint.y,
    ]);

    const plotAtPoint = findPlotAtPoint(absolutePointTuple, context);
    if (plotAtPoint == null) {
        enqueue.effect(() => {
            toasts.cannotBucketOutsidePlot();
        });
        return context;
    }

    // Verify the plot is owned by the current user
    if (plotAtPoint.userId !== context.user.id) {
        console.debug(
            'Bucket: Plot not owned by user',
            plotAtPoint.userId,
            context.user.id,
        );
        enqueue.effect(() => {
            toasts.cannotBucketOtherPlot();
        });
        return context;
    }

    const color_ref =
        e.button === 2
            ? context.toolSettings.palette.backgroundColorRef
            : context.toolSettings.palette.foregroundColorRef;

    console.debug(
        'Bucket: Starting fill at',
        startPoint,
        'with color',
        color_ref,
    );

    const nextActiveAction = startBucketAction(
        startPoint,
        color_ref,
        context,
        plotAtPoint.polygon,
    );

    console.debug('Bucket: Filled', nextActiveAction.points.length, 'pixels');

    if (nextActiveAction.points.length === 0) {
        console.debug('Bucket: No pixels to fill');
        return context;
    }

    const action_id = nextActiveAction.action_id;
    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: absolutePointTupleToPixels(
                nextActiveAction.points,
                color_ref,
            ),
            action_id,
        });
    });

    return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(nextActiveAction),
    };
}

function onPointerMove(
    _: PointerEvent,
    context: InitializedStore,
    _enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const canvas = context.canvas.rootCanvas;
    if (context.interaction?.cursorPosition == null) {
        canvas.style.cursor = '';
        return context;
    }

    const { clientX, clientY } = context.interaction.cursorPosition;
    const absolutePoint = getAbsolutePoint(clientX, clientY, context);

    if (context.user == null) {
        canvas.style.cursor = 'not-allowed';
        return context;
    }

    const plotAtPoint = findPlotAtPoint(
        absolutePointTupleSchema.parse([absolutePoint.x, absolutePoint.y]),
        context,
    );

    if (plotAtPoint == null || plotAtPoint.userId !== context.user.id) {
        canvas.style.cursor = 'not-allowed';
        return context;
    }

    canvas.style.cursor = 'pointer';
    return context;
}

function redrawTelegraph(context: InitializedStore) {
    const telegraphWebGPUManager = context.canvas.telegraphWebGPUManager;
    if (telegraphWebGPUManager == null) {
        console.error(
            'Telegraph WebGPU manager not available for brush telegraph rendering',
        );
        return;
    }

    if (context.interaction.cursorPosition == null) {
        return;
    }

    const clientX = context.interaction.cursorPosition.clientX;
    const clientY = context.interaction.cursorPosition.clientY;
    const absolutePoint = getAbsolutePoint(clientX, clientY, context);
    const absolutePointTuple = absolutePointTupleSchema.parse([
        absolutePoint.x,
        absolutePoint.y,
    ]);

    if (context.user == null) {
        return;
    }

    const plotAtPoint = findPlotAtPoint(absolutePointTuple, context);
    if (plotAtPoint == null || plotAtPoint.userId !== context.user.id) {
        return;
    }

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const colorHex =
        COLOR_TABLE[context.toolSettings.palette.foregroundColorRef];
    const color = hexToRgbaColor(colorHex);

    // Run flood fill to preview what would be filled
    const targetColor = getPixelColor(
        absolutePoint.x,
        absolutePoint.y,
        context,
    );
    const visited = new Set<string>();
    const previewPixels = floodFill(
        absolutePoint.x,
        absolutePoint.y,
        targetColor,
        context,
        visited,
        plotAtPoint.polygon,
    );

    // Convert pixels to polygons for rendering
    const webGPUPolygons = previewPixels.map((pixel) => ({
        polygon: getCanvasPolygon(pixel[0], pixel[1], 1),
    }));

    if (webGPUPolygons.length === 0) {
        return;
    }

    const { xOffset, yOffset } = getCameraOffset(context.camera);

    telegraphWebGPUManager.redrawPolygons(webGPUPolygons, {
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
