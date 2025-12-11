'use client';

import { ReactNode, RefObject, useMemo, useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverHeading,
} from '@/components/ui/popover';
import { useLogs } from '@/lib/logs/logs.rest';
import type { Log } from '@/lib/logs/logs.rest';
import { store } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useSelector } from '@xstate/store/react';

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
        case 'daily_visit_grant':
            return 'Daily Visit Grant';
        case 'fun_money_grant':
            return 'Fun Money Grant';
        case 'plot_created':
            return 'Plot Created';
        case 'plot_updated':
            return 'Plot Updated';
        case 'plot_deleted':
            return 'Plot Deleted';
        case 'vote_aggregate':
            return 'Votes';
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

function getLogDescription(log: Log): ReactNode {
    switch (log.logType) {
        case 'initial_grant':
            return 'A small loan of 1 million dollars';
        case 'bailout_grant':
            return 'Funds to bail you out of debt';
        case 'fun_money_grant':
            return 'Fun money grant';
        case 'plot_created':
            return log.plot ? `Created "${log.plot.name}"` : 'Plot created';
        case 'plot_updated':
            return log.plot ? `Updated "${log.plot.name}"` : 'Plot updated';
        case 'plot_deleted':
            return log.plot ? `Deleted "${log.plot.name}"` : 'Plot deleted';
        case 'vote_aggregate':
            return (
                <div>
                    {(log.diffs?.votesCast?.length ?? 0) > 0 && (
                        <div className="mt-1">
                            <div>Votes Cast</div>
                            <ul>
                                {log.diffs?.votesCast?.map((vote) => (
                                    <li key={vote.name}>
                                        - {vote.name} {vote.oldScore} →{' '}
                                        {vote.newScore}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(log.diffs?.votesReceived?.length ?? 0) > 0 && (
                        <div className="mt-1">
                            <div>Votes Received</div>
                            <ul>
                                {log.diffs?.votesReceived?.map((vote) => (
                                    <li key={vote.name}>
                                        - {vote.name} {vote.oldScore} →{' '}
                                        {vote.newScore}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
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
    anchor,
    selectedPlotId,
    selectPlot,
}: {
    children: ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isLoading: boolean;
    error: Error | null;
    logs: Log[] | undefined;
    anchor: RefObject<HTMLElement | null>;
    selectedPlotId?: number;
    selectPlot: (plotId: number) => void;
}) {
    const positionerProps = useMemo(() => {
        return {
            anchor,
            side: 'top' as const,
            align: 'center' as const,
        };
    }, [anchor]);

    return (
        <Popover
            type="persistent"
            modal={false}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            {children}
            <PopoverContent className="w-80" positionerProps={positionerProps}>
                <PopoverHeading>The log book </PopoverHeading>
                <div className="flex h-80 overflow-auto">
                    {isLoading ? (
                        <div className="flex-1 pt-20 text-center text-sm text-muted-foreground">
                            Loading logs...
                        </div>
                    ) : error ? (
                        <div className="flex-1 pt-20 text-center text-sm text-red-600">
                            Failed to load logs
                        </div>
                    ) : logs == null || logs.length === 0 ? (
                        <div className="flex-1 pt-20 text-center text-sm text-muted-foreground">
                            No logs found
                        </div>
                    ) : (
                        <div className="flex w-full flex-col">
                            {logs.map((log) => {
                                const balanceChange = getBalanceChangeDisplay(
                                    log.oldBalance,
                                    log.newBalance,
                                );
                                const isSelected =
                                    selectedPlotId === log.plotId;

                                return (
                                    <div
                                        key={log.id}
                                        className={cn(
                                            'svg-outline-inset group relative z-0 block border-transparent bg-transparent p-2 text-left text-foreground outline-none',
                                            'hover:bg-black hover:text-background',
                                            isSelected && 'bg-secondary',
                                        )}
                                        tabIndex={0}
                                        onClick={() => {
                                            if (log.plotId == null) return;

                                            selectPlot(log.plotId);
                                        }}
                                        aria-disabled={!log.plotId}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium">
                                                        {getLogTypeDisplay(
                                                            log.logType,
                                                        )}
                                                    </div>
                                                    {balanceChange.display !==
                                                        '0' && (
                                                        <div
                                                            className={cn(
                                                                'font-mono text-sm',
                                                                balanceChange.isPositive
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600',
                                                            )}
                                                        >
                                                            {
                                                                balanceChange.display
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 text-xs text-muted-foreground group-hover:text-muted">
                                                    {getLogDescription(log)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-xs text-muted-foreground group-hover:text-muted">
                                                    Balance: {log.newBalance}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground group-hover:text-muted">
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

export function LogsPopover({
    children,
    anchor,
}: {
    children: ReactNode;
    anchor: RefObject<HTMLElement | null>;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedPlotId = useSelector(
        store,
        (state) => state.context.toolSettings?.claimer.selectedPlotId,
    );

    const selectPlot = (plotId: number) => {
        store.trigger.selectPlot({ plotId });
        store.trigger.moveToPlot({ plotId });
    };

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
            anchor={anchor}
            selectedPlotId={selectedPlotId ?? undefined}
            selectPlot={selectPlot}
        >
            {children}
        </LogsPopoverMarkup>
    );
}
