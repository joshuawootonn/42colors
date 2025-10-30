import { toasts } from '@/components/ui/toast';

import { ACTION_TYPES } from '../../action-types';
import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/canvas';
import {
    Polygon,
    getCompositePolygons,
    getPolygonSize,
    polygonSchema,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { Rect, getRectSize, rectSchema } from '../../geometry/rect';
import { simplifyPolygon } from '../../geometry/simplify-polygon';
import { InitializedStore } from '../../store';
import { CLAIMER_YELLOW, GRAY_800 } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint, getCameraOffset } from '../brush/brush';
import { getUserPlots } from './claimer.rest';

function updateCursor(context: InitializedStore): void {
    // Only update cursor when in edit or resize mode
    if (
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_EDIT
    ) {
        return;
    }

    const canvas = context.canvas.rootCanvas;
    if (!context.interaction?.cursorPosition) {
        canvas.style.cursor = '';
        return;
    }

    // If actively resizing, show grabbing cursor
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE) {
        canvas.style.cursor = 'grabbing';
        return;
    }

    // In edit mode, show grab cursor when near a handle
    const { clientX, clientY } = context.interaction.cursorPosition;
    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    // Convert screen coordinates to world coordinates
    const worldX = (clientX - xOffset) / pixelSize + context.camera.x;
    const worldY = (clientY - yOffset) / pixelSize + context.camera.y;

    const polygon = context.activeAction.polygon;

    // Check if cursor is near any vertex (handle)
    const handleProximity = 0.5; // world units
    const isNearHandle = polygon.vertices.some(
        ([vx, vy]) =>
            Math.abs(vx - worldX) <= handleProximity &&
            Math.abs(vy - worldY) <= handleProximity,
    );

    canvas.style.cursor = isNearHandle ? 'grab' : '';
}

function redrawTelegraph(context: InitializedStore) {
    const telegraphWebGPUManager = context.canvas.telegraphWebGPUManager;
    if (!telegraphWebGPUManager) {
        console.error(
            'Telegraph WebGPU manager not available for claimer telegraph rendering',
        );
        return context;
    }

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    if (
        context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE
    ) {
        const polygon =
            context.activeAction.type === ACTION_TYPES.CLAIMER_RESIZE
                ? context.activeAction.polygon
                : context.activeAction.polygon;

        // Draw the simplified polygon outline
        const webGPUPolygons = [{ polygon }];

        telegraphWebGPUManager.redrawPolygons(webGPUPolygons, {
            xOffset,
            yOffset,
            xCamera: context.camera.x,
            yCamera: context.camera.y,
            pixelSize,
            lineWidth: 0.4,
            color: CLAIMER_YELLOW,
        });

        const lines = polygon.vertices.map(([x, y]) => ({
            startX: x,
            startY: y,
            endX: x,
            endY: y,
            color: GRAY_800,
            thickness: 0.45,
        }));

        telegraphWebGPUManager.redrawLines(lines, {
            xOffset,
            yOffset,
            xCamera: context.camera.x,
            yCamera: context.camera.y,
            pixelSize,
            cameraMode: 'relative' as const,
        });

        return context;
    }

    // Handle normal claiming telegraph
    if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_ACTIVE) {
        return context;
    }

    const rects = [...context.activeAction.rects];
    if (context.activeAction.nextRect != null) {
        rects.push(context.activeAction.nextRect);
    }

    const polygons = rects.map((rect) => rectToPolygonSchema.parse(rect));

    const aggregatedPolygons = getCompositePolygons(polygons);

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
    type: typeof ACTION_TYPES.CLAIMER_COMPLETE;
    polygons: Polygon[];
};

export type ClaimerActive = {
    type: typeof ACTION_TYPES.CLAIMER_ACTIVE;
    rects: Rect[];
    nextRect: Rect | null;
};

export type ClaimerEdit = {
    type: typeof ACTION_TYPES.CLAIMER_EDIT;
    plotId: number;
    polygon: Polygon;
};

export type ClaimerResize = {
    type: typeof ACTION_TYPES.CLAIMER_RESIZE;
    plotId: number;
    vertexIndex: number;
    originalPolygon: Polygon;
    modifiedPolygon: Polygon;
    polygon: Polygon;
};

export function startClaimerAction(rect: Rect): ClaimerActive {
    return {
        type: ACTION_TYPES.CLAIMER_ACTIVE,
        rects: [],
        nextRect: rect,
    };
}
export function newRectAction(
    activeBrushAction: ClaimerActive,
    rect: Rect,
): ClaimerActive {
    return {
        type: ACTION_TYPES.CLAIMER_ACTIVE,
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
            type: ACTION_TYPES.CLAIMER_ACTIVE,
            rects: activeBrushAction.rects,
            nextRect: null,
        };
    }

    return {
        type: ACTION_TYPES.CLAIMER_ACTIVE,
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
        type: ACTION_TYPES.CLAIMER_COMPLETE,
        polygons,
    };
}

export function startEditAction(plotId: number, polygon: Polygon): ClaimerEdit {
    const nonMatchingEndpointsPolygon = polygonSchema.parse({
        vertices: polygon.vertices.slice(0, -1),
    });
    return {
        type: ACTION_TYPES.CLAIMER_EDIT,
        plotId,
        polygon: nonMatchingEndpointsPolygon,
    };
}

export function startResizeAction(
    plotId: number,
    vertexIndex: number,
    polygon: Polygon,
): ClaimerResize {
    return {
        type: ACTION_TYPES.CLAIMER_RESIZE,
        plotId,
        vertexIndex,
        originalPolygon: polygon,
        modifiedPolygon: polygon,
        polygon: polygon,
    };
}

export function updateResizeAction(
    resizeAction: ClaimerResize,
    newX: number,
    newY: number,
): ClaimerResize {
    const vertices = [...resizeAction.modifiedPolygon.vertices];
    const originalVertices = resizeAction.originalPolygon.vertices;
    const vertexCount = vertices.length;
    const index = resizeAction.vertexIndex;

    // Calculate the delta from the original position
    const [originalX, originalY] = originalVertices[index];
    const deltaX = newX - originalX;
    const deltaY = newY - originalY;

    // Get adjacent vertex indices
    const prevIndex = (index - 1 + vertexCount) % vertexCount;
    const nextIndex = (index + 1) % vertexCount;

    // Update the dragged vertex
    vertices[index] = [newX, newY] as (typeof vertices)[number];

    // Previous vertex (sibling)
    const [prevOrigX, prevOrigY] = originalVertices[prevIndex];
    if (prevOrigX === originalX) {
        // Vertical neighbor (shares X) - apply deltaX only
        vertices[prevIndex] = [
            prevOrigX + deltaX,
            prevOrigY,
        ] as (typeof vertices)[number];
    } else if (prevOrigY === originalY) {
        // Horizontal neighbor (shares Y) - apply deltaY only
        vertices[prevIndex] = [
            prevOrigX,
            prevOrigY + deltaY,
        ] as (typeof vertices)[number];
    }

    // Next vertex (sibling)
    const [nextOrigX, nextOrigY] = originalVertices[nextIndex];
    if (nextOrigX === originalX) {
        // Vertical neighbor (shares X) - apply deltaX only
        vertices[nextIndex] = [
            nextOrigX + deltaX,
            nextOrigY,
        ] as (typeof vertices)[number];
    } else if (nextOrigY === originalY) {
        // Horizontal neighbor (shares Y) - apply deltaY only
        vertices[nextIndex] = [
            nextOrigX,
            nextOrigY + deltaY,
        ] as (typeof vertices)[number];
    }
    const modifiedPolygon = {
        ...resizeAction.modifiedPolygon,
        vertices,
    };

    const simplified = simplifyPolygon(modifiedPolygon);

    // Prevent resizing to less than 1 pixel area
    if (getPolygonSize(simplified) < 1) {
        // Return the current state without applying the change
        return resizeAction;
    }

    return {
        ...resizeAction,
        modifiedPolygon,
        polygon: simplified,
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

    // If we're in edit mode, transition to resize mode when clicking a vertex
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT) {
        const handleProximity = 2; // world units
        const clickedVertexIndex =
            context.activeAction.polygon.vertices.findIndex(
                ([vx, vy]) =>
                    Math.abs(vx - absolutePoint.x) <= handleProximity &&
                    Math.abs(vy - absolutePoint.y) <= handleProximity,
            );

        if (clickedVertexIndex !== -1) {
            const updatedContext = {
                ...context,
                activeAction: startResizeAction(
                    context.activeAction.plotId,
                    clickedVertexIndex,
                    context.activeAction.polygon,
                ),
            };
            updateCursor(updatedContext);
            return updatedContext;
        }
        return context;
    }

    const rect = rectSchema.parse({
        origin: absolutePoint,
        target: absolutePoint,
    });

    const nextActiveAction =
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_ACTIVE
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

    // Handle resize action
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE) {
        const updatedAction = updateResizeAction(
            context.activeAction,
            absolutePoint.x,
            absolutePoint.y,
        );

        const updatedContext = {
            ...context,
            activeAction: updatedAction,
        };

        updateCursor(updatedContext);
        return updatedContext;
    }

    // Handle edit mode cursor updates
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT) {
        updateCursor(context);
        return context;
    }

    if (
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_ACTIVE ||
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

    // Handle resize action during wheel
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE) {
        const updatedAction = updateResizeAction(
            context.activeAction,
            absolutePoint.x,
            absolutePoint.y,
        );

        return {
            ...context,
            activeAction: updatedAction,
        };
    }

    if (
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_ACTIVE ||
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
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE) {
        console.log('onPointerOut resize', context.activeAction);
        const updatedContext = {
            ...context,
            activeAction: {
                type: ACTION_TYPES.CLAIMER_EDIT,
                plotId: context.activeAction.plotId,
                polygon: context.activeAction.polygon,
            },
        };
        updateCursor(updatedContext);
        return updatedContext;
    }
    if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_ACTIVE) {
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
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE) {
        const updatedContext = {
            ...context,
            activeAction: {
                type: ACTION_TYPES.CLAIMER_EDIT,
                plotId: context.activeAction.plotId,
                polygon: context.activeAction.polygon,
            },
        };
        updateCursor(updatedContext);
        return updatedContext;
    }

    if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_ACTIVE) {
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
