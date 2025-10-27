import { toasts } from '@/components/ui/toast';

import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/canvas';
import {
    Polygon,
    getCompositePolygons,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { Rect, getRectSize, rectSchema } from '../../geometry/rect';
import { InitializedStore } from '../../store';
import { CLAIMER_YELLOW } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint, getCameraOffset } from '../brush/brush';
import { getUserPlots } from './claimer.rest';

function redrawTelegraph(context: InitializedStore) {
    const telegraphWebGPUManager = context.canvas.telegraphWebGPUManager;
    if (!telegraphWebGPUManager) {
        console.error(
            'Telegraph WebGPU manager not available for claimer telegraph rendering',
        );
        return context;
    }

    if (context.activeAction?.type !== 'claimer-active') {
        return context;
    }

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

    const rects = [...context.activeAction.rects];
    if (context.activeAction.nextRect != null) {
        rects.push(context.activeAction.nextRect);
    }

    const polygons = rects.map((rect) => rectToPolygonSchema.parse(rect));

    const aggregatedPolygons = getCompositePolygons(polygons);

    const { xOffset, yOffset } = getCameraOffset(context.camera);

    const webGPUPolygons = aggregatedPolygons.map((polygon) => ({
        polygon,
    }));

    telegraphWebGPUManager.redrawPolygons(webGPUPolygons, {
        xOffset,
        yOffset,
        xCamera: context.camera.x,
        yCamera: context.camera.y,
        pixelSize,
        lineWidth: 0.4,
        color: CLAIMER_YELLOW,
    });
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
    const size = activeBrushAction.nextRect
        ? getRectSize(activeBrushAction.nextRect)
        : 0;

    if (size === 0) {
        return {
            type: 'claimer-active',
            rects: activeBrushAction.rects,
            nextRect: null,
        };
    }

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
    if (!context.user) {
        toasts.loginToClaimLand({
            label: 'login',
            onClick: () => {
                window.location.href = '/login';
            },
        });
        return context;
    }

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
    const completedRectAction = completeRectAction(context.activeAction);

    if (completedRectAction.rects.length === 0) {
        return {
            ...context,
            activeAction: null,
        };
    }

    return {
        ...context,
        activeAction: completedRectAction,
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

    const completedRectAction = completeRectAction(context.activeAction);

    if (completedRectAction.rects.length === 0) {
        return {
            ...context,
            activeAction: null,
        };
    }

    return {
        ...context,
        activeAction: completedRectAction,
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
