'use client';

import { useEffect, useMemo, useState } from 'react';

import { ArrowUp12 } from '@/components/icons/arrow_up_12';
import { X32 } from '@/components/icons/x_32';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import * as Tooltip from '@/components/ui/tooltip';
import { isAdminUser } from '@/lib/admin';
import { isScrollingAtom } from '@/lib/events';
import { canvasToClient } from '@/lib/utils/clientToCanvasConversion';
import { useAtom, useSelector } from '@xstate/store/react';

import { ACTION_TYPES } from '../../action-types';
import { store } from '../../store';
import { DeletePlotButton } from './delete-plot-button';
import { EditPlotForm } from './edit-plot-form';
import { getPlotOverlayPositionForPolygons } from './get-plot-overlay-position';
import { useSelectedPlot } from './use-selected-plot';
import { VoteButton } from './vote-button';

export function SelectedPlotPopover() {
    const camera = useSelector(store, (state) => state.context.camera);
    const user = useSelector(store, (state) => state.context?.user);
    const isAdminPlotEditingEnabled = useSelector(
        store,
        (state) => state.context?.adminSettings?.isAdminPlotEditingEnabled,
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

    const selectedPlot = useSelectedPlot();

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
    // Only show edit/delete buttons if user owns the plot (or admin override is enabled)
    const isAdminWithOverride = isAdminUser(user) && isAdminPlotEditingEnabled;
    const canEditPlot =
        user?.id === selectedPlot?.userId || isAdminWithOverride;

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
                    {canEditPlot ? (
                        <>
                            <EditPlotForm
                                plot={selectedPlot}
                                triggerProps={{ className: 'px-2 py-1' }}
                            />
                            <DeletePlotButton
                                plot={selectedPlot}
                                triggerProps={{ className: 'px-2 py-1' }}
                            />
                            <Tooltip.Root>
                                <Tooltip.Trigger
                                    className="flex h-8 items-center border-1.5 border-border bg-secondary px-2 text-sm tabular-nums text-muted-foreground"
                                    render={(props) => (
                                        <Button {...props} aria-disabled={true}>
                                            <ArrowUp12 />
                                            {selectedPlot.score}
                                        </Button>
                                    )}
                                />
                                <Tooltip.Portal>
                                    <Tooltip.Positioner>
                                        <Tooltip.Popup>
                                            You can&apos;t vote for your own
                                            plot
                                        </Tooltip.Popup>
                                    </Tooltip.Positioner>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </>
                    ) : (
                        <VoteButton plot={selectedPlot} />
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
