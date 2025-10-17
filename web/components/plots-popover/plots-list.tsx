'use client';

import { useEffect, useRef } from 'react';

import { Plot } from '@/lib/tools/claimer/claimer.rest';
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
}

export function PlotsList({
    plots,
    isLoading,
    error,
    selectedPlotId,
    selectPlot,
    emptyMessage = 'No plots found',
    loadingMessage = 'Loading plots...',
}: PlotsListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedPlotRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selectedPlotId && containerRef.current && selectedPlotRef.current) {
            const selectedElement = selectedPlotRef.current;

            selectedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedPlotId]);

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
        <div ref={containerRef} className="flex w-full flex-col">
            {plots.map((plot) => (
                <div
                    key={plot.id}
                    className="relative"
                    ref={selectedPlotId === plot.id ? selectedPlotRef : null}
                >
                    <button
                        className={cn(
                            'svg-outline-inset group peer relative z-0 block w-full border-transparent bg-transparent p-2 text-left text-foreground outline-none',
                            selectedPlotId === plot.id && 'bg-secondary',
                        )}
                        onClick={() => selectPlot(plot.id)}
                        disabled={!plot.polygon}
                    >
                        <div>{plot.name}</div>
                        <div className="text-left text-xs">
                            {plot.description && (
                                <div className="mt-0.5 line-clamp-2 text-muted-foreground">
                                    {plot.description}
                                </div>
                            )}
                            <div className="mt-1 text-muted-foreground">
                                {formatDate(plot.insertedAt)}
                            </div>
                        </div>
                    </button>
                </div>
            ))}
        </div>
    );
}
