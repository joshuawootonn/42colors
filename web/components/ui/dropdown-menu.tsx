'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Menu as DropdownMenuPrimitive } from '@base-ui/react/menu';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Trigger
        ref={ref}
        className={cn(className, 'svg-outline-sm relative select-none py-0')}
        {...props}
    />
));
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSubRoot = DropdownMenuPrimitive.SubmenuRoot;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubmenuTrigger>,
    React.ComponentPropsWithoutRef<
        typeof DropdownMenuPrimitive.SubmenuTrigger
    > & {
        inset?: boolean;
    }
>(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubmenuTrigger
        ref={ref}
        className={cn(
            'flex cursor-default select-none items-center gap-2',
            'relative flex cursor-pointer select-none items-center gap-2 px-2 py-1 text-sm no-underline outline-none focus:bg-primary focus:text-secondary',
            '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
            inset && 'pl-8',
            className,
        )}
        {...props}
    >
        {children}
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="-4 -4 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="ml-auto"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    </DropdownMenuPrimitive.SubmenuTrigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup> & {
        positionerProps?: React.ComponentPropsWithoutRef<
            typeof DropdownMenuPrimitive.Positioner
        >;
    }
>(({ className, positionerProps, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Positioner {...positionerProps}>
            <DropdownMenuPrimitive.Popup
                ref={ref}
                className={cn(
                    'z-50 flex min-w-[8rem] flex-col overflow-hidden border-1.5 border-primary bg-popover text-popover-foreground shadow-md',
                    'svg-outline-border relative',
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Positioner>
    </DropdownMenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.Popup.displayName;

const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Popup> & {
        positionerProps?: React.ComponentPropsWithoutRef<
            typeof DropdownMenuPrimitive.Positioner
        >;
    }
>(({ className, positionerProps, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Positioner {...positionerProps}>
            <DropdownMenuPrimitive.Popup
                ref={ref}
                className={cn(
                    'z-50 flex min-w-[8rem] flex-col overflow-hidden border-1.5 border-primary bg-popover text-popover-foreground shadow-md',
                    'svg-outline-border relative',
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Positioner>
    </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Popup.displayName;

const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            'relative flex cursor-pointer select-none items-center gap-2 px-2 py-1 text-sm no-underline outline-none focus:bg-primary focus:text-secondary',
            inset && 'pl-8',
            className,
        )}
        {...props}
    />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            'relative flex cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <DropdownMenuPrimitive.CheckboxItemIndicator>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="-4 -4 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            </DropdownMenuPrimitive.CheckboxItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
    DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            'relative flex cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <DropdownMenuPrimitive.RadioItemIndicator>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="-4 -4 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-2 w-2 fill-current"
                >
                    <circle cx="12" cy="12" r="10" />
                </svg>
            </DropdownMenuPrimitive.RadioItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
    React.ElementRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'px-2 py-1.5 text-sm font-semibold',
            inset && 'pl-8',
            className,
        )}
        {...props}
    />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-muted', className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
    return (
        <span
            className={cn(
                'ml-auto text-xs tracking-widest opacity-60',
                className,
            )}
            {...props}
        />
    );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSubRoot,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
