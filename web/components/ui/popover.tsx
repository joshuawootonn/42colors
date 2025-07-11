'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
        align?: 'center' | 'start' | 'end';
        sideOffset?: number;
    }
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner align={align} sideOffset={sideOffset}>
            <PopoverPrimitive.Popup
                ref={ref}
                className={cn(
                    'z-50 border bg-popover p-2 text-popover-foreground shadow-md outline-none',
                    className,
                )}
                {...props}
            />
        </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

const PopoverArrow = PopoverPrimitive.Arrow;

export { Popover, PopoverTrigger, PopoverContent, PopoverArrow };
