'use client';

import { useEffect, useMemo, useState } from 'react';

import { X } from '@/components/icons/x';
import { IconButton } from '@/components/ui/icon-button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { usePlots } from '@/lib/plots/plots.rest';
import { canvasToClient } from '@/lib/utils/clientToCanvasConversion';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

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
        return recentPlot || null;
    }, [selectedPlotId, userPlots, recentPlots]);

    useEffect(() => {
        if (
            selectedPlot &&
            selectedPlot.polygon &&
            camera &&
            typeof window !== 'undefined' &&
            user?.id === selectedPlot.userId
        ) {
            // Use the simplified polygon from active action if resizing/editing
            let polygonToUse = selectedPlot.polygon;
            if (
                activeAction?.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT &&
                activeAction.plotId === selectedPlot.id
            ) {
                polygonToUse = activeAction.polygon;
            } else if (
                activeAction?.type === ACTION_TYPES.CLAIMER_EDIT &&
                activeAction.plotId === selectedPlot.id
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

    // Don't render if no user, no selected plot, or user doesn't own the plot
    if (!user || !selectedPlot || user.id !== selectedPlot.userId) {
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
                        pointerEvents: isHidden ? 'none' : 'auto',
                    },
                }}
                hideCloseButton={true}
            >
                <div className="flex items-start space-x-[-1px]">
                    <EditPlotForm
                        plot={selectedPlot}
                        triggerProps={{ className: 'px-2 py-1' }}
                    />
                    <DeletePlotButton
                        plot={selectedPlot}
                        triggerProps={{ className: 'px-2 py-1' }}
                    />
                    <IconButton
                        onClick={() => {
                            store.trigger.deselectPlot();
                        }}
                    >
                        <X />
                    </IconButton>
                </div>
            </PopoverContent>
        </Popover>
    );
}
