'use client';

import { usePlots } from '@/lib/plots/plots.rest';

import { PlotsList } from './plots-list';

interface RecentPlotsProps {
    selectedPlotId: number | undefined;
    selectPlot: (plotId: number) => void;
    enabled?: boolean;
    userId?: number;
}

export function RecentPlots({
    selectedPlotId,
    selectPlot,
    enabled = true,
    userId,
}: RecentPlotsProps) {
    const {
        data: plots,
        isLoading,
        error,
    } = usePlots(10, {
        enabled,
    });

    return (
        <PlotsList
            plots={plots}
            isLoading={isLoading}
            error={error}
            selectedPlotId={selectedPlotId}
            selectPlot={selectPlot}
            emptyMessage="No plots found"
            loadingMessage="Loading plots..."
            userId={userId}
        />
    );
}
