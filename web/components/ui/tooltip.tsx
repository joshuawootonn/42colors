'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

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
            'z-50 origin-[--radix-tooltip-content-transform-origin] overflow-hidden bg-primary px-3 py-1.5 text-xs text-primary-foreground',
            className,
        )}
        {...props}
    />
));
Popup.displayName = TooltipPrimitive.Popup.displayName;

const Arrow = TooltipPrimitive.Arrow;

export { Root, Trigger, Positioner, Popup, Provider, Arrow, Portal };
