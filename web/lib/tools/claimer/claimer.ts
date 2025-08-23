import { getZoomMultiplier } from '../../camera';
import { getPixelSize } from '../../canvas/realtime';
import {
    Polygon,
    getCompositePolygons,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { Rect, rectSchema } from '../../geometry/rect';
import { InitializedStore } from '../../store';
import { CLAIMER_YELLOW } from '../../webgpu/colors';
import { BLACK, BLUE } from '../../webgpu/colors';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint, getCameraOffset } from '../brush/brush';
import { getUserPlots, updatePlot } from './claimer.rest';
import { polygonSchema } from '../../geometry/polygon';
import { absolutePointTupleSchema } from '../../line';

function redrawTelegraph(context: InitializedStore) {
    const telegraphWebGPUManager = context.canvas.telegraphWebGPUManager;
    if (!telegraphWebGPUManager) {
        console.error(
            'Telegraph WebGPU manager not available for claimer telegraph rendering',
        );
        return context;
    }

    if (context.activeAction?.type !== 'claimer-active') {
        // Still draw grips for selected plot when idle in Claimer
        const selectedPlotId = context.toolSettings.claimer.selectedPlotId;
        if (selectedPlotId != null) {
            const plots = context.queryClient.getQueryData([
                'user',
                'plots',
            ]) as { id: number; polygon: Polygon }[] | undefined;
            const selected = plots?.find((p) => p.id === selectedPlotId);
            if (selected?.polygon) {
                const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
                const { xOffset, yOffset } = getCameraOffset(context.camera);

                // Draw polygon outline
                telegraphWebGPUManager.redrawPolygons([
                    {
                        polygon: selected.polygon,
                        options: {
                            containsMatchingEndpoints: true,
                            xOffset,
                            yOffset,
                            xCamera: context.camera.x,
                            yCamera: context.camera.y,
                            pixelSize,
                            lineWidth: 0.25,
                            color: BLUE,
                        },
                    },
                    // Grips as tiny filled squares
                    ...selected.polygon.vertices.map((v) => ({
                        polygon: {
                            vertices: [
                                absolutePointTupleSchema.parse([
                                    v[0] - 1,
                                    v[1] - 1,
                                ]),
                                absolutePointTupleSchema.parse([
                                    v[0] + 1,
                                    v[1] - 1,
                                ]),
                                absolutePointTupleSchema.parse([
                                    v[0] + 1,
                                    v[1] + 1,
                                ]),
                                absolutePointTupleSchema.parse([
                                    v[0] - 1,
                                    v[1] + 1,
                                ]),
                            ],
                        } as Polygon,
                        options: {
                            xOffset,
                            yOffset,
                            xCamera: context.camera.x,
                            yCamera: context.camera.y,
                            pixelSize,
                            lineWidth: 0.25,
                            filled: true,
                            color: BLACK,
                        },
                    })),
                ]);
            } else {
                telegraphWebGPUManager.clear();
            }
        } else {
            telegraphWebGPUManager.clear();
        }
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

    const webGPUPolygons = aggregatedPolygons
        .map((polygon) => ({
            polygon,
            options: {
                xOffset,
                yOffset,
                xCamera: context.camera.x,
                yCamera: context.camera.y,
                pixelSize,
                lineWidth: 0.4,
                color: CLAIMER_YELLOW,
            },
        }))
        .concat(
            // Add grips at vertices of the in-progress composite polygon(s)
            aggregatedPolygons.flatMap((poly) =>
                poly.vertices.map((v) => ({
                    polygon: {
                        vertices: [
                            absolutePointTupleSchema.parse([v[0] - 1, v[1] - 1]),
                            absolutePointTupleSchema.parse([v[0] + 1, v[1] - 1]),
                            absolutePointTupleSchema.parse([v[0] + 1, v[1] + 1]),
                            absolutePointTupleSchema.parse([v[0] - 1, v[1] + 1]),
                        ],
                    } as Polygon,
                    options: {
                        xOffset,
                        yOffset,
                        xCamera: context.camera.x,
                        yCamera: context.camera.y,
                        pixelSize,
                        lineWidth: 0.25,
                        filled: true,
                        color: CLAIMER_YELLOW,
                    },
                })),
            ),
        );

    telegraphWebGPUManager.redrawPolygons(webGPUPolygons);
}

export type ClaimerComplete = {
    type: 'claimer-complete';
    polygons: Polygon[];
};

export type ClaimerActive = {
    type: 'claimer-active';
    rects: Rect[];
    nextRect: Rect | null;
    dragging?: { vertexIndex: number } | null;
};

export function startClaimerAction(rect: Rect): ClaimerActive {
    return {
        type: 'claimer-active',
        rects: [],
        nextRect: rect,
        dragging: null,
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
        dragging: null,
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
        dragging: null,
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

function getPointerWorldPoint(
    e: PointerEvent,
    context: InitializedStore,
): { x: number; y: number } {
    const { x: camX, y: camY } = context.camera;
    // getAbsolutePoint already returns world coords; reuse helper
    const p = getAbsolutePoint(e.clientX, e.clientY, context);
    return { x: p.x, y: p.y };
}

function hitTestVertex(
    world: { x: number; y: number },
    vertices: Polygon['vertices'],
    threshold = 2,
): number | null {
    for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i];
        const dx = world.x - v[0];
        const dy = world.y - v[1];
        if (Math.abs(dx) <= threshold && Math.abs(dy) <= threshold) return i;
    }
    return null;
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    _: EnqueueObject<{ type: string }>,
): InitializedStore {
    // If a plot is selected, enable grip dragging when clicking near a vertex
    const selectedPlotId = context.toolSettings.claimer.selectedPlotId;
    if (selectedPlotId != null) {
        const plots = context.queryClient.getQueryData([
            'user',
            'plots',
        ]) as { id: number; polygon: Polygon }[] | undefined;
        const selected = plots?.find((p) => p.id === selectedPlotId);
        if (selected?.polygon) {
            const world = getPointerWorldPoint(e, context);
            const idx = hitTestVertex(world, selected.polygon.vertices);
            if (idx != null) {
                return {
                    ...context,
                    activeAction: {
                        type: 'claimer-active',
                        rects: [],
                        nextRect: null,
                        dragging: { vertexIndex: idx },
                    },
                };
            }
        }
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

    // Handle dragging a selected plot's vertex
    if (
        context.activeAction?.type === 'claimer-active' &&
        context.activeAction.dragging != null &&
        context.toolSettings.claimer.selectedPlotId != null
    ) {
        const plots = context.queryClient.getQueryData([
            'user',
            'plots',
        ]) as { id: number; polygon: Polygon }[] | undefined;
        const selected = plots?.find(
            (p) => p.id === context.toolSettings.claimer.selectedPlotId,
        );
        if (selected?.polygon) {
            const idx = context.activeAction.dragging.vertexIndex;
            const newVertices = [...selected.polygon.vertices];
            newVertices[idx] = absolutePointTupleSchema.parse([
                absolutePoint.x,
                absolutePoint.y,
            ]);

            // Draw immediate feedback by updating telegraph
            const pixelSize = getPixelSize(
                getZoomMultiplier(context.camera),
            );
            const { xOffset, yOffset } = getCameraOffset(context.camera);
            const updatedPolygon: Polygon = polygonSchema.parse({
                vertices: newVertices,
            });
            context.canvas.telegraphWebGPUManager.redrawPolygons([
                {
                    polygon: updatedPolygon,
                    options: {
                        containsMatchingEndpoints: true,
                        xOffset,
                        yOffset,
                        xCamera: context.camera.x,
                        yCamera: context.camera.y,
                        pixelSize,
                        lineWidth: 0.25,
                        color: BLUE,
                    },
                },
                ...newVertices.map((v) => ({
                    polygon: {
                        vertices: [
                            absolutePointTupleSchema.parse([v[0] - 1, v[1] - 1]),
                            absolutePointTupleSchema.parse([v[0] + 1, v[1] - 1]),
                            absolutePointTupleSchema.parse([v[0] + 1, v[1] + 1]),
                            absolutePointTupleSchema.parse([v[0] - 1, v[1] + 1]),
                        ],
                    } as Polygon,
                    options: {
                        xOffset,
                        yOffset,
                        xCamera: context.camera.x,
                        yCamera: context.camera.y,
                        pixelSize,
                        lineWidth: 0.25,
                        filled: true,
                        color: BLACK,
                    },
                })),
            ]);
        }
        return context;
    }

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

    // Commit drag if applicable
    if (
        context.activeAction.dragging != null &&
        context.toolSettings.claimer.selectedPlotId != null
    ) {
        const plots = context.queryClient.getQueryData([
            'user',
            'plots',
        ]) as { id: number; polygon: Polygon }[] | undefined;
        const selected = plots?.find(
            (p) => p.id === context.toolSettings.claimer.selectedPlotId,
        );
        if (selected?.polygon) {
            const idx = context.activeAction.dragging.vertexIndex;
            const cursor = context.interaction.cursorPosition;
            if (cursor) {
                const abs = getAbsolutePoint(cursor.clientX, cursor.clientY, context);
                const newVertices = [...selected.polygon.vertices];
                newVertices[idx] = absolutePointTupleSchema.parse([
                    abs.x,
                    abs.y,
                ]);

                // Persist update (best-effort; errors handled by toast elsewhere)
                // Fire and forget; UI will refetch on success via onSuccess handlers where used
                updatePlot(context.toolSettings.claimer.selectedPlotId, {
                    polygon: polygonSchema.parse({ vertices: newVertices }),
                }).finally(() => {
                    context.queryClient?.invalidateQueries({
                        queryKey: ['user', 'plots'],
                    });
                });
            }
        }
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
