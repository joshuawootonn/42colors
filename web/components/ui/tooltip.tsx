'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Tooltip as TooltipPrimitive } from '@base-ui-components/react/tooltip';

const Provider = TooltipPrimitive.Provider;

const Root = TooltipPrimitive.Root;

const Trigger = TooltipPrimitive.Trigger;

const Portal = TooltipPrimitive.Portal;

const Positioner = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Positioner>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Positioner>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Positioner
        ref={ref}
        className={cn(className)}
        sideOffset={sideOffset}
        {...props}
    />
));
Positioner.displayName = TooltipPrimitive.Positioner.displayName;

const Popup = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup>
>(({ className, ...props }, ref) => (
    <TooltipPrimitive.Popup
        ref={ref}
        className={cn(
            'z-50 origin-[--radix-tooltip-content-transform-origin] overflow-hidden bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className,
        )}
        {...props}
    />
));
Popup.displayName = TooltipPrimitive.Popup.displayName;

const Arrow = TooltipPrimitive.Arrow;

export { Root, Trigger, Positioner, Popup, Provider, Arrow, Portal };
