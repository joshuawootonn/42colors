import { toasts } from '@/components/ui/toast';

import { ACTION_TYPES } from '../../action-types';
import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/canvas';
import {
    Polygon,
    getCompositePolygons,
    getMostComplexPolygon,
    getPolygonSize,
    polygonSchema,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { Rect, rectSchema } from '../../geometry/rect';
import { simplifyPolygon } from '../../geometry/simplify-polygon';
import { InitializedStore } from '../../store';
import { CLAIMER_YELLOW, GRAY_800 } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint, getCameraOffset } from '../brush/brush';
import { getUserPlots } from './claimer.rest';

function updateCursor(context: InitializedStore): void {
    // Only update cursor when in edit or resize mode
    if (
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE_EDIT &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE_CREATE &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_EDIT &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_NEW_RECT_CREATE
    ) {
        return;
    }

    const canvas = context.canvas.rootCanvas;
    if (!context.interaction?.cursorPosition) {
        canvas.style.cursor = '';
        return;
    }

    // If actively resizing, show grabbing cursor
    if (
        context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE
    ) {
        canvas.style.cursor = 'grabbing';
        return;
    }

    // In edit/create mode, show grab cursor when near a handle
    const { clientX, clientY } = context.interaction.cursorPosition;
    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    // Convert screen coordinates to world coordinates
    const worldX = (clientX - xOffset) / pixelSize + context.camera.x;
    const worldY = (clientY - yOffset) / pixelSize + context.camera.y;

    let polygon: Polygon | null = null;
    if (
        context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_CREATE ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE
    ) {
        polygon = context.activeAction.polygon;
    }

    if (!polygon) {
        canvas.style.cursor = '';
        return;
    }

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
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_NEW_RECT_CREATE &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_EDIT &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE_EDIT &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE_CREATE
    ) {
        return context;
    }

    const polygons: Polygon[] = [];

    // For CLAIMER_NEW_RECT_CREATE, render the composite polygons (merged result)
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE) {
        // Render the composite polygons which combine originalPolygon and nextRect
        const actionPolygons: Polygon[] = [];

        if (context.activeAction.originalPolygon != null) {
            actionPolygons.push(context.activeAction.originalPolygon);
        }

        if (context.activeAction.nextRect != null) {
            actionPolygons.push(
                rectToPolygonSchema.parse(context.activeAction.nextRect),
            );
        }

        // Get all composite polygons (handles both overlapping and non-overlapping cases)
        if (actionPolygons.length > 0) {
            const compositePolygons = getCompositePolygons(actionPolygons);
            polygons.push(...compositePolygons);
        }
    } else {
        // For other action types, just show the polygon
        const polygon = context.activeAction.polygon;
        if (polygon != null) {
            polygons.push(polygon);
        }
    }

    if (polygons.length === 0) {
        return context;
    }

    // Draw the simplified polygon outline
    const webGPUPolygons = polygons.map((polygon) => ({ polygon }));

    telegraphWebGPUManager.redrawPolygons(webGPUPolygons, {
        xOffset,
        yOffset,
        xCamera: context.camera.x,
        yCamera: context.camera.y,
        pixelSize,
        lineWidth: 0.4,
        color: CLAIMER_YELLOW,
    });

    if (context.activeAction.polygon != null) {
        const lines = context.activeAction.polygon.vertices.map(([x, y]) => ({
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
    }

    return context;
}

export type ClaimerComplete = {
    type: typeof ACTION_TYPES.CLAIMER_COMPLETE;
    polygons: Polygon[];
};

export type ClaimerCreate = {
    type: typeof ACTION_TYPES.CLAIMER_CREATE;
    polygon: Polygon | null;
};

export type ClaimerNewRectCreate = {
    type: typeof ACTION_TYPES.CLAIMER_NEW_RECT_CREATE;
    originalPolygon: Polygon | null;
    nextRect: Rect | null;
    polygon: Polygon;
};

export type ClaimerEdit = {
    type: typeof ACTION_TYPES.CLAIMER_EDIT;
    plotId: number;
    polygon: Polygon;
};

export type ClaimerResizeEdit = {
    type: typeof ACTION_TYPES.CLAIMER_RESIZE_EDIT;
    plotId: number;
    vertexIndex: number;
    originalPolygon: Polygon;
    modifiedPolygon: Polygon;
    polygon: Polygon;
};

export type ClaimerResizeCreate = {
    type: typeof ACTION_TYPES.CLAIMER_RESIZE_CREATE;
    vertexIndex: number;
    originalPolygon: Polygon;
    modifiedPolygon: Polygon;
    polygon: Polygon;
};

export function startClaimerAction(rect: Rect): ClaimerNewRectCreate {
    const polygon = rectToPolygonSchema.parse(rect);
    return {
        type: ACTION_TYPES.CLAIMER_NEW_RECT_CREATE,
        originalPolygon: null,
        nextRect: rect,
        polygon,
    };
}

export function startNewRectCreateAction(
    curr: ClaimerCreate,
    rect: Rect,
): ClaimerNewRectCreate {
    const polygonsToMerge: Polygon[] = [];

    const originalPolygon = curr.polygon;
    if (originalPolygon != null) {
        polygonsToMerge.push(originalPolygon);
    }

    polygonsToMerge.push(rectToPolygonSchema.parse(rect));

    const compositePolygons = getCompositePolygons(polygonsToMerge);
    const polygon = getMostComplexPolygon(compositePolygons);

    return {
        type: ACTION_TYPES.CLAIMER_NEW_RECT_CREATE,
        originalPolygon,
        nextRect: rect,
        polygon,
    };
}

export function completeNewRectCreateAction(
    curr: ClaimerNewRectCreate,
): ClaimerCreate {
    return {
        type: ACTION_TYPES.CLAIMER_CREATE,
        polygon: curr.polygon,
    };
}

/**
 * Updates a ClaimerNewRectCreate action by updating the rect with a new target point
 * and recalculating the polygon to reflect the merged result.
 */
export function updateNewRectCreateAction(
    action: ClaimerNewRectCreate,
    targetX: number,
    targetY: number,
): ClaimerNewRectCreate {
    if (action.nextRect == null) {
        return action;
    }

    const updatedRect = rectSchema.parse({
        origin: action.nextRect.origin,
        target: { x: targetX, y: targetY },
    });

    const polygonsToMerge: Polygon[] = [];

    if (action.originalPolygon != null) {
        polygonsToMerge.push(action.originalPolygon);
    }

    polygonsToMerge.push(rectToPolygonSchema.parse(updatedRect));

    const compositePolygons = getCompositePolygons(polygonsToMerge);
    const polygon = getMostComplexPolygon(compositePolygons);

    return {
        type: ACTION_TYPES.CLAIMER_NEW_RECT_CREATE,
        originalPolygon: action.originalPolygon,
        nextRect: updatedRect,
        polygon,
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
): ClaimerResizeEdit {
    return {
        type: ACTION_TYPES.CLAIMER_RESIZE_EDIT,
        plotId,
        vertexIndex,
        originalPolygon: polygon,
        modifiedPolygon: polygon,
        polygon: polygon,
    };
}

export function startResizeCreateAction(
    vertexIndex: number,
    polygon: Polygon,
): ClaimerResizeCreate {
    return {
        type: ACTION_TYPES.CLAIMER_RESIZE_CREATE,
        vertexIndex,
        originalPolygon: polygon,
        modifiedPolygon: polygon,
        polygon: polygon,
    };
}

export function updateResizeAction(
    resizeAction: ClaimerResizeEdit,
    newX: number,
    newY: number,
): ClaimerResizeEdit {
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

export function updateResizeCreateAction(
    resizeAction: ClaimerResizeCreate,
    newX: number,
    newY: number,
): ClaimerResizeCreate {
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

    // If we're in create mode, transition to resize mode when clicking a vertex
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_CREATE) {
        const currentPolygon = context.activeAction.polygon;
        if (currentPolygon != null) {
            const handleProximity = 2; // world units
            const clickedVertexIndex = currentPolygon.vertices.findIndex(
                ([vx, vy]) =>
                    Math.abs(vx - absolutePoint.x) <= handleProximity &&
                    Math.abs(vy - absolutePoint.y) <= handleProximity,
            );

            if (clickedVertexIndex !== -1) {
                const updatedContext = {
                    ...context,
                    activeAction: startResizeCreateAction(
                        clickedVertexIndex,
                        currentPolygon,
                    ),
                };
                updateCursor(updatedContext);
                return updatedContext;
            }
        }
    }

    const rect = rectSchema.parse({
        origin: absolutePoint,
        target: absolutePoint,
    });

    const nextActiveAction =
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE
            ? startClaimerAction(rect)
            : startNewRectCreateAction(context.activeAction, rect);

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
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT) {
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

    // Handle resize create action
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE) {
        const updatedAction = updateResizeCreateAction(
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

    // Handle create mode cursor updates
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_CREATE) {
        updateCursor(context);
        return context;
    }

    // Handle new rect create mode - update rect as cursor moves
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE) {
        updateCursor(context);
        const updatedAction = updateNewRectCreateAction(
            context.activeAction,
            absolutePoint.x,
            absolutePoint.y,
        );

        return {
            ...context,
            activeAction: updatedAction,
        };
    }

    return context;
}

function onWheel(
    e: WheelEvent,
    context: InitializedStore,
    _: EnqueueObject<{ type: string }>,
): InitializedStore {
    const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

    // Handle resize action during wheel
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT) {
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

    // Handle resize create action during wheel
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE) {
        const updatedAction = updateResizeCreateAction(
            context.activeAction,
            absolutePoint.x,
            absolutePoint.y,
        );

        return {
            ...context,
            activeAction: updatedAction,
        };
    }

    // Handle create mode during wheel
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_CREATE) {
        return context;
    }

    // Handle new rect create mode during wheel
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE) {
        const updatedAction = updateNewRectCreateAction(
            context.activeAction,
            absolutePoint.x,
            absolutePoint.y,
        );

        return {
            ...context,
            activeAction: updatedAction,
        };
    }

    return context;
}

function onPointerOut(
    _: PointerEvent,
    context: InitializedStore,
    __: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT) {
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
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE) {
        const updatedContext = {
            ...context,
            activeAction: {
                type: ACTION_TYPES.CLAIMER_CREATE,
                polygon: context.activeAction.polygon,
            },
        };
        updateCursor(updatedContext);
        return updatedContext;
    }
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE) {
        const completedRectAction = completeNewRectCreateAction(
            context.activeAction,
        );

        if (completedRectAction.polygon == null) {
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

    return context;
}

function onPointerUp(
    _: PointerEvent,
    context: InitializedStore,
    __: EnqueueObject<{ type: string }>,
): InitializedStore {
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT) {
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

    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE) {
        const updatedContext = {
            ...context,
            activeAction: {
                type: ACTION_TYPES.CLAIMER_CREATE,
                polygon: context.activeAction.polygon,
            },
        };
        updateCursor(updatedContext);
        return updatedContext;
    }

    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE) {
        const completedRectAction = completeNewRectCreateAction(
            context.activeAction,
        );

        if (completedRectAction.polygon == null) {
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

    return context;
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
