'use client';

import { store } from '@/lib/store';
import { getUserPlots } from '@/lib/tools/claimer/claimer.rest';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

import { PlotsList } from './plots-list';

interface UserPlotsProps {
    selectedPlotId: number | undefined;
    selectPlot: (plotId: number) => void;
    enabled?: boolean;
}

export function UserPlots({
    selectedPlotId,
    selectPlot,
    enabled = true,
}: UserPlotsProps) {
    const user = useSelector(store, (state) => state.context?.user);

    const {
        data: userPlots,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['user', 'plots'],
        queryFn: getUserPlots,
        enabled: enabled && user != null,
    });

    // If user is not authenticated, show a message encouraging them to create an account
    if (user == null) {
        return (
            <div className="flex-1 text-pretty pt-20 text-center text-sm text-muted-foreground">
                Create an account to claim a plot
            </div>
        );
    }

    return (
        <PlotsList
            plots={userPlots}
            isLoading={isLoading}
            error={error}
            selectedPlotId={selectedPlotId}
            selectPlot={selectPlot}
            showEditActions={true}
            emptyMessage="No user plots found"
            loadingMessage="Loading user plots..."
        />
    );
}
