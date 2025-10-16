import { type VariantProps, cva } from 'class-variance-authority';

import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'relative svg-outline-sm inline-flex items-center justify-center gap-2 whitespace-nowrap  text-sm transition-colors outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-sm',
                outline: 'border-1.5 border-input bg-background shadow-sm',
                // secondary: "bg-secondary text-secondary-foreground shadow-sm",
                // ghost: "hover:bg-accent hover:text-accent-foreground",
                link: 'text-primary relative svg-outline-xs',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                default: 'h-8 px-4',
                // lg: "h-10 px-8",
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        const Comp = 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
