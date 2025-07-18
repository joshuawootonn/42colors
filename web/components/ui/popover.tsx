'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Root;

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
        positionerProps: React.ComponentPropsWithoutRef<
            typeof PopoverPrimitive.Positioner
        >;
    }
>(
    (
        {
            className,
            positionerProps: {
                align = 'center' as const,
                sideOffset = 4,
                ...positionerProps
            } = {},
            ...props
        },
        ref,
    ) => {
        return (
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Positioner
                    align={align}
                    sideOffset={sideOffset}
                    className={cn(positionerProps.className, 'z-50')}
                    {...positionerProps}
                >
                    <PopoverPrimitive.Popup
                        ref={ref}
                        className={cn(
                            'border bg-popover p-2 text-popover-foreground shadow-md outline-none',
                            className,
                        )}
                        {...props}
                    />
                </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
        );
    },
);
PopoverContent.displayName = PopoverPrimitive.Popup.displayName;

const PopoverArrow = PopoverPrimitive.Arrow;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverArrow };
