'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Menu } from '@base-ui-components/react/menu';

const DropdownMenu = Menu.Root;

const DropdownMenuTrigger = Menu.Trigger;

const DropdownMenuGroup = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('', className)}
        {...props}
    />
));
DropdownMenuGroup.displayName = 'DropdownMenuGroup';

const DropdownMenuPortal = Menu.Portal;

const DropdownMenuSub = Menu.Root;

const DropdownMenuRadioGroup = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('', className)}
        {...props}
    />
));
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

const DropdownMenuSubTrigger = React.forwardRef<
    React.ElementRef<typeof Menu.Trigger>,
    React.ComponentPropsWithoutRef<typeof Menu.Trigger> & {
        inset?: boolean;
        children?: React.ReactNode;
    }
>(({ className, inset, children, ...props }, ref) => (
    <Menu.Trigger
        ref={ref}
        className={cn(
            'flex cursor-default gap-2 select-none items-center px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
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
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-auto"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    </Menu.Trigger>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef<
    React.ElementRef<typeof Menu.Popup>,
    React.ComponentPropsWithoutRef<typeof Menu.Popup>
>(({ className, ...props }, ref) => (
    <Menu.Portal>
        <Menu.Positioner>
            <Menu.Popup
                ref={ref}
                className={cn(
                    'z-50 min-w-[8rem] overflow-hidden border bg-popover p-1 text-popover-foreground shadow-lg',
                    className,
                )}
                {...props}
            />
        </Menu.Positioner>
    </Menu.Portal>
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

const DropdownMenuContent = React.forwardRef<
    React.ElementRef<typeof Menu.Popup>,
    React.ComponentPropsWithoutRef<typeof Menu.Popup>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <Menu.Portal>
        <Menu.Positioner sideOffset={sideOffset}>
            <Menu.Popup
                ref={ref}
                className={cn(
                    'z-50 min-w-[8rem] overflow-hidden border bg-popover text-popover-foreground shadow-md',
                    className,
                )}
                {...props}
            />
        </Menu.Positioner>
    </Menu.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
    React.ElementRef<typeof Menu.Item>,
    React.ComponentPropsWithoutRef<typeof Menu.Item> & {
        inset?: boolean;
    }
>(({ className, inset, ...props }, ref) => (
    <Menu.Item
        ref={ref}
        className={cn(
            'relative flex cursor-default select-none items-center gap-2 px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground',
            inset && 'pl-8',
            className,
        )}
        {...props}
    />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = React.forwardRef<
    React.ElementRef<typeof Menu.Item>,
    React.ComponentPropsWithoutRef<typeof Menu.Item> & {
        checked?: boolean;
    }
>(({ className, children, checked, ...props }, ref) => (
    <Menu.Item
        ref={ref}
        className={cn(
            'relative flex cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            {checked && (
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
            )}
        </span>
        {children}
    </Menu.Item>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = React.forwardRef<
    React.ElementRef<typeof Menu.Item>,
    React.ComponentPropsWithoutRef<typeof Menu.Item>
>(({ className, children, ...props }, ref) => (
    <Menu.Item
        ref={ref}
        className={cn(
            'relative flex cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
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
        </span>
        {children}
    </Menu.Item>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = React.forwardRef<
    HTMLDivElement,
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
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-muted', className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
