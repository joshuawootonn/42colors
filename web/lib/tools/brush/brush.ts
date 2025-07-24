import { Camera, getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/realtime';
import {
    AbsolutePoint,
    Pixel,
    Point,
    absolutePointSchema,
    cursorPositionSchema,
    pointSchema,
} from '../../geometry/coord';
import {
    Polygon,
    getCanvasPolygon,
    polygonSchema,
} from '../../geometry/polygon';
import { AbsolutePointTuple, absolutePointTupleSchema } from '../../line';
import { COLOR_TABLE, ColorRef } from '../../palette';
import { InitializedStore, store } from '../../store';
import {
    canvasToClient,
    clientToCanvas,
} from '../../utils/clientToCanvasConversion';
import { dedupeCoords } from '../../utils/dedupe-coords';
import { newNewCoords } from '../../utils/net-new-coords';
import { Color, hexToRgbaColor } from '../../webgpu/colors';
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
        console.info(
            'Skipping brush telegraph draw since `cursorPosition` is null',
        );
        return;
    }

    const clientX = context.interaction.cursorPosition.clientX;
    const clientY = context.interaction.cursorPosition.clientY;

    const relativePoint = getAbsolutePoint(clientX, clientY, context);
    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const colorHex = COLOR_TABLE[context.toolSettings.palette.currentColorRef];
    const color = hexToRgbaColor(colorHex);

    const brushPolygon = getCanvasPolygon(
        relativePoint.x,
        relativePoint.y,
        context.toolSettings.brush.size,
    );

    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const webGPUPolygons = [
        {
            polygon: brushPolygon,
            options: {
                xOffset,
                yOffset,
                xCamera: context.camera.x,
                yCamera: context.camera.y,
                pixelSize,
                color,
                filled: true,
            },
        },
    ];

    telegraphWebGPUManager.redrawPolygons(webGPUPolygons);
}

export function bresenhamLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
): AbsolutePoint[] {
    const points: AbsolutePoint[] = [];

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        points.push(absolutePointSchema.parse({ x: x0, y: y0 }));

        if (x0 === x1 && y0 === y1) {
            break;
        }

        const e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }

        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return points;
}

export function pointsToPixels(
    points: AbsolutePoint[],
    colorRef: ColorRef,
): Pixel[] {
    return points.map(
        (point) =>
            ({
                x: point.x,
                y: point.y,
                colorRef: colorRef,
            }) as Pixel,
    );
}

export type BrushActive = {
    type: 'brush-active';
    colorRef: ColorRef;
    points: AbsolutePoint[];
    anchorPoints: AbsolutePoint[];
};

export function isDuplicatePoint(
    canvasX: number,
    canvasY: number,
    context: InitializedStore,
) {
    if (context.activeAction?.type !== 'brush-active') return false;
    const lastPoint = context.activeAction?.points.at(-1);
    return lastPoint?.x === canvasX && lastPoint?.x === canvasY;
}

export function startBrushAction(
    anchorPoint: AbsolutePoint,
    brushPoints: AbsolutePoint[],
    colorRef: ColorRef,
): BrushActive {
    return {
        type: 'brush-active',
        colorRef: colorRef,
        points: brushPoints,
        anchorPoints: [anchorPoint],
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
        context.toolSettings.brush.size,
        1,
    );

    const nextActiveAction = startBrushAction(
        anchorPoint,
        brushPoints,
        context.toolSettings.palette.currentColorRef,
    );

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
    const { x, y } = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== 'brush-active' ||
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
    const { x, y } = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== 'brush-active' ||
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
    if (context.activeAction?.type !== 'brush-active') return context;
    const colorRef = context.activeAction.colorRef;
    const points = context.activeAction.points;
    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: pointsToPixels(points, colorRef),
        });
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
    if (context.activeAction?.type !== 'brush-active') return context;

    const colorRef = context.activeAction.colorRef;
    const points = context.activeAction.points;
    enqueue.effect(() => {
        store.trigger.newPixels({
            pixels: pointsToPixels(points, colorRef),
        });
    });
    return {
        ...context,
        activeAction: null,
        actions: context.actions.concat(context.activeAction),
    };
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
