'use client';

import { ReactNode, useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverHeading,
} from '@/components/ui/popover';
import { useLogs } from '@/lib/logs/logs.rest';
import type { Log } from '@/lib/logs/logs.rest';
import { cn } from '@/lib/utils';

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getLogTypeDisplay(logType: Log['logType']): string {
    switch (logType) {
        case 'initial_grant':
            return 'Initial Grant';
        case 'bailout_grant':
            return 'Bailout Grant';
        case 'plot_created':
            return 'Plot Created';
        case 'plot_updated':
            return 'Plot Updated';
        case 'plot_deleted':
            return 'Plot Deleted';
        default:
            return logType;
    }
}

function getBalanceChangeDisplay(
    oldBalance: number,
    newBalance: number,
): {
    amount: number;
    isPositive: boolean;
    display: string;
} {
    const amount = newBalance - oldBalance;
    const isPositive = amount > 0;
    const display = isPositive ? `+${amount}` : `${amount}`;

    return { amount, isPositive, display };
}

function getLogDescription(log: Log): string {
    switch (log.logType) {
        case 'initial_grant':
            return 'Welcome bonus received';
        case 'bailout_grant':
            return 'Emergency funds granted';
        case 'plot_created':
            return log.plot ? `Created "${log.plot.name}"` : 'Plot created';
        case 'plot_updated':
            return log.plot ? `Updated "${log.plot.name}"` : 'Plot updated';
        case 'plot_deleted':
            return log.diffs?.plotName
                ? `Deleted "${log.diffs.plotName}"`
                : 'Plot deleted';
        default:
            return 'Transaction';
    }
}

export function LogsPopoverMarkup({
    children,
    isOpen,
    setIsOpen,
    isLoading,
    error,
    logs,
}: {
    children: ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isLoading: boolean;
    error: Error | null;
    logs: Log[] | undefined;
}) {
    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {children}
            <PopoverContent
                className="w-96"
                positionerProps={{
                    side: 'top',
                    align: 'center',
                }}
            >
                <PopoverHeading>The log book </PopoverHeading>
                <div className="max-h-96 overflow-auto outline-none">
                    {isLoading ? (
                        <div className="py-20 text-center text-sm text-muted-foreground">
                            Loading logs...
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-sm text-red-600">
                            Failed to load logs
                        </div>
                    ) : logs == null || logs.length === 0 ? (
                        <div className="py-20 text-center text-sm text-muted-foreground">
                            No logs found
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-1">
                            {logs.map((log) => {
                                const balanceChange = getBalanceChangeDisplay(
                                    log.oldBalance,
                                    log.newBalance,
                                );

                                return (
                                    <div
                                        key={log.id}
                                        className={cn(
                                            'relative',
                                            'border-1.5 border-transparent bg-transparent p-3 text-left text-foreground',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium">
                                                        {getLogTypeDisplay(
                                                            log.logType,
                                                        )}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'font-mono text-sm',
                                                            balanceChange.isPositive
                                                                ? 'text-green-600'
                                                                : 'text-red-600',
                                                        )}
                                                    >
                                                        {balanceChange.display}
                                                    </div>
                                                </div>
                                                <div className="mt-0.5 text-xs text-muted-foreground">
                                                    {getLogDescription(log)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-xs text-muted-foreground">
                                                    Balance: {log.newBalance}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {formatDate(log.insertedAt)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function LogsPopover({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        data: logs,
        isLoading,
        error,
    } = useLogs(20, {
        enabled: isOpen,
    });

    return (
        <LogsPopoverMarkup
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isLoading={isLoading}
            error={error}
            logs={logs}
        >
            {children}
        </LogsPopoverMarkup>
    );
}
