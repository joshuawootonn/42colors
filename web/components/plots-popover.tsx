'use client';

import { ReactNode, useState } from 'react';

import { Popover, PopoverContent } from '@/components/ui/popover';
import { store } from '@/lib/store';
import { getRecentPlots } from '@/lib/tools/claimer/claimer.rest';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

type RecentPlotsPopoverProps = {
    children: ReactNode;
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function PlotsPopover({ children }: RecentPlotsPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        data: plots,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['plots', 'list'],
        queryFn: () => getRecentPlots(10),
        enabled: isOpen,
    });

    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );

    return (
        <Popover modal={false} open={isOpen} onOpenChange={setIsOpen}>
            {children}
            <PopoverContent
                className="w-80"
                positionerProps={{
                    side: 'top',
                    align: 'center',
                }}
            >
                <h3 className="mb-3 text-lg font-medium text-primary">
                    Recent Plots
                </h3>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                    {isLoading && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            Loading plots...
                        </div>
                    )}

                    {error && (
                        <div className="py-4 text-center text-sm text-red-600">
                            Failed to load plots
                        </div>
                    )}

                    {plots && plots.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No plots found
                        </div>
                    )}

                    {plots && plots.length > 0 && (
                        <div className="space-y-1">
                            {plots.map((plot) => (
                                <button
                                    key={plot.id}
                                    onClick={() =>
                                        store.trigger.selectPlot({
                                            plotId: plot.id,
                                        })
                                    }
                                    className={cn(
                                        'w-full border-1.5 border-transparent bg-background p-2 text-left text-primary hover:bg-primary hover:text-primary-foreground',
                                        selectedPlotId === plot.id &&
                                            'border-border bg-secondary/50',
                                    )}
                                    disabled={!plot.polygon}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-medium">
                                                {plot.name}
                                            </div>
                                            {plot.description && (
                                                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {plot.description}
                                                </div>
                                            )}
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {formatDate(plot.insertedAt)}
                                            </div>
                                        </div>
                                        {!plot.polygon && (
                                            <div className="text-xs text-muted-foreground">
                                                No location
                                            </div>
                                        )}
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
