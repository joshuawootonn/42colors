'use client';

import * as React from 'react';
import { useCallback, useRef } from 'react';

import { useForwardedRef } from '@/components/ui/hooks/use-forwarded-ref';
import { cn } from '@/lib/utils';
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover';

import { X } from '../icons/x';
import { useCornerAnchor } from './hooks/use-corner-anchor';
import { useDraggablePosition } from './hooks/use-draggable-position';

// internal type from base-ui-components/react/popover that is not exported
export type BaseOpenChangeReason =
    | 'trigger-press'
    | 'trigger-hover'
    | 'trigger-focus'
    | 'focus-out'
    | 'escape-key'
    | 'outside-press'
    | 'list-navigation'
    | 'item-press'
    | 'cancel-open'
    | 'close-press';

const Popover = function ({
    onOpenChange,
    type = 'temporary',
    ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> & {
    type: 'temporary' | 'persistent';
}) {
    const handleOpenChange = useCallback(
        (
            open: boolean,
            event: Event | undefined,
            reason: BaseOpenChangeReason | undefined,
        ) => {
            if (
                type === 'persistent' &&
                reason !== 'close-press' &&
                reason !== 'trigger-press' &&
                open === false
            ) {
                return;
            }
            onOpenChange?.(open, event, reason);
        },
        [onOpenChange, type],
    );

    return <PopoverPrimitive.Root {...props} onOpenChange={handleOpenChange} />;
};

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Root;

const PopoverHeading = React.forwardRef<
    React.ElementRef<'h3'>,
    React.ComponentPropsWithoutRef<'h3'>
>(({ className, ...props }, ref) => (
    <>
        <div className="mb-8.5" />

        <h3
            ref={ref}
            className={cn(
                'text-md absolute left-0 right-0 top-0 line-clamp-1 truncate border-1.5 border-border bg-secondary py-1 pl-2 pr-9 font-medium text-primary',
                className,
            )}
            {...props}
        />
    </>
));
PopoverHeading.displayName = 'PopoverHeading';

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
        positionerProps?: React.ComponentPropsWithoutRef<
            typeof PopoverPrimitive.Positioner
        >;
        isDraggable?: boolean;
        hideCloseButton?: boolean;
        onPositionChange?: (position: { x: number; y: number }) => void;
    }
>(
    (
        {
            className,
            positionerProps: {
                align = 'center' as const,
                sideOffset = 4,
                side = 'bottom' as const,
                className: positionerClassName = '',
                ...positionerProps
            } = {},
            isDraggable = true,
            onPositionChange,
            children,
            hideCloseButton = false,
            ...props
        },
        ref,
    ) => {
        const contentRef = useRef<HTMLDivElement>(null);
        const combinedRef = useForwardedRef(contentRef, ref);

        const { position, isDragging, onPointerDown, hasDragged } =
            useDraggablePosition({
                isEnabled: isDraggable,
                onPositionChange,
                elementRef: contentRef,
                constrainToViewport: true,
            });

        const { anchoredPosition } = useCornerAnchor({
            isEnabled: isDraggable,
            position,
            elementRef: contentRef,
        });

        return (
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Positioner
                    style={
                        hasDragged
                            ? {
                                  transform: `translate(${anchoredPosition.x}px, ${anchoredPosition.y}px)`,
                              }
                            : undefined
                    }
                    className={cn(
                        positionerClassName,
                        'z-50',
                        className,
                        hasDragged && 'fixed left-0 top-0',
                    )}
                    sideOffset={sideOffset}
                    align={align}
                    side={side}
                    {...positionerProps}
                >
                    <PopoverPrimitive.Popup
                        ref={combinedRef}
                        className={cn(
                            'select-none border-1.5 border-border bg-popover p-2 text-popover-foreground shadow-md outline-none',
                            isDragging && 'cursor-grabbing',
                            className,
                        )}
                        {...props}
                    >
                        {children}
                        {isDraggable && (
                            <div
                                className={cn(
                                    'absolute inset-x-0 top-0 h-8.5 cursor-grab transition-colors',
                                    'flex items-center justify-center',
                                    isDragging && 'cursor-grabbing',
                                )}
                                onPointerDown={onPointerDown}
                            ></div>
                        )}

                        {!hideCloseButton && (
                            <PopoverPrimitive.Close
                                render={(props) => (
                                    <button
                                        className="svg-outline absolute right-0 top-0 border-1.5 border-primary bg-white text-primary"
                                        {...props}
                                    >
                                        <X />
                                        <span className="sr-only">Close</span>
                                    </button>
                                )}
                            />
                        )}
                    </PopoverPrimitive.Popup>
                </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
        );
    },
);
PopoverContent.displayName = PopoverPrimitive.Popup.displayName;

const PopoverArrow = PopoverPrimitive.Arrow;

export {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverAnchor,
    PopoverArrow,
    PopoverHeading,
};
