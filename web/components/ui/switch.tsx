'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                className={cn(
                    'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border-1.5 border-transparent shadow-sm transition-colors',
                    'svg-outline-sm relative z-0',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'border-primary',
                    checked ? 'bg-primary' : 'bg-secondary',
                    className,
                )}
                onClick={() => onCheckedChange?.(!checked)}
                ref={ref as React.Ref<HTMLButtonElement>}
                {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            >
                <span
                    className={cn(
                        'pointer-events-none block size-5.5 border-1.5 border-primary bg-background shadow-lg ring-0 ring-primary transition-transform',
                        checked ? 'translate-x-[13px]' : 'translate-x-[-2px]',
                    )}
                />
            </button>
        );
    },
);

Switch.displayName = 'Switch';
