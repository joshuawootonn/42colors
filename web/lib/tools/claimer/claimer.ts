import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/realtime';
import {
    Polygon,
    getCompositePolygons,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { Rect, rectSchema } from '../../geometry/rect';
import { InitializedStore } from '../../store';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint, getCameraOffset } from '../brush';
import { getUserPlots } from './claimer.rest';

export function redrawPolygon(
    ctx: CanvasRenderingContext2D,
    polygon: Polygon,
    {
        xOffset = 0,
        yOffset = 0,
        xCamera = 0,
        yCamera = 0,
        pixelSize = 5,
        containsMatchingEndpoints = false,
    }: {
        xOffset?: number;
        yOffset?: number;
        xCamera?: number;
        yCamera?: number;
        pixelSize?: number;
        containsMatchingEndpoints?: boolean;
    } = {},
) {
    ctx.beginPath();
    ctx.lineWidth = pixelSize / 5;

    const points = containsMatchingEndpoints
        ? polygon.vertices.slice(0, -1)
        : polygon.vertices;

    for (let i = 1; i < points.length + 1; i++) {
        const prevPrev = points[(i - 1) % points.length];
        const prev = points[i % points.length];
        const point = points[(i + 1) % points.length];
        const next = points[(i + 2) % points.length];

        const x0 = prevPrev[0],
            y0 = prevPrev[1];
        const x1 = prev[0],
            y1 = prev[1];
        const x2 = point[0],
            y2 = point[1];
        const x3 = next[0],
            y3 = next[1];

        const xDiff0 = x1 - x0;
        const yDiff0 = y1 - y0;

        const prevDiffType =
            xDiff0 === 0
                ? yDiff0 === 0
                    ? 'zero'
                    : yDiff0 > 0
                      ? 'positiveY'
                      : 'negativeY'
                : xDiff0 > 0
                  ? 'positiveX'
                  : 'negativeX';

        const xDiff = x2 - x1;
        const yDiff = y2 - y1;

        const diffType =
            xDiff === 0
                ? yDiff === 0
                    ? 'zero'
                    : yDiff > 0
                      ? 'positiveY'
                      : 'negativeY'
                : xDiff > 0
                  ? 'positiveX'
                  : 'negativeX';

        const xDiff2 = x3 - x2;
        const yDiff2 = y3 - y2;

        const nextDiffType =
            xDiff2 === 0
                ? yDiff2 === 0
                    ? 'zero'
                    : yDiff2 > 0
                      ? 'positiveY'
                      : 'negativeY'
                : xDiff2 > 0
                  ? 'positiveX'
                  : 'negativeX';

        const moveX = x1 - xCamera + xOffset;
        const moveY = y1 - yCamera + yOffset;

        const lineX = x2 - xCamera + xOffset;
        const lineY = y2 - yCamera + yOffset;

        if (diffType === 'positiveX') {
            if (prevDiffType === 'positiveY') {
                ctx.moveTo(moveX * pixelSize + pixelSize, moveY * pixelSize);
            } else {
                ctx.moveTo(moveX * pixelSize, moveY * pixelSize);
            }
        } else if (diffType === 'negativeX') {
            if (prevDiffType === 'positiveY') {
                ctx.moveTo(
                    moveX * pixelSize + pixelSize,
                    moveY * pixelSize + pixelSize,
                );
            } else {
                ctx.moveTo(moveX * pixelSize, moveY * pixelSize + pixelSize);
            }
        } else if (diffType === 'positiveY') {
            if (prevDiffType === 'positiveX') {
                ctx.moveTo(moveX * pixelSize + pixelSize, moveY * pixelSize);
            } else {
                ctx.moveTo(
                    moveX * pixelSize + pixelSize,
                    moveY * pixelSize + pixelSize,
                );
            }
        } else if (diffType === 'negativeY') {
            if (prevDiffType === 'positiveX') {
                ctx.moveTo(moveX * pixelSize, moveY * pixelSize);
            } else {
                ctx.moveTo(moveX * pixelSize, moveY * pixelSize + pixelSize);
            }
        }

        if (diffType === 'positiveX') {
            if (nextDiffType === 'positiveY') {
                ctx.lineTo(lineX * pixelSize + pixelSize, lineY * pixelSize);
            } else {
                ctx.lineTo(lineX * pixelSize, lineY * pixelSize);
            }
        } else if (diffType === 'negativeX') {
            if (nextDiffType === 'positiveY') {
                ctx.lineTo(
                    lineX * pixelSize + pixelSize,
                    lineY * pixelSize + pixelSize,
                );
            } else {
                ctx.lineTo(lineX * pixelSize, lineY * pixelSize + pixelSize);
            }
        } else if (diffType === 'positiveY') {
            if (nextDiffType === 'positiveX') {
                ctx.lineTo(lineX * pixelSize + pixelSize, lineY * pixelSize);
            } else {
                ctx.lineTo(
                    lineX * pixelSize + pixelSize,
                    lineY * pixelSize + pixelSize,
                );
            }
        } else if (diffType === 'negativeY') {
            if (nextDiffType === 'positiveX') {
                ctx.lineTo(lineX * pixelSize, lineY * pixelSize);
            } else {
                ctx.lineTo(lineX * pixelSize, lineY * pixelSize + pixelSize);
            }
        }

        ctx.stroke();
        ctx.closePath();
    }

    ctx.beginPath();
    for (let i = 1; i < polygon.vertices.length + 1; i++) {
        const prev = polygon.vertices[i - 1];
        const point = polygon.vertices[i % polygon.vertices.length];

        const x1 = prev[0],
            y1 = prev[1];
        const x2 = point[0],
            y2 = point[1];

        const xDiff = x2 - x1;
        const yDiff = y2 - y1;

        const diffType =
            xDiff === 0
                ? yDiff === 0
                    ? 'zero'
                    : yDiff > 0
                      ? 'positiveY'
                      : 'negativeY'
                : xDiff > 0
                  ? 'positiveX'
                  : 'negativeX';

        ctx.moveTo(
            (x1 - xCamera + xOffset) * pixelSize +
                (diffType === 'negativeX' || diffType === 'positiveY'
                    ? pixelSize
                    : 0),
            (y1 - yCamera + yOffset) * pixelSize +
                (diffType === 'negativeX' || diffType === 'negativeY'
                    ? pixelSize
                    : 0),
        );
        ctx.lineTo(
            (x2 - xCamera + xOffset) * pixelSize +
                (diffType === 'positiveX' || diffType === 'positiveY'
                    ? pixelSize
                    : 0),
            (y2 - yCamera + yOffset) * pixelSize +
                (diffType === 'negativeX' || diffType === 'positiveY'
                    ? pixelSize
                    : 0),
        );
    }
    ctx.fill();
}

function redrawTelegraph(context: InitializedStore) {
    const ctx = context.canvas.telegraphCanvasContext;
    const canvas = context.canvas.telegraphCanvas;

    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (context.activeAction?.type !== 'claimer-active') {
        return context;
    }

    ctx.strokeStyle = 'rgb(246, 240, 74)';
    ctx.fillStyle = 'rgba(246, 240, 74, 0.2)';

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

    const rects = [...context.activeAction.rects];
    if (context.activeAction.nextRect != null) {
        rects.push(context.activeAction.nextRect);
    }

    const polygons = rects.map((rect) => rectToPolygonSchema.parse(rect));

    const aggregatedPolygons = getCompositePolygons(polygons);

    const { xOffset, yOffset } = getCameraOffset(context.camera);
    for (let i = 0; i < aggregatedPolygons.length; i++) {
        redrawPolygon(ctx, aggregatedPolygons[i], {
            pixelSize,
            xOffset,
            yOffset,
            xCamera: context.camera.x,
            yCamera: context.camera.y,
        });
    }
}

export type ClaimerComplete = {
    type: 'claimer-complete';
    polygons: Polygon[];
};

export type ClaimerActive = {
    type: 'claimer-active';
    rects: Rect[];
    nextRect: Rect | null;
};

export function startClaimerAction(rect: Rect): ClaimerActive {
    return {
        type: 'claimer-active',
        rects: [],
        nextRect: rect,
    };
}
export function newRectAction(
    activeBrushAction: ClaimerActive,
    rect: Rect,
): ClaimerActive {
    return {
        type: 'claimer-active',
        rects: activeBrushAction.rects,
        nextRect: rect,
    };
}

export function completeRectAction(
    activeBrushAction: ClaimerActive,
): ClaimerActive {
    return {
        type: 'claimer-active',
        rects: activeBrushAction.nextRect
            ? activeBrushAction.rects.concat(activeBrushAction.nextRect)
            : activeBrushAction.rects,
        nextRect: null,
    };
}

export function nextClaimerAction(
    activeBrushAction: ClaimerActive,
    nextRect: Rect,
): ClaimerActive {
    return {
        ...activeBrushAction,
        nextRect,
    };
}

export function completeRectangleClaimerAction(
    polygons: Polygon[],
): ClaimerComplete {
    return {
        type: 'claimer-complete',
        polygons,
    };
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    _: EnqueueObject<{ type: string }>,
): InitializedStore {
    const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

    const rect = rectSchema.parse({
        origin: absolutePoint,
        target: absolutePoint,
    });

    const nextActiveAction =
        context.activeAction?.type !== 'claimer-active'
            ? startClaimerAction(rect)
            : newRectAction(context.activeAction, rect);

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onPointerMove(
    e: PointerEvent,
    context: InitializedStore,
    _: EnqueueObject<{ type: string }>,
): InitializedStore {
    const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== 'claimer-active' ||
        context.activeAction.nextRect == null
    ) {
        return context;
    }

    const rect = rectSchema.parse({
        origin: context.activeAction.nextRect.origin,
        target: absolutePoint,
    });

    const nextActiveAction = nextClaimerAction(context.activeAction, rect);

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onWheel(
    e: WheelEvent,
    context: InitializedStore,
    _: EnqueueObject<{ type: string }>,
): InitializedStore {
    const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

    if (
        context.activeAction?.type !== 'claimer-active' ||
        context.activeAction.nextRect == null
    ) {
        return context;
    }

    const rect = rectSchema.parse({
        origin: context.activeAction.nextRect.origin,
        target: absolutePoint,
    });

    const nextActiveAction = nextClaimerAction(context.activeAction, rect);

    return {
        ...context,
        activeAction: nextActiveAction,
    };
}

function onPointerOut(
    _: PointerEvent,
    context: InitializedStore,
    __: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== 'claimer-active') {
        return context;
    }

    return {
        ...context,
        activeAction: completeRectAction(context.activeAction),
    };
}

function onPointerUp(
    _: PointerEvent,
    context: InitializedStore,
    __: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type !== 'claimer-active') {
        return context;
    }

    return {
        ...context,
        activeAction: completeRectAction(context.activeAction),
    };
}

export const ClaimerTool = {
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerOut,
    onWheel,
    redrawTelegraph,
};

export type ClaimerTool = typeof ClaimerTool;

export { getUserPlots };
