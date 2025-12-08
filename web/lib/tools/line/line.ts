import { getUniqueChunksFromPoints } from '@/lib/canvas/chunk';

import { ACTION_TYPES } from '../../action-types';
import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/canvas';
import { bresenhamLine } from '../../geometry/bresenham-line';
import { AbsolutePoint } from '../../geometry/coord';
import { getCanvasPolygon } from '../../geometry/polygon';
import { Vector } from '../../geometry/vector';
import { COLOR_TABLE, ColorRef } from '../../palette';
import { InitializedStore, store } from '../../store';
import { uuid } from '../../utils/uuid';
import { hexToRgbaColor } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';
import {
    getAbsolutePoint,
    getBrushPoints,
    getCameraOffset,
    pointsToPixels,
} from '../brush/brush';

export type LineSettings = {
    size: number;
};

export type LineActive = {
    type: typeof ACTION_TYPES.LINE_ACTIVE;
    action_id: string;
    color_ref: ColorRef;
    vector: Vector;
    size: number;
    chunkKeys: string[];
    anchorPoints: AbsolutePoint[];
    points: AbsolutePoint[];
};

export type LineComplete = {
    type: typeof ACTION_TYPES.LINE_COMPLETE;
    action_id: string;
    color_ref: ColorRef;
    vector: Vector;
    size: number;
    chunkKeys: string[];
    anchorPoints: AbsolutePoint[];
    points: AbsolutePoint[];
};

function redrawTelegraph(context: InitializedStore) {
    const pixelTelegraphWebGPUManager =
        context.canvas.pixelTelegraphWebGPUManager;
    if (!pixelTelegraphWebGPUManager) {
        console.error(
            'Telegraph WebGPU manager not available for line telegraph rendering',
        );
        return;
    }

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    // If actively drawing a line, show the line preview as a polygon
    if (
        context.activeAction &&
        context.activeAction.type === ACTION_TYPES.LINE_ACTIVE
    ) {
        const activeLineAction = context.activeAction as LineActive;
        const colorHex = COLOR_TABLE[activeLineAction.color_ref];
        const color = hexToRgbaColor(colorHex);

        // Get line points and expand them with brush size

        // Create polygons for each brush point and union them
        const brushPolygons = activeLineAction.anchorPoints.map((point) =>
            getCanvasPolygon(point.x, point.y, activeLineAction.size),
        );

        if (brushPolygons.length > 0) {
            const webGPUPolygons = brushPolygons.map((polygon) => ({
                polygon,
            }));

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
        return;
    }

    // Otherwise, show cursor preview when hovering
    if (context.interaction.cursorPosition == null) {
        return;
    }

    const clientX = context.interaction.cursorPosition.clientX;
    const clientY = context.interaction.cursorPosition.clientY;
    const absolutePoint = getAbsolutePoint(clientX, clientY, context);

    const colorHex =
        COLOR_TABLE[context.toolSettings.palette.foregroundColorRef];
    const color = hexToRgbaColor(colorHex);

    const cursorPolygon = getCanvasPolygon(
        absolutePoint.x,
        absolutePoint.y,
        context.toolSettings.line.size,
    );

    const webGPUPolygons = [
        {
            polygon: cursorPolygon,
        },
    ];

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

export function startLineAction(
    startPoint: AbsolutePoint,
    color_ref: ColorRef,
    size: number,
): LineActive {
    const anchorPoints = [startPoint];
    const points = getBrushPoints(anchorPoints, size, 1);

    return {
        type: ACTION_TYPES.LINE_ACTIVE,
        action_id: uuid(),
        color_ref,
        vector: new Vector(startPoint.x, startPoint.y, 0, 0),
        size,
        chunkKeys: getUniqueChunksFromPoints(points),
        anchorPoints,
        points,
    };
}

export function nextLineAction(
    activeLineAction: LineActive,
    endPoint: AbsolutePoint,
): LineActive {
    const anchorPoints = bresenhamLine(
        activeLineAction.vector.x,
        activeLineAction.vector.y,
        endPoint.x,
        endPoint.y,
    );

    const points = getBrushPoints(anchorPoints, activeLineAction.size, 1);

    return {
        ...activeLineAction,
        vector: new Vector(
            activeLineAction.vector.x,
            activeLineAction.vector.y,
            endPoint.x - activeLineAction.vector.x,
            endPoint.y - activeLineAction.vector.y,
        ),
        chunkKeys: getUniqueChunksFromPoints(points),
        anchorPoints,
        points,
    };
}

export function completeLineAction(activeLineAction: LineActive): LineComplete {
    const anchorPoints = bresenhamLine(
        activeLineAction.vector.x,
        activeLineAction.vector.y,
        activeLineAction.vector.x + activeLineAction.vector.magnitudeX,
        activeLineAction.vector.y + activeLineAction.vector.magnitudeY,
    );

    const points = getBrushPoints(anchorPoints, activeLineAction.size, 1);

    const uniqueChunkKeys = getUniqueChunksFromPoints(points);

    return {
        type: ACTION_TYPES.LINE_COMPLETE,
        action_id: activeLineAction.action_id,
        color_ref: activeLineAction.color_ref,
        vector: activeLineAction.vector,
        size: activeLineAction.size,
        chunkKeys: uniqueChunkKeys,
        anchorPoints,
        points,
    };
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const startPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    // Alt + click for color picking
    if (e.altKey) {
        return context;
    }

    // Determine color based on mouse button
    const color_ref =
        e.button === 2
            ? context.toolSettings.palette.backgroundColorRef
            : context.toolSettings.palette.foregroundColorRef;

    const nextActiveAction = startLineAction(
        startPoint,
        color_ref,
        context.toolSettings.line.size,
    );

    enqueue.effect(() => {
        store.trigger.updateCurrentAction({ action: nextActiveAction });
    });
    return context;
}

function onPointerMove(
    e: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const endPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    const nextActiveAction = nextLineAction(context.activeAction, endPoint);

    enqueue.effect(() => {
        store.trigger.updateCurrentAction({ action: nextActiveAction });
    });
    return context;
}

function onWheel(
    e: WheelEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const endPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    const nextActiveAction = nextLineAction(context.activeAction, endPoint);

    enqueue.effect(() => {
        store.trigger.updateCurrentAction({ action: nextActiveAction });
    });
    return context;
}

function onPointerOut(
    _: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const action_id = context.activeAction.action_id;
    const lineComplete = completeLineAction(context.activeAction);

    enqueue.effect(() => {
        store.trigger.completeCurrentAction({ action: lineComplete });
        store.trigger.newPixels({
            pixels: pointsToPixels(lineComplete.points, lineComplete.color_ref),
            action_id,
        });
    });

    return context;
}

function onPointerUp(
    _: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const action_id = context.activeAction.action_id;
    const completedAction = completeLineAction(context.activeAction);

    enqueue.effect(() => {
        store.trigger.completeCurrentAction({ action: completedAction });
        store.trigger.newPixels({
            pixels: pointsToPixels(
                completedAction.points,
                completedAction.color_ref,
            ),
            action_id,
        });
    });

    return context;
}

export const LineTool = {
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerOut,
    onWheel,
    redrawTelegraph,
};

export type LineTool = typeof LineTool;
