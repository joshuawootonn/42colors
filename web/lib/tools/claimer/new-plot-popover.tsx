'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { X } from '@/components/icons/x';
import { IconButton } from '@/components/ui/icon-button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { canvasToClient } from '@/lib/utils/clientToCanvasConversion';
import { useSelector } from '@xstate/store/react';

import { store } from '../../store';
import { CreatePlotForm } from './create-plot-form';
import { getPlotOverlayPosition } from './get-plot-overlay-position';

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
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (
            activeAction?.type === 'claimer-active' &&
            camera &&
            typeof window !== 'undefined'
        ) {
            const center = getPlotOverlayPosition(activeAction, camera);
            setTriggerPosition(center);
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [activeAction, camera]);

    useEffect(() => {
        if (triggerRef.current) {
            triggerRef.current.style.left = `${triggerPosition.x}px`;
            triggerRef.current.style.top = `${triggerPosition.y}px`;
        }
    }, [triggerPosition]);

    if (user == null || activeAction?.type !== 'claimer-active') {
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
                className="w-auto"
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
                hideCloseButton={false}
            >
                <div className="flex items-start">
                    <CreatePlotForm />
                    <IconButton
                        className="text-black"
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
