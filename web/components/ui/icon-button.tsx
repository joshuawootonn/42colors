import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

export function IconButton({
    className,
    children,
    ...props
}: ComponentPropsWithoutRef<'button'> & {}) {
    return (
        <button
            {...props}
            className={cn(
                'svg-outline group relative flex size-8 items-center justify-center border-1.5 border-border bg-white text-black',
                'rounded-none outline-none focus-visible:border-border',
                className,
            )}
        >
            {children}
        </button>
    );
}
