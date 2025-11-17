import { getUniqueChunksFromPoints } from '@/lib/canvas/chunk';

import { ACTION_TYPES } from '../../action-types';
import { Camera, getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/canvas';
import { bresenhamLine } from '../../geometry/bresenham-line';
import {
    AbsolutePoint,
    Pixel,
    Point,
    absolutePointSchema,
    pointSchema,
} from '../../geometry/coord';
import { getCanvasPolygon } from '../../geometry/polygon';
import { COLOR_TABLE, ColorRef } from '../../palette';
import { InitializedStore, store } from '../../store';
import { clientToCanvas } from '../../utils/clientToCanvasConversion';
import { dedupeCoords } from '../../utils/dedupe-coords';
import { newNewCoords } from '../../utils/net-new-coords';
import { uuid } from '../../utils/uuid';
import { hexToRgbaColor } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';

export type BrushSettings = {
    size: number;
};

export function getCameraOffset(camera: Camera): {
    xOffset: number;
    yOffset: number;
    xFloor: number;
    yFloor: number;
} {
    const xFloor = Math.floor(camera.x);
    const yFloor = Math.floor(camera.y);

    const xOffset = camera.x - xFloor;
    const yOffset = camera.y - yFloor;
    return { xOffset, yOffset, xFloor, yFloor };
}

export function getRelativePoint(
    clientX: number,
    clientY: number,
    context: InitializedStore,
): Point {
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const x = clientToCanvas(clientX, context.camera.zoom, xOffset);
    const y = clientToCanvas(clientY, context.camera.zoom, yOffset);
    return pointSchema.parse({ x, y, camera: context.camera });
}

export function getAbsolutePoint(
    clientX: number,
    clientY: number,
    context: InitializedStore,
): AbsolutePoint {
    const { xOffset, yOffset, xFloor, yFloor } = getCameraOffset(
        context.camera,
    );

    const x = clientToCanvas(clientX, context.camera.zoom, xOffset) + xFloor;
    const y = clientToCanvas(clientY, context.camera.zoom, yOffset) + yFloor;
    return absolutePointSchema.parse({ x, y });
}

export function getBrushPoints(
    points: AbsolutePoint[],
    brushSize: number,
    pixelSize: number,
): AbsolutePoint[] {
    const nextPoints: AbsolutePoint[] = [];
    for (let i = 0; i < points.length; i++) {
        const point = points[i];

        switch (brushSize) {
            case 1:
                nextPoints.push({ ...point });
                break;

            case 2:
                nextPoints.push({ ...point });
                nextPoints.push({ ...point, x: point.x - pixelSize });
                nextPoints.push({ ...point, y: point.y - pixelSize });
                nextPoints.push({
                    ...point,
                    x: point.x - pixelSize,
                    y: point.y - pixelSize,
                });
                break;

            case 3:
                nextPoints.push({ ...point });
                nextPoints.push({ ...point, x: point.x - pixelSize });
                nextPoints.push({ ...point, y: point.y - pixelSize });
                nextPoints.push({ ...point, x: point.x + pixelSize });
                nextPoints.push({ ...point, y: point.y + pixelSize });
                break;

            case 4:
                for (let i = -2; i <= 1; i++) {
                    for (let j = -2; j <= 1; j++) {
                        if ((i === -2 || i === 1) && (j === 1 || j === -2))
                            continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            case 5:
                for (let i = -2; i <= 2; i++) {
                    for (let j = -2; j <= 2; j++) {
                        if (Math.abs(i) === 2 && Math.abs(j) === 2) continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            case 6:
                for (let i = -3; i <= 2; i++) {
                    for (let j = -3; j <= 2; j++) {
                        if (i === -3 && j === -3) continue;
                        if (i === -3 && j === 2) continue;
                        if (i === 2 && j === -3) continue;
                        if (i === 2 && j === 2) continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            case 7:
                for (let i = -3; i <= 3; i++) {
                    for (let j = -3; j <= 3; j++) {
                        if (i === -3 && j === -3) continue;
                        if (i === -3 && j === 3) continue;
                        if (i === 3 && j === -3) continue;
                        if (i === 3 && j === 3) continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            case 8:
                for (let i = -4; i <= 3; i++) {
                    for (let j = -4; j <= 3; j++) {
                        if (i === -4 && j === -4) continue;
                        if (i === -4 && j === 3) continue;
                        if (i === 3 && j === -4) continue;
                        if (i === 3 && j === 3) continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            case 9:
                for (let i = -4; i <= 4; i++) {
                    for (let j = -4; j <= 4; j++) {
                        if (i === -4 && j === -4) continue;
                        if (i === -4 && j === 4) continue;
                        if (i === 4 && j === -4) continue;
                        if (i === 4 && j === 4) continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            case 10:
                for (let i = -5; i <= 4; i++) {
                    for (let j = -5; j <= 4; j++) {
                        if (i === -5 && j === -5) continue;
                        if (i === -5 && j === 4) continue;
                        if (i === 4 && j === -5) continue;
                        if (i === 4 && j === 4) continue;
                        nextPoints.push(
                            absolutePointSchema.parse({
                                x: point.x + i * pixelSize,
                                y: point.y + j * pixelSize,
                            }),
                        );
                    }
                }
                break;

            default:
                break;
        }
    }

    return dedupeCoords(nextPoints);
}

function redrawTelegraph(context: InitializedStore) {
    const telegraphWebGPUManager = context.canvas.telegraphWebGPUManager;
    if (!telegraphWebGPUManager) {
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
    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const colorHex =
        COLOR_TABLE[context.toolSettings.palette.foregroundColorRef];
    const color = hexToRgbaColor(colorHex);

    const brushPolygon = getCanvasPolygon(
        absolutePoint.x,
        absolutePoint.y,
        context.toolSettings.brush.size,
    );

    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const webGPUPolygons = [
        {
            polygon: brushPolygon,
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

export function pointsToPixels(
    points: AbsolutePoint[],
    color_ref: ColorRef,
): Pixel[] {
    return points.map(
        (point) =>
            ({
                x: point.x,
                y: point.y,
                color_ref,
            }) as Pixel,
    );
}

export type BrushActive = {
    type: typeof ACTION_TYPES.BRUSH_ACTIVE;
    action_id: string;
    color_ref: ColorRef;
    points: AbsolutePoint[];
    anchorPoints: AbsolutePoint[];
    chunkKeys: string[];
};

export function isDuplicatePoint(
    canvasX: number,
    canvasY: number,
    context: InitializedStore,
) {
    if (context.activeAction?.type !== ACTION_TYPES.BRUSH_ACTIVE) return false;
    const lastPoint = context.activeAction?.points.at(-1);
    return lastPoint?.x === canvasX && lastPoint?.x === canvasY;
}

export function startBrushAction(
    anchorPoint: AbsolutePoint,
    brushPoints: AbsolutePoint[],
    color_ref: ColorRef,
): BrushActive {
    return {
        type: ACTION_TYPES.BRUSH_ACTIVE,
        action_id: uuid(),
        color_ref,
        points: brushPoints,
        anchorPoints: [anchorPoint],
        chunkKeys: getUniqueChunksFromPoints(brushPoints),
    };
}

export function nextBrushAction(
    activeBrushAction: BrushActive,
    newAnchorPoints: AbsolutePoint[],
    newBrushPoints: AbsolutePoint[],
): BrushActive {
    return {
        ...activeBrushAction,
        anchorPoints: activeBrushAction.anchorPoints.concat(newAnchorPoints),
        points: activeBrushAction.points.concat(newBrushPoints),
        chunkKeys: getUniqueChunksFromPoints([
            ...activeBrushAction.points,
            ...newBrushPoints,
        ]),
    };
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const anchorPoint = getAbsolutePoint(e.clientX, e.clientY, context);

    // Alt + click for color picking
    if (e.altKey) {
        // Get the pixel at the clicked position
        // TODO: Implement color picking functionality
        // For now, we'll just prevent the normal brush action
        return context;
    }

    const brushPoints = getBrushPoints(
        [anchorPoint],
        context.toolSettings.brush.size,
        1,
    );

    // Determine color based on mouse button
    // Left button (0) uses foreground color, right button (2) uses background color
    const color_ref =
        e.button === 2
            ? context.toolSettings.palette.backgroundColorRef
            : context.toolSettings.palette.foregroundColorRef;

    const nextActiveAction = startBrushAction(
        anchorPoint,
        brushPoints,
        color_ref,
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
    const { x, y } = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== ACTION_TYPES.BRUSH_ACTIVE ||
        isDuplicatePoint(x, y, context)
    ) {
        return context;
    }

    const newAnchorPoints = bresenhamLine(
        context.activeAction.anchorPoints.at(-1)!.x,
        context.activeAction.anchorPoints.at(-1)!.y,
        x,
        y,
    );

    const netNewAnchors = newNewCoords(
        context.activeAction.anchorPoints,
        newAnchorPoints,
    );

    const newBrushPoints = getBrushPoints(
        netNewAnchors,
        context.toolSettings.brush.size,
        1,
    );

    const nextActiveAction = nextBrushAction(
        context.activeAction,
        newAnchorPoints,
        newBrushPoints,
    );

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
    const { x, y } = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== ACTION_TYPES.BRUSH_ACTIVE ||
        isDuplicatePoint(x, y, context)
    ) {
        return context;
    }

    const newAnchorPoints = bresenhamLine(
        context.activeAction.anchorPoints.at(-1)!.x,
        context.activeAction.anchorPoints.at(-1)!.y,
        x,
        y,
    );

    const netNewAnchors = newNewCoords(
        context.activeAction.anchorPoints,
        newAnchorPoints,
    );

    const newBrushPoints = getBrushPoints(
        netNewAnchors,
        context.toolSettings.brush.size,
        1,
    );

    const nextActiveAction = nextBrushAction(
        context.activeAction,
        newAnchorPoints,
        newBrushPoints,
    );

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
    if (context.activeAction?.type !== ACTION_TYPES.BRUSH_ACTIVE)
        return context;

    const color_ref = context.activeAction.color_ref;
    const points = context.activeAction.points;
    const action_id = context.activeAction.action_id;
    const completedAction = context.activeAction;
    enqueue.effect(() => {
        store.trigger.completeCurrentAction({ action: completedAction });
        store.trigger.newPixels({
            pixels: pointsToPixels(points, color_ref),
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
    if (context.activeAction?.type !== ACTION_TYPES.BRUSH_ACTIVE)
        return context;

    const color_ref = context.activeAction.color_ref;
    const points = context.activeAction.points;
    const action_id = context.activeAction.action_id;

    const completedAction = context.activeAction;
    enqueue.effect(() => {
        store.trigger.completeCurrentAction({ action: completedAction });
        store.trigger.newPixels({
            pixels: pointsToPixels(points, color_ref),
            action_id: action_id,
        });
    });
    return context;
}

export const BrushTool = {
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerOut,
    onWheel,
    redrawTelegraph,
};

export type BrushTool = typeof BrushTool;
