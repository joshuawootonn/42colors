'use client';

import { motion } from 'motion/react';
import { Toaster as Sonner, toast as sonnerToast } from 'sonner';

import { useState } from 'react';

import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { Collapsible } from '@base-ui/react/collapsible';

import { X24 } from '../icons/x_24';
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
            closeButton={true}
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
        title: 'Login to claim land',
        description:
            'If you want to protect your art from would be vandals, log in and claim a plot with pixels you are granted.',
        button: buttonOptions,
    }),
    loginToSavePixels: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login to protect drawing',
        description:
            'If you want to edit the canvas, you need to log in. This helps keep the canvas safer for everyone.',
        button: buttonOptions,
    }),
    loginToUseBucket: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login to enable the bucket tool',
        description:
            'Powerful tools are reserved for pixels you have claimed. To use the bucket tool, create an account, claim some land, and try again.',
        button: buttonOptions,
    }),
    loginToUseLine: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login to enable the line tool',
        description:
            'Powerful tools are reserved for logged-in users. To use the line tool, create an account and try again.',
        button: buttonOptions,
    }),
    loginToUseEyedropper: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => ({
        title: 'Login to enable the eyedropper',
        description:
            'The eyedropper tool is reserved for logged-in users. Create an account to pick colors from the canvas.',
        button: buttonOptions,
    }),
    loginToVote: (buttonOptions: { label: string; onClick: () => void }) => ({
        title: 'Login to vote',
        description:
            'Voting helps artists get discovered and rewards them with pixels. Log in to start supporting the art you love.',
        button: buttonOptions,
    }),
    dailyGrantClaimed: {
        title: 'Daily grant claimed (+1000)',
        description:
            'Every day you visit 42colors you are granted 1000 pixels. Right now you can use these pixels to claim land and protect your art, but soon it they will also be your passage to voting on other art and much more. ',
    },
    cannotDrawOnPlot: {
        title: "You can't draw here",
        description:
            "It's someone else's plot. Either draw in the open area or claim a plot for yourself.",
    },
    cannotBucketOtherPlot: {
        title: "You can't bucket fill here",
        description:
            "It's someone else's plot. Claim a plot for yourself and try again.",
    },
    cannotBucketOutsidePlot: {
        title: "You can't bucket fill here",
        description:
            'The bucket fill tool is reserved for pixels you have claimed. Claim a plot for yourself and try again.',
    },
    voteUnauthorized: {
        title: 'Cannot vote',
        description: "Create a plot first to start voting on others' art.",
    },
    alreadyVoted: {
        title: 'Already voted',
        description: 'You have already voted on this plot.',
    },
    voteFailed: (message?: string) => ({
        title: 'Vote failed',
        description: message || 'Something went wrong.',
    }),
    cantMoveToDeletedPlot: (deletedAt: string) => ({
        title: 'Cannot move to deleted plot',
        description: `This plot was deleted on ${new Date(deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}. Pour one out 🫗 `,
    }),
    plotNotFound: {
        title: 'Plot not found',
        description: "We couldn't find that plot. It may have never existed.",
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
    loginToUseLine: (buttonOptions: { label: string; onClick: () => void }) =>
        toast(TOASTS.loginToUseLine(buttonOptions)),
    loginToUseEyedropper: (buttonOptions: {
        label: string;
        onClick: () => void;
    }) => toast(TOASTS.loginToUseEyedropper(buttonOptions)),
    loginToVote: (buttonOptions: { label: string; onClick: () => void }) =>
        toast(TOASTS.loginToVote(buttonOptions)),
    cannotDrawOnPlot: () => toast(TOASTS.cannotDrawOnPlot),
    cannotBucketOtherPlot: () => toast(TOASTS.cannotBucketOtherPlot),
    cannotBucketOutsidePlot: () => toast(TOASTS.cannotBucketOutsidePlot),
    voteUnauthorized: () => toast(TOASTS.voteUnauthorized),
    alreadyVoted: () => toast(TOASTS.alreadyVoted),
    voteFailed: (message?: string) => toast(TOASTS.voteFailed(message)),
    cantMoveToDeletedPlot: (deletedAt: string) =>
        toast(TOASTS.cantMoveToDeletedPlot(deletedAt)),
    plotNotFound: () => toast(TOASTS.plotNotFound),
} as const;

const _closeButtonVariants = {
    hidden: {
        x: 24,
        y: 0,
        opacity: 0,
        scale: 0.98,
    },
    visible: {
        x: 26,
        y: 0,
        opacity: 1,
        scale: 1,
    },
};

const chevronVariants = {
    closed: {
        rotate: 0,
    },
    open: {
        rotate: 90,
    },
};

export function Toast(props: ToastProps) {
    const { title, description, button, id } = props;
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            className={cn(
                'group flex w-105 max-w-full items-center text-pretty font-sans shadow-lg md:max-w-120',
                'relative z-0',
            )}
            initial="visible"
            whileHover="visible"
            animate="visible"
        >
            <motion.div
                onClick={() => sonnerToast.dismiss(id)}
                className={cn(
                    'absolute right-0 top-0 -z-10',
                    'flex flex-col items-center justify-center',
                    '-space-y-[1.5px]',
                )}
            ></motion.div>
            <Collapsible.Root
                open={isOpen}
                onOpenChange={setIsOpen}
                className={cn(
                    'flex-grow border-1.5 border-primary bg-secondary',
                    'py-4 pl-2.5 pr-3',
                )}
            >
                <Collapsible.Trigger
                    className={cn(
                        'group flex w-full items-center justify-start text-primary outline-none hover:text-primary focus-visible:text-primary',
                        'space-x-2',
                    )}
                >
                    <motion.svg
                        className={cn(
                            'flex items-center justify-center text-primary',
                            'size-5',
                        )}
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        initial="closed"
                        animate={isOpen ? 'open' : 'closed'}
                        variants={chevronVariants}
                        transition={{
                            type: 'tween',
                            duration: 0.09,
                            ease: 'easeOut',
                        }}
                    >
                        <path
                            d="M9 18L15 12L9 6"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>

                    <p
                        className={cn(
                            'text-md flex-grow translate-y-[-1px] text-left leading-[19.5px] text-primary',
                        )}
                    >
                        {title}
                    </p>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            sonnerToast.dismiss(id);
                        }}
                        className={cn(
                            'relative z-0',
                            'flex items-center justify-center text-primary outline-none hover:text-primary focus-visible:text-primary',
                            'before:content-[" "] before:absolute before:-inset-4 before:opacity-0',
                            'size-5',
                        )}
                        aria-label="Close"
                    >
                        <X24 />
                    </div>
                </Collapsible.Trigger>

                <Collapsible.Panel
                    className={cn(
                        'flex w-full flex-col',
                        'h-[var(--collapsible-panel-height)] data-[ending-style]:h-0 data-[starting-style]:h-0',
                        'data-open:opacity-100 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
                        'data-open:mt-2 data-[ending-style]:mt-0 data-[starting-style]:mt-0',
                        'flex flex-col justify-end overflow-hidden text-sm',
                        'data-[open]:[transition:height_0.15s_ease,margin-top_0.15s_ease_0.0s,opacity_0.075s_ease_0.075s]',
                        'data-[closed]:[transition:height_0.15s_ease,margin-top_0.15s_ease_0.0s,opacity_0.075s_ease_0.0s]',
                        'mt-2',
                    )}
                >
                    <p className={cn('text-pretty pl-2 text-sm text-gray-500')}>
                        {description}
                    </p>
                    {button && (
                        <div className="relative z-0 float-right mt-2 self-end">
                            <Button
                                size="sm"
                                onClick={() => {
                                    button.onClick();
                                    sonnerToast.dismiss(id);
                                }}
                            >
                                {button.label}
                            </Button>
                        </div>
                    )}
                </Collapsible.Panel>
            </Collapsible.Root>
        </motion.div>
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
