'use client';

import * as React from 'react';
import { createContext, useContext } from 'react';

import { cn } from '@/lib/utils';
import { Dialog as DialogPrimitive } from '@base-ui-components/react/dialog';

import { X } from '../icons/x';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Backdrop>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Backdrop
        ref={ref}
        className={cn('fixed inset-0 z-50 bg-black/5', className)}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Backdrop.displayName;

const DialogContext = createContext<boolean>(false);

function useIsWithinDialogContext() {
    return useContext(DialogContext);
}

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Popup>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup> & {
        onInteractOutside?: (event: PointerEvent) => void;
    }
>(({ className, children, onInteractOutside, ...props }: {
    className?: string;
    children?: React.ReactNode;
    onInteractOutside?: (event: PointerEvent) => void;
} & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>, ref: React.ForwardedRef<React.ElementRef<typeof DialogPrimitive.Popup>>) => (
    <DialogPortal>
        <DialogOverlay />

        <DialogPrimitive.Popup
            ref={ref}
            className={cn(
                'fixed left-[50%] top-[50%] z-50 flex w-full max-w-[calc(100vw-40px)] max-h-[min(calc(100vh-40px),600px)] translate-x-[-50%] translate-y-[-50%] gap-4 border-1.5 border-primary bg-background shadow-lg ',
                className,
            )}
            onInteractOutside={onInteractOutside}
            {...props}
        >
            <DialogContext.Provider value={true}>
                <div className="w-full overflow-y-auto p-4">{children}</div>
                <DialogPrimitive.Close className="z-10 absolute right-1 top-1 translate-x-1/2 -translate-y-1/2 bg-white border-1.5 border-primary disabled:pointer-events-none svg-outline">
                    <div className="relative">
                        <X />
                    </div>
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogContext.Provider>
        </DialogPrimitive.Popup>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Popup.displayName;

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col space-y-1.5 text-center sm:text-left',
            className,
        )}
        {...props}
    />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
            className,
        )}
        {...props}
    />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('font-semibold leading-none tracking-tight', className)}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    useIsWithinDialogContext,
};
