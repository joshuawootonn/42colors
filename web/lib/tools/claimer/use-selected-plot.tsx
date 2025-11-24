import { useMemo } from 'react';

import { usePlots } from '@/lib/plots/plots.rest';
import { store } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

import { getUserPlots } from './claimer';

export function useSelectedPlot() {
    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );
    const queryClient = useSelector(
        store,
        (state) => state.context.queryClient,
    );
    // Get user plots reactively
    const { data: userPlots } = useQuery({
        queryKey: ['user', 'plots'],
        queryFn: getUserPlots,
        enabled: !!selectedPlotId && !!queryClient,
    });
    const { data: recentPlots } = usePlots(100, {
        enabled: !!selectedPlotId && !!queryClient,
    });

    // Get the selected plot data
    const selectedPlot = useMemo(() => {
        if (!selectedPlotId) return null;

        // Try to find the plot in user plots first
        const userPlot = userPlots?.find((plot) => plot.id === selectedPlotId);
        if (userPlot) return userPlot;

        // Try to find in recent plots
        const recentPlot = recentPlots?.find(
            (plot) => plot.id === selectedPlotId,
        );
        if (recentPlot) return recentPlot;

        // Try to find in chunk plots (for plots loaded by chunk)
        const context = store.getSnapshot().context;
        if (context.state === 'initialized') {
            for (const chunk of Object.values(context.canvas.chunkCanvases)) {
                const chunkPlot = chunk.plots.find(
                    (plot) => plot.id === selectedPlotId,
                );
                if (chunkPlot) return chunkPlot;
            }
        }

        return null;
    }, [selectedPlotId, userPlots, recentPlots]);

    return selectedPlot;
}
