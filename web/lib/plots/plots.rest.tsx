import { InitializedStore, store } from '@/lib/store';
import { isInitialStore } from '@/lib/utils/is-initial-store';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { inside } from '../geometry/polygon';
import { AbsolutePointTuple } from '../line';
import { Plot, arrayPlotResponseSchema } from '../tools/claimer/claimer.rest';

export async function getPlots(limit: number = 10): Promise<Plot[]> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
        throw new Error('Server context is not initialized');
    }

    const search = new URLSearchParams();
    search.set('limit', limit.toString());

    const response = await fetch(
        new URL(`/api/plots?${search}`, context.server.apiOrigin),
        {
            method: 'GET',
        },
    );

    if (!response.ok) {
        throw new Error('Failed to fetch recent plots');
    }

    const json = await response.json();

    return arrayPlotResponseSchema.parse(json).data;
}

export function usePlots(
    limit: number = 10,
    queryOptions?: Omit<UseQueryOptions<Plot[], Error>, 'queryKey' | 'queryFn'>,
) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['plots', 'list'],
        queryFn: () => getPlots(limit),
        ...queryOptions,
    });

    return { data, isLoading, error };
}

/**
 * Finds a plot at the given point from user plots or recent plots
 */
export function findPlotAtPoint(
    point: AbsolutePointTuple,
    context: InitializedStore,
): Plot | null {
    // Get user plots first (higher priority)
    const userPlots = (context.queryClient.getQueryData(['user', 'plots']) ??
        []) as Plot[];

    // Check user plots first
    for (const plot of userPlots) {
        if (plot.polygon && inside(point, plot.polygon)) {
            return plot;
        }
    }

    // Get recent plots (from other users)
    const recentPlots = (context.queryClient.getQueryData(['plots', 'list']) ??
        []) as Plot[];

    // Check recent plots
    for (const plot of recentPlots) {
        if (plot.polygon && inside(point, plot.polygon)) {
            return plot;
        }
    }

    return null;
}
