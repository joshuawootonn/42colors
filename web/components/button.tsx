import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

export function Button({
    className,
    ...props
}: ComponentPropsWithoutRef<'button'>) {
    return (
        <button
            className={cn(
                'outline-none svg-outline-sm relative no-underline',
                className,
            )}
            {...props}
        />
    );
}
