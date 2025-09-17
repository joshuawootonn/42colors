'use client';

import { ReactNode, useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverHeading,
} from '@/components/ui/popover';
import { usePlots } from '@/lib/plots/plots.rest';
import { store } from '@/lib/store';
import { Plot } from '@/lib/tools/claimer/claimer.rest';
import { cn } from '@/lib/utils';
import { useSelector } from '@xstate/store/react';

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function PlotsPopoverMarkup({
    children,
    isOpen,
    setIsOpen,
    isLoading,
    error,
    plots,
    selectedPlotId,
    selectPlot,
}: {
    children: ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isLoading: boolean;
    error: Error | null;
    plots: Plot[] | undefined;
    selectedPlotId: number | undefined;
    selectPlot: (plotId: number) => void;
}) {
    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {children}
            <PopoverContent
                className="w-80"
                positionerProps={{
                    side: 'top',
                    align: 'center',
                }}
            >
                <PopoverHeading>Recent Plots</PopoverHeading>
                <div className="max-h-96 overflow-auto">
                    {isLoading ? (
                        <div className="py-20 text-center text-sm text-muted-foreground">
                            Loading plots...
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-sm text-red-600">
                            Failed to load plots
                        </div>
                    ) : plots == null || plots.length === 0 ? (
                        <div className="py-20 text-center text-sm text-muted-foreground">
                            No plots found
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-1">
                            {plots.map((plot) => (
                                <button
                                    key={plot.id}
                                    onClick={() => selectPlot(plot.id)}
                                    className={cn(
                                        'svg-outline-border relative',
                                        'group border-1.5 border-transparent bg-transparent p-2 text-left text-foreground',
                                        'hover:bg-foreground hover:text-background',
                                        selectedPlotId === plot.id &&
                                            'border-border bg-secondary/50',
                                    )}
                                    disabled={!plot.polygon}
                                >
                                    <div className="flex items-start justify-between gap-2 text-xs">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {plot.name}
                                            </div>
                                        </div>
                                        {!plot.polygon && (
                                            <div className="text-muted-foreground group-hover:text-muted">
                                                No location
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs">
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
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function PlotsPopover({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        data: plots,
        isLoading,
        error,
    } = usePlots(10, {
        enabled: isOpen,
    });

    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );

    return (
        <PlotsPopoverMarkup
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isLoading={isLoading}
            error={error}
            plots={plots}
            selectedPlotId={selectedPlotId ?? undefined}
            selectPlot={(plotId) => {
                store.trigger.selectPlot({ plotId });
                store.trigger.fetchPixels();
            }}
        >
            {children}
        </PlotsPopoverMarkup>
    );
}
