import { type VariantProps, cva } from "class-variance-authority";

import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "relative svg-outline inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm outline-none  [&_svg]:pointer-events-none [&_svg]:shrink-0",
    // specifying aria-disabled since we want to be able to "disable without disabling" to enable tooltips
    "disabled:pointer-events-none aria-[disabled]:pointer-events-none",
  ),
  {
    variants: {
      variant: {
        default: "border-1.5 border-primary bg-primary text-primary-foreground shadow",
        destructive: "bg-destructive text-destructive-foreground shadow-sm",
        outline: "border-1.5 border-primary bg-background shadow-sm",
        // secondary: "bg-secondary text-secondary-foreground shadow-sm",
        // ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary relative svg-outline-xs",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-8 px-4",
        // lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, onClick, ["aria-disabled"]: ariaDisabled, ...props }, ref) => {
    const handleOnClick = React.useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        if (ariaDisabled) {
          e.preventDefault();
        }
        onClick?.(e);
      },
      [ariaDisabled, onClick],
    );

    const Comp = "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleOnClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
