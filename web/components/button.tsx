import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

export function Button({
    className,
    ...props
}: ComponentPropsWithoutRef<'button'>) {
    return (
        <button
            className={cn(
                'svg-outline-sm relative no-underline outline-none',
                className,
            )}
            {...props}
        />
    );
}
