'use client';

import { useEffect, useMemo, useState } from 'react';

import { X32 } from '@/components/icons/x_32';
import { IconButton } from '@/components/ui/icon-button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { isScrollingAtom } from '@/lib/events';
import { usePlots } from '@/lib/plots/plots.rest';
import { canvasToClient } from '@/lib/utils/clientToCanvasConversion';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useSelector } from '@xstate/store/react';

import { ACTION_TYPES } from '../../action-types';
import { store } from '../../store';
import { getUserPlots } from './claimer.rest';
import { DeletePlotButton } from './delete-plot-button';
import { EditPlotForm } from './edit-plot-form';
import { getPlotOverlayPositionForPolygons } from './get-plot-overlay-position';

export function SelectedPlotPopover() {
    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );
    const camera = useSelector(store, (state) => state.context.camera);
    const user = useSelector(store, (state) => state.context?.user);
    const queryClient = useSelector(
        store,
        (state) => state.context.queryClient,
    );
    const activeAction = useSelector(
        store,
        (state) => state.context.activeAction,
    );

    const transform = useMemo(
        () => `translate(-50%, ${canvasToClient(-0.2, camera.zoom)}px)`,
        [camera.zoom],
    );

    const [isOpen, setIsOpen] = useState(false);
    const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
    const isScrolling = useAtom(isScrollingAtom);

    // Derive hidden state from activeAction
    const isHidden =
        activeAction?.type === ACTION_TYPES.CLAIMER_EDIT ||
        activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT;

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

    useEffect(() => {
        if (
            selectedPlot &&
            selectedPlot.polygon &&
            camera &&
            typeof window !== 'undefined'
        ) {
            // Use the simplified polygon from active action if resizing/editing
            let polygonToUse = selectedPlot.polygon;
            if (
                user?.id === selectedPlot.userId &&
                ((activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT &&
                    activeAction.plotId === selectedPlot.id) ||
                    (activeAction?.type ===
                        ACTION_TYPES.CLAIMER_NEW_RECT_EDIT &&
                        activeAction.plotId === selectedPlot.id) ||
                    (activeAction?.type === ACTION_TYPES.CLAIMER_EDIT &&
                        activeAction.plotId === selectedPlot.id))
            ) {
                polygonToUse = activeAction.polygon;
            }

            const center = getPlotOverlayPositionForPolygons(
                [polygonToUse],
                camera,
            );
            setTriggerPosition(center);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [selectedPlot, camera, user, activeAction]);

    // Render popover for any selected plot (owned or not)
    // Only show edit/delete buttons if user owns the plot
    const isOwned = user?.id === selectedPlot?.userId;
    if (!selectedPlot) {
        return null;
    }

    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    store.trigger.deselectPlot();
                }
                setIsOpen(open);
            }}
        >
            <PopoverContent
                className="w-auto border-none"
                isDraggable={false}
                positionerProps={{
                    side: 'bottom',
                    align: 'center',
                    sideOffset: 8,
                    style: {
                        left: triggerPosition.x,
                        top: triggerPosition.y,
                        transform,
                        opacity: isHidden ? 0 : 1,
                        pointerEvents: isScrolling
                            ? 'none'
                            : isHidden
                              ? 'none'
                              : 'auto',
                    },
                }}
                hideCloseButton={true}
            >
                <div className="flex items-start space-x-[-1.5px]">
                    <div className="h-8 max-w-xs truncate border-1.5 border-border bg-secondary px-2 py-1 text-sm text-primary">
                        {selectedPlot.name}
                    </div>
                    {isOwned && (
                        <>
                            <EditPlotForm
                                plot={selectedPlot}
                                triggerProps={{ className: 'px-2 py-1' }}
                            />
                            <DeletePlotButton
                                plot={selectedPlot}
                                triggerProps={{ className: 'px-2 py-1' }}
                            />
                        </>
                    )}
                    <IconButton
                        onClick={() => {
                            store.trigger.deselectPlot();
                        }}
                    >
                        <X32 />
                    </IconButton>
                </div>
            </PopoverContent>
        </Popover>
    );
}
