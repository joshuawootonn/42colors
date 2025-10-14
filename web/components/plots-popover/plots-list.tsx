'use client';

import { Plot } from '@/lib/tools/claimer/claimer.rest';
import { DeletePlotButton } from '@/lib/tools/claimer/delete-plot-button';
import { EditPlotForm } from '@/lib/tools/claimer/edit-plot-form';
import { cn } from '@/lib/utils';

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface PlotsListProps {
    plots: Plot[] | undefined;
    isLoading: boolean;
    error: Error | null;
    selectedPlotId: number | undefined;
    selectPlot: (plotId: number) => void;
    emptyMessage?: string;
    loadingMessage?: string;
    userId?: number;
}

export function PlotsList({
    plots,
    isLoading,
    error,
    selectedPlotId,
    selectPlot,
    emptyMessage = 'No plots found',
    loadingMessage = 'Loading plots...',
    userId,
}: PlotsListProps) {
    if (isLoading) {
        return (
            <div className="flex-1 pt-20 text-center text-sm text-muted-foreground">
                {loadingMessage}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 pt-20 text-center text-sm text-red-600">
                Failed to load plots
            </div>
        );
    }

    if (plots == null || plots.length === 0) {
        return (
            <div className="flex-1 pt-20 text-center text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col">
            {plots.map((plot) => (
                <div
                    key={plot.id}
                    className={cn(
                        'svg-outline-inset group relative z-0 block border-transparent bg-transparent p-2 text-left text-foreground outline-none',
                        'hover:bg-black hover:text-background',
                        selectedPlotId === plot.id && 'bg-secondary',
                    )}
                    tabIndex={0}
                    onClick={() => selectPlot(plot.id)}
                    aria-disabled={!plot.polygon}
                >
                    <div>{plot.name}</div>
                    <div className="text-left text-xs">
                        {plot.description && (
                            <div className="mt-0.5 line-clamp-2 text-muted-foreground group-hover:text-muted">
                                {plot.description}
                            </div>
                        )}
                        <div className="mt-1 text-muted-foreground group-hover:text-muted">
                            {formatDate(plot.insertedAt)}
                        </div>
                    </div>
                    {userId === plot.userId && selectedPlotId === plot.id && (
                        <div className="absolute right-1 top-1 flex">
                            <EditPlotForm
                                plot={plot}
                                triggerProps={{
                                    className:
                                        ' border-transparent bg-transparent text-black group-hover:text-background',
                                }}
                            />
                            <DeletePlotButton
                                plot={plot}
                                triggerProps={{
                                    className:
                                        ' border-transparent bg-transparent text-black group-hover:text-background',
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
