'use client';

import { usePlots } from '@/lib/plots/plots.rest';

import { PlotsList } from './plots-list';

interface RecentPlotsProps {
    selectedPlotId: number | undefined;
    selectPlot: (plotId: number) => void;
    enabled?: boolean;
}

export function RecentPlots({
    selectedPlotId,
    selectPlot,
    enabled = true,
}: RecentPlotsProps) {
    const {
        data: plots,
        isLoading,
        error,
    } = usePlots(100, {
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
        />
    );
}
