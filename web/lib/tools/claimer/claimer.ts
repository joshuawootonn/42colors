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
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE_EDIT &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_RESIZE_CREATE &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_EDIT &&
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE
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
    if (context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT) {
        polygon = context.activeAction.polygon;
    } else if (
        context.activeAction?.type === ACTION_TYPES.CLAIMER_CREATE &&
        context.activeAction.polygon
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
        context.activeAction?.type === ACTION_TYPES.CLAIMER_EDIT ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT ||
        context.activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE
    ) {
        const polygon =
            context.activeAction.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT ||
            context.activeAction.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE
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
    if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE) {
        return context;
    }

    const polygonRenderItems: { polygon: Polygon }[] = [];
    if (context.activeAction.polygon != null) {
        polygonRenderItems.push({
            polygon: context.activeAction.polygon,
        });
    }

    if (context.activeAction.nextRect != null) {
        polygonRenderItems.push({
            polygon: rectToPolygonSchema.parse(context.activeAction.nextRect),
        });
    }

    telegraphWebGPUManager.redrawPolygons(polygonRenderItems, {
        xOffset,
        yOffset,
        xCamera: context.camera.x,
        yCamera: context.camera.y,
        pixelSize,
        lineWidth: 0.4,
        color: CLAIMER_YELLOW,
    });

    // Draw grips (vertex handles) for the completed polygon during create
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
}

export type ClaimerComplete = {
    type: typeof ACTION_TYPES.CLAIMER_COMPLETE;
    polygons: Polygon[];
};

export type ClaimerCreate = {
    type: typeof ACTION_TYPES.CLAIMER_CREATE;
    rects: Rect[];
    polygon: Polygon | null;
    nextRect: Rect | null;
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
    rects: Rect[];
};

export function startClaimerAction(rect: Rect): ClaimerCreate {
    return {
        type: ACTION_TYPES.CLAIMER_CREATE,
        rects: [],
        polygon: rectToPolygonSchema.parse(rect),
        nextRect: rect,
    };
}

export function newRectAction(curr: ClaimerCreate, rect: Rect): ClaimerCreate {
    return {
        type: ACTION_TYPES.CLAIMER_CREATE,
        rects: curr.rects,
        nextRect: rect,
        polygon: curr.polygon,
    };
}

export function completeRectAction(curr: ClaimerCreate): ClaimerCreate {
    const size = curr.nextRect ? getRectSize(curr.nextRect) : 0;

    if (size === 0) {
        return {
            type: ACTION_TYPES.CLAIMER_CREATE,
            rects: curr.rects,
            nextRect: null,
            polygon: curr.polygon,
        };
    }

    const compositePolygons = getCompositePolygons(
        [...curr.rects, curr.nextRect]
            .filter(Boolean)
            .map((rect) => rectToPolygonSchema.parse(rect)),
    );

    const polygon = getMostComplexPolygon(compositePolygons);

    return {
        type: ACTION_TYPES.CLAIMER_CREATE,
        rects:
            compositePolygons.length > 1 || curr.nextRect == null
                ? curr.rects
                : curr.rects.concat(curr.nextRect),
        nextRect: null,
        polygon,
    };
}

export function nextClaimerAction(
    activeBrushAction: ClaimerCreate,
    nextRect: Rect,
): ClaimerCreate {
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
    rects: Rect[],
): ClaimerResizeCreate {
    return {
        type: ACTION_TYPES.CLAIMER_RESIZE_CREATE,
        vertexIndex,
        originalPolygon: polygon,
        modifiedPolygon: polygon,
        polygon: polygon,
        rects,
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
    if (
        context.activeAction?.type === ACTION_TYPES.CLAIMER_CREATE &&
        context.activeAction.polygon
    ) {
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
                activeAction: startResizeCreateAction(
                    clickedVertexIndex,
                    context.activeAction.polygon,
                    context.activeAction.rects,
                ),
            };
            updateCursor(updatedContext);
            return updatedContext;
        }
    }

    const rect = rectSchema.parse({
        origin: absolutePoint,
        target: absolutePoint,
    });

    const nextActiveAction =
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE
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
        if (context.activeAction.nextRect == null) {
            return context;
        }
    }

    if (
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE ||
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

    if (
        context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE ||
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
                rects: context.activeAction.rects,
                polygon: context.activeAction.polygon,
                nextRect: null,
            },
        };
        updateCursor(updatedContext);
        return updatedContext;
    }
    if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE) {
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
                rects: context.activeAction.rects,
                polygon: context.activeAction.polygon,
                nextRect: null,
            },
        };
        updateCursor(updatedContext);
        return updatedContext;
    }

    if (context.activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE) {
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
