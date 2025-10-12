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
    showEditActions?: boolean;
    emptyMessage?: string;
    loadingMessage?: string;
}

export function PlotsList({
    plots,
    isLoading,
    error,
    selectedPlotId,
    selectPlot,
    showEditActions = false,
    emptyMessage = 'No plots found',
    loadingMessage = 'Loading plots...',
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
        <div className="flex w-full flex-col space-y-1">
            {plots.map((plot) => (
                <div
                    key={plot.id}
                    className={cn(
                        'svg-outline-border group relative border-1.5 border-transparent bg-transparent p-2 text-left text-foreground',
                        'hover:bg-black hover:text-background',
                        selectedPlotId === plot.id &&
                            'border-border bg-secondary/50',
                    )}
                >
                    <button
                        onClick={() => selectPlot(plot.id)}
                        className="flex w-full flex-col items-start justify-start gap-2 text-xs"
                        disabled={!plot.polygon}
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
                    </button>

                    {/* Edit and Delete buttons - only show for user plots */}
                    {showEditActions && (
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100">
                            <EditPlotForm plot={plot} />
                            <DeletePlotButton plot={plot} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
