"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useState } from "react";

import { cn } from "@/lib/utils";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { X32 } from "../icons/x_32";
import { OverlayZIndexProvider, useOverlayZIndex } from "./hooks/overlay-z-index-context";

type DialogOnOpenChange = NonNullable<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>["onOpenChange"]
>;

const Dialog = function ({
  onOpenChange,
  open: controlledOpen,
  defaultOpen = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;

  const handleOpenChange = useCallback<DialogOnOpenChange>(
    (open, eventDetails) => {
      setInternalOpen(open);
      onOpenChange?.(open, eventDetails);
    },
    [onOpenChange],
  );

  return (
    <OverlayZIndexProvider isOpen={isOpen}>
      <DialogPrimitive.Root
        {...props}
        open={controlledOpen}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
      />
    </OverlayZIndexProvider>
  );
};

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, style, ...props }, ref) => {
  const zIndex = useOverlayZIndex();

  return (
    <DialogPrimitive.Backdrop
      ref={ref}
      style={{ zIndex, ...style }}
      className={cn("fixed inset-0 bg-black/5", className)}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Backdrop.displayName;

const DialogContext = createContext<boolean>(false);

function useIsWithinDialogContext() {
  return useContext(DialogContext);
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>
>(({ className, children, style, ...props }, ref) => {
  const zIndex = useOverlayZIndex();

  return (
    <DialogPortal>
      <DialogOverlay />

      <DialogPrimitive.Popup
        ref={ref}
        style={{ zIndex, ...style }}
        className={cn(
          "fixed left-[50%] top-[50%] flex max-h-[min(calc(100vh-40px),600px)] w-full max-w-[calc(100vw-40px)] translate-x-[-50%] translate-y-[-50%] gap-4 border-1.5 border-primary bg-background shadow-lg",
          className,
        )}
        {...props}
      >
        <DialogContext.Provider value={true}>
          <div className="w-full overflow-y-auto p-4">{children}</div>
          <DialogPrimitive.Close
            render={(props) => (
              <button
                {...props}
                className="svg-outline absolute right-0 top-0 translate-x-[1.5px] translate-y-[-1.5px] border-1.5 border-primary bg-white"
              >
                <X32 />
                <span className="sr-only">Close</span>
              </button>
            )}
          />
        </DialogContext.Provider>
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Popup.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-2xl font-semibold tracking-tight", className)}
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
    className={cn("text-sm text-muted-foreground", className)}
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
