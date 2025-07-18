'use client';

import * as React from 'react';
import { useRef } from 'react';

import { useForwardedRef } from '@/components/ui/hooks/use-forwarded-ref';
import { cn } from '@/lib/utils';
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover';

import { X } from '../icons/x';
import { useCornerAnchor } from './hooks/use-corner-anchor';
import { useDraggablePosition } from './hooks/use-draggable-position';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Root;

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
        positionerProps?: React.ComponentPropsWithoutRef<
            typeof PopoverPrimitive.Positioner
        >;
        isDraggable?: boolean;
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
                        'z-50 ',
                        className,
                        hasDragged && 'fixed top-0 left-0',
                    )}
                    sideOffset={sideOffset}
                    align={align}
                    side={side}
                    {...positionerProps}
                >
                    <PopoverPrimitive.Popup
                        ref={combinedRef}
                        className={cn(
                            ' border-black border-1.5 bg-popover p-2 text-popover-foreground shadow-md outline-none select-none',
                            isDragging && 'cursor-grabbing',
                            className,
                        )}
                        {...props}
                    >
                        <div
                            className={cn(
                                'absolute inset-x-0 top-0  h-6 cursor-grab transition-colors',
                                'flex items-center justify-center',
                                isDragging && 'cursor-grabbing',
                            )}
                            onPointerDown={onPointerDown}
                        >
                            <div className="w-8 h-1 bg-black" />
                        </div>

                        {children}

                        <PopoverPrimitive.Close
                            render={(props) => (
                                <button
                                    className="absolute top-0 right-0 bg-white text-primary  border-1.5 border-primary svg-outline"
                                    {...props}
                                >
                                    <X />
                                    <span className="sr-only">Close</span>
                                </button>
                            )}
                        />
                    </PopoverPrimitive.Popup>
                </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
        );
    },
);
PopoverContent.displayName = PopoverPrimitive.Popup.displayName;

const PopoverArrow = PopoverPrimitive.Arrow;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverArrow };
