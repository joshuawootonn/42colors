import { z } from 'zod';

import {
    completePolygonRing,
    getCompositePolygons,
    polygonSchema,
    rectToPolygonSchema,
} from '../../geometry/polygon';
import { store } from '../../store';
import { isInitialStore } from '../../utils/is-initial-store';
import { completeRectangleClaimerAction } from './claimer';

const plotSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    polygon: polygonSchema,
    insertedAt: z.string(),
    updatedAt: z.string(),
    userId: z.number(),
});

export const arrayPlotResponseSchema = z.object({ data: z.array(plotSchema) });

const errorResponseSchema = z.object({
    status: z.literal('error'),
    message: z.string(),
    errors: z.record(z.array(z.string())),
});

const successPlotResponseSchema = z.object({
    status: z.literal('success').optional(),
    data: plotSchema,
});

const plotCreateResponseSchema = z.union([
    successPlotResponseSchema,
    errorResponseSchema,
]);

const plotUpdateResponseSchema = z.union([
    successPlotResponseSchema,
    errorResponseSchema,
]);

export class PlotError extends Error {
    constructor(
        message: string,
        public errors: Record<string, string[]>,
    ) {
        super(message);
        this.name = 'PlotError';
    }
}

export type Plot = z.infer<typeof plotSchema>;

export async function createPlot(plotData: {
    name: string;
    description?: string;
}): Promise<Plot> {
    const context = store.getSnapshot().context;
    if (
        isInitialStore(context) ||
        context.activeAction?.type !== 'claimer-active'
    ) {
        throw new Error(
            "Attempted to create a plot when there isn't an active action",
        );
    }

    const rects = [...context.activeAction.rects];
    if (context.activeAction.nextRect != null) {
        rects.push(context.activeAction.nextRect);
    }
    const polygons = completeRectangleClaimerAction(
        getCompositePolygons(
            rects.map((rect) => rectToPolygonSchema.parse(rect)),
        ),
    ).polygons;

    const response = await fetch(
        new URL(`/api/plots`, context.server.apiOrigin),
        {
            body: JSON.stringify({
                plot: {
                    name: plotData.name,
                    description: plotData.description,
                    // todo(josh): we should add some sort of notice to the user that only their first polygon is going to be used
                    polygon: completePolygonRing(polygons[0]),
                },
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            credentials: 'include',
        },
    );

    const json = await response.json();
    const parsedResponse = plotCreateResponseSchema.parse(json);

    if ('status' in parsedResponse && parsedResponse.status === 'error') {
        throw new PlotError(parsedResponse.message, parsedResponse.errors);
    }

    return parsedResponse.data;
}

export async function getUserPlots(): Promise<Plot[]> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
        throw new Error('Server context is not initialized');
    }

    const response = await fetch(
        new URL(`/api/plots/me`, context.server.apiOrigin),
        {
            method: 'GET',
            credentials: 'include',
        },
    );

    const json = await response.json();

    const parsedResponse = arrayPlotResponseSchema.safeParse(json);

    if (!parsedResponse.success) {
        return [];
    }

    return parsedResponse.data.data;
}

export async function deletePlot(plotId: number): Promise<void> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
        throw new Error('Server context is not initialized');
    }

    await fetch(new URL(`/api/plots/${plotId}`, context.server.apiOrigin), {
        method: 'DELETE',
        credentials: 'include',
    });

    return;
}

export async function updatePlot(
    plotId: number,
    plot: Partial<Pick<Plot, 'name' | 'description' | 'polygon'>>,
): Promise<Plot> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
        throw new Error('Server context is not initialized');
    }

    // Complete the polygon ring if polygon is provided
    const plotData = plot.polygon
        ? { ...plot, polygon: completePolygonRing(plot.polygon) }
        : plot;

    const response = await fetch(
        new URL(`/api/plots/${plotId}`, context.server.apiOrigin),
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                plot: plotData,
            }),
        },
    );

    const json = await response.json();
    const parsedResponse = plotUpdateResponseSchema.parse(json);

    if ('status' in parsedResponse && parsedResponse.status === 'error') {
        throw new PlotError(parsedResponse.message, parsedResponse.errors);
    }

    return parsedResponse.data;
}

export async function getPlotsByChunk(x: number, y: number): Promise<Plot[]> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
        throw new Error('Server context is not initialized');
    }

    const search = new URLSearchParams();
    search.set('x', x.toString());
    search.set('y', y.toString());

    const response = await fetch(
        new URL(`/api/plots?${search}`, context.server.apiOrigin),
        {
            method: 'GET',
        },
    );

    const json = await response.json();

    return arrayPlotResponseSchema.parse(json).data;
}
