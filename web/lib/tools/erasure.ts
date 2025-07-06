import { getZoomMultiplier } from '../camera';
import { getPixelSize } from '../canvas/realtime';
import { AbsolutePoint, cursorPositionSchema } from '../geometry/coord';
import { BLACK_REF, COLOR_TABLE, TRANSPARENT_REF } from '../palette';
import { InitializedStore, store } from '../store';
import { canvasToClient } from '../utils/clientToCanvasConversion';
import { newNewCoords } from '../utils/net-new-coords';
import { EnqueueObject } from '../xstate-internal-types';
import {
    bresenhamLine,
    getAbsolutePoint,
    getBrushPoints,
    getRelativePoint,
    isDuplicatePoint,
    pointsToPixels,
} from './brush';
import { drawBrushOutline } from './brush-rendering';

export type ErasureSettings = {
    size: number;
};

function redrawTelegraph(context: InitializedStore) {
    if (context.interaction.cursorPosition == null) {
        console.info(
            'Skipping erasure telegraph draw since `cursorPosition` is null',
        );
        return;
    }

    const clientX = context.interaction.cursorPosition.clientX;
    const clientY = context.interaction.cursorPosition.clientY;
    const relativePoint = getRelativePoint(clientX, clientY, context);
    const ctx = context.canvas.telegraphCanvasContext;
    const canvas = context.canvas.telegraphCanvas;

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLOR_TABLE[BLACK_REF];

    const cursorPosition = cursorPositionSchema.parse({
        x: canvasToClient(relativePoint.x, context.camera.zoom),
        y: canvasToClient(relativePoint.y, context.camera.zoom),
        camera: context.camera,
    });

    ctx.strokeStyle = 'black';
    drawBrushOutline(
        ctx,
        cursorPosition,
        context.toolSettings.erasure.size,
        pixelSize,
    );
    ctx.stroke();
}

export type ErasureActive = {
    type: 'erasure-active';
    points: AbsolutePoint[];
    anchorPoints: AbsolutePoint[];
};

export function startErasureAction(
    anchorPoint: AbsolutePoint,
    erasurePoints: AbsolutePoint[],
): ErasureActive {
    return {
        type: 'erasure-active',
        points: erasurePoints,
        anchorPoints: [anchorPoint],
    };
}

export function nextErasureAction(
    activeBrushAction: ErasureActive,
    newAnchorPoints: AbsolutePoint[],
    newErasurePoints: AbsolutePoint[],
): ErasureActive {
    return {
        ...activeBrushAction,
        anchorPoints: activeBrushAction.anchorPoints.concat(newAnchorPoints),
        points: activeBrushAction.points.concat(newErasurePoints),
    };
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const anchorPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    const brushPoints = getBrushPoints(
        [anchorPoint],
        context.toolSettings.erasure.size,
        1,
    );

    const nextActiveAction = startErasureAction(anchorPoint, brushPoints);

    enqueue.effect(() => {
        store.trigger.redrawRealtimeCanvas();
    });
    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onPointerMove(
    e: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const anchorPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== 'erasure-active' ||
        isDuplicatePoint(anchorPoint.x, anchorPoint.y, context)
    ) {
        return context;
    }

    const newAnchorPoints = bresenhamLine(
        context.activeAction.anchorPoints.at(-1)!.x,
        context.activeAction.anchorPoints.at(-1)!.y,
        anchorPoint.x,
        anchorPoint.y,
    );

    const netNewAnchors = newNewCoords(
        context.activeAction.anchorPoints,
        newAnchorPoints,
    );

    const newBrushPoints = getBrushPoints(
        netNewAnchors,
        context.toolSettings.erasure.size,
        1,
    );

    const nextActiveAction = nextErasureAction(
        context.activeAction,
        newAnchorPoints,
        newBrushPoints,
    );

    enqueue.effect(() => {
        store.trigger.redrawRealtimeCanvas();
    });

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onWheel(
    e: WheelEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const anchorPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== 'erasure-active' ||
        isDuplicatePoint(anchorPoint.x, anchorPoint.y, context)
    ) {
        return context;
    }

    const newAnchorPoints = bresenhamLine(
        context.activeAction.anchorPoints.at(-1)!.x,
        context.activeAction.anchorPoints.at(-1)!.y,
        anchorPoint.x,
        anchorPoint.y,
    );

    const netNewAnchors = newNewCoords(
        context.activeAction.anchorPoints,
        newAnchorPoints,
    );

    const newBrushPoints = getBrushPoints(
        netNewAnchors,
        context.toolSettings.erasure.size,
        1,
    );

    const nextActiveAction = nextErasureAction(
        context.activeAction,
        newAnchorPoints,
        newBrushPoints,
    );

    enqueue.effect(() => {
        store.trigger.redrawRealtimeCanvas();
    });

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
    if (context.activeAction?.type !== 'erasure-active') return context;

    const points = context.activeAction.points;
    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: pointsToPixels(points, TRANSPARENT_REF),
        });
        store.trigger.redrawRealtimeCanvas();
    });

    return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(context.activeAction),
    };
}

function onPointerUp(
    _: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== 'erasure-active') return context;

    const points = context.activeAction.points;
    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: pointsToPixels(points, TRANSPARENT_REF),
        });
        store.trigger.redrawRealtimeCanvas();
    });

    return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(context.activeAction),
    };
}

export const ErasureTool = {
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerOut,
    onWheel,
    redrawTelegraph,
};

export type ErasureTool = typeof ErasureTool;
