'use client';

import { useEffect, useMemo, useState } from 'react';

import { X } from '@/components/icons/x';
import { IconButton } from '@/components/ui/icon-button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { canvasToClient } from '@/lib/utils/clientToCanvasConversion';
import { useSelector } from '@xstate/store/react';

import { ACTION_TYPES } from '../../action-types';
import { store } from '../../store';
import { CreatePlotForm } from './create-plot-form';
import { getPlotOverlayPositionForActiveAction } from './get-plot-overlay-position';

export function NewPlotPopover() {
    const activeAction = useSelector(
        store,
        (state) => state.context.activeAction,
    );
    const camera = useSelector(store, (state) => state.context.camera);
    const user = useSelector(store, (state) => state.context?.user);

    const transform = useMemo(
        () => `translate(-50%, ${canvasToClient(0.2, camera.zoom)}px)`,
        [camera.zoom],
    );

    const [isOpen, setIsOpen] = useState(false);
    const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (
            activeAction?.type === ACTION_TYPES.CLAIMER_CREATE &&
            camera &&
            typeof window !== 'undefined'
        ) {
            const center = getPlotOverlayPositionForActiveAction(
                activeAction,
                camera,
            );
            setTriggerPosition(center);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [activeAction, camera]);

    if (user == null || activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE) {
        return null;
    }

    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    store.trigger.clearClaim();
                }
                setIsOpen(open);
            }}
        >
            <PopoverContent
                className="w-auto border-none"
                isDraggable={false}
                positionerProps={{
                    side: 'top',
                    align: 'center',
                    sideOffset: 8,
                    style: {
                        left: triggerPosition.x,
                        top: triggerPosition.y,
                        transform,
                    },
                }}
                hideCloseButton={true}
            >
                <div className="flex items-start">
                    <CreatePlotForm />
                    <IconButton
                        onClick={() => {
                            store.trigger.clearClaim();
                        }}
                    >
                        <X />
                    </IconButton>
                </div>
            </PopoverContent>
        </Popover>
    );
}
