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
};

export type LineComplete = {
    type: typeof ACTION_TYPES.LINE_COMPLETE;
    action_id: string;
    color_ref: ColorRef;
    vector: Vector;
    size: number;
};

function redrawTelegraph(context: InitializedStore) {
    const telegraphWebGPUManager = context.canvas.telegraphWebGPUManager;
    if (!telegraphWebGPUManager) {
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
        const vector = activeLineAction.vector;
        const colorHex = COLOR_TABLE[activeLineAction.color_ref];
        const color = hexToRgbaColor(colorHex);

        // Get line points and expand them with brush size
        const linePoints = bresenhamLine(
            vector.x,
            vector.y,
            vector.x + vector.magnitudeX,
            vector.y + vector.magnitudeY,
        );

        // Create polygons for each brush point and union them
        const brushPolygons = linePoints.map((point) =>
            getCanvasPolygon(point.x, point.y, activeLineAction.size),
        );

        if (brushPolygons.length > 0) {
            const webGPUPolygons = brushPolygons.map((polygon) => ({
                polygon,
            }));

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

export function startLineAction(
    startPoint: AbsolutePoint,
    color_ref: ColorRef,
    size: number,
): LineActive {
    return {
        type: ACTION_TYPES.LINE_ACTIVE,
        action_id: uuid(),
        color_ref,
        vector: new Vector(startPoint.x, startPoint.y, 0, 0),
        size,
    };
}

export function nextLineAction(
    activeLineAction: LineActive,
    endPoint: AbsolutePoint,
): LineActive {
    return {
        ...activeLineAction,
        vector: new Vector(
            activeLineAction.vector.x,
            activeLineAction.vector.y,
            endPoint.x - activeLineAction.vector.x,
            endPoint.y - activeLineAction.vector.y,
        ),
    };
}

export function completeLineAction(activeLineAction: LineActive): LineComplete {
    return {
        type: ACTION_TYPES.LINE_COMPLETE,
        action_id: activeLineAction.action_id,
        color_ref: activeLineAction.color_ref,
        vector: activeLineAction.vector,
        size: activeLineAction.size,
    };
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    _enqueue: EnqueueObject<{ type: string }>,
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

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onPointerMove(
    e: PointerEvent,
    context: InitializedStore,
    _enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const endPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    const nextActiveAction = nextLineAction(context.activeAction, endPoint);

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onWheel(
    e: WheelEvent,
    context: InitializedStore,
    _enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const endPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    const nextActiveAction = nextLineAction(context.activeAction, endPoint);

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onPointerOut(
    _: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const vector = context.activeAction.vector;
    const color_ref = context.activeAction.color_ref;
    const action_id = context.activeAction.action_id;

    const linePoints = bresenhamLine(
        vector.x,
        vector.y,
        vector.x + vector.magnitudeX,
        vector.y + vector.magnitudeY,
    );

    // Apply size to the line points
    const brushPoints = getBrushPoints(
        linePoints,
        context.activeAction.size,
        1,
    );

    const lineComplete = completeLineAction(context.activeAction);

    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: pointsToPixels(brushPoints, color_ref),
            action_id,
        });
    });

    return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(lineComplete),
    };
}

function onPointerUp(
    _: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== ACTION_TYPES.LINE_ACTIVE) {
        return context;
    }

    const vector = context.activeAction.vector;
    const color_ref = context.activeAction.color_ref;
    const action_id = context.activeAction.action_id;

    const linePoints = bresenhamLine(
        vector.x,
        vector.y,
        vector.x + vector.magnitudeX,
        vector.y + vector.magnitudeY,
    );

    // Apply size to the line points
    const brushPoints = getBrushPoints(
        linePoints,
        context.activeAction.size,
        1,
    );

    const lineComplete = completeLineAction(context.activeAction);

    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: pointsToPixels(brushPoints, color_ref),
            action_id,
        });
    });

    return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(lineComplete),
    };
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
