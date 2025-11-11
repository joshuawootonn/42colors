'use client';

import { Toaster as Sonner, toast as sonnerToast } from 'sonner';

import { useTheme } from 'next-themes';

import { Button } from './button';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            duration={5000}
            style={{ '--width': '420px' } as React.CSSProperties}
            offset={12}
            gap={12}
            position="bottom-center"
            expand
            {...props}
        />
    );
};

/** I recommend abstracting the toast function
 *  so that you can call it without having to use toast.custom everytime. */
function _toast(toast: Omit<ToastProps, 'id'>) {
    return sonnerToast.custom((id) => (
        <Toast
            id={id}
            title={toast.title}
            description={toast.description}
            button={toast.button}
        />
    ));
}

const throttledKeys: string[] = [];

export function throttleByKey<T extends Omit<ToastProps, 'id'>>(
    callback: (p: T) => void,
) {
    return function (params: T) {
        if (throttledKeys.indexOf(params.title) === -1) {
            callback(params);
            throttledKeys.push(params.title);
            setTimeout(function () {
                const i = throttledKeys.indexOf(params.title);
                if (i > -1) throttledKeys.splice(i, 1);
            }, 5000);
        }
    };
}

const toast = throttleByKey(_toast);

export const TOASTS = {
    loginToClaimLand: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login (when you are ready)',
        description: 'to claim land and protect your art',
        button: buttonOptions,
    }),
    loginToSavePixels: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login (when you are ready)',
        description: 'to save and share your pixels',
        button: buttonOptions,
    }),
    loginToUseBucket: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login (when you are ready)',
        description: 'to enable the bucket tool and much more',
        button: buttonOptions,
    }),
    dailyGrantClaimed: {
        title: 'Daily Grant Claimed',
        description: '1,000 pixels for visiting today',
    },
    cannotDrawOnPlot: {
        title: "You can't draw here",
        description:
            "It's someone else's claim. Either draw in the open area or claim a plot for yourself.",
    },
    cannotBucketOtherPlot: {
        title: "You can't bucket fill here",
        description: "This plot doesn't belongs to you.",
    },
    cannotBucketOutsidePlot: {
        title: "You can't bucket fill here",
        description:
            'The bucket fill tool only works within plots you have claimed.',
    },
} as const;

export type ToastKey = keyof typeof TOASTS;

// Export individual toast functions for better type inference
export const toasts = {
    loginToClaimLand: (buttonOptions: { label: string; onClick: () => void }) =>
        toast(TOASTS.loginToClaimLand(buttonOptions)),
    dailyGrantClaimed: () => toast(TOASTS.dailyGrantClaimed),
    loginToSavePixels: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => toast(TOASTS.loginToSavePixels(buttonOptions)),
    loginToUseBucket: (buttonOptions: { label: string; onClick: () => void }) =>
        toast(TOASTS.loginToUseBucket(buttonOptions)),
    cannotDrawOnPlot: () => toast(TOASTS.cannotDrawOnPlot),
    cannotBucketOtherPlot: () => toast(TOASTS.cannotBucketOtherPlot),
    cannotBucketOutsidePlot: () => toast(TOASTS.cannotBucketOutsidePlot),
} as const;

export function Toast(props: ToastProps) {
    const { title, description, button, id } = props;

    return (
        <div className="flex w-105 max-w-full items-center text-pretty border-1.5 border-primary bg-secondary p-4 font-sans shadow-lg md:max-w-120">
            <div className="flex flex-1 items-center">
                <div className="w-full">
                    <p className="text-sm text-primary">{title}</p>
                    <p className="mt-1 text-pretty text-sm text-gray-500">
                        {description}
                    </p>
                </div>
            </div>
            <div className="ml-4 shrink-0">
                {button && (
                    <Button
                        size="sm"
                        onClick={() => {
                            button.onClick();
                            sonnerToast.dismiss(id);
                        }}
                    >
                        {button.label}
                    </Button>
                )}
            </div>
        </div>
    );
}

interface ToastProps {
    id: string | number;
    title: string;
    description: string;
    button?: {
        label: string;
        onClick: () => void;
    };
}

export { Toaster, toast };
