import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    ({ className, type, ...props }, ref) => {
        return (
            <div className={cn('svg-outline-within-sm relative', className)}>
                <input
                    type={type}
                    className={cn(
                        'flex h-8 w-full border-1.5 border-input bg-transparent text-base',
                        'pl-1',
                        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
                        'outline-none placeholder:text-muted-foreground',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
