'use client';

import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { toasts } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from '@xstate/store/react';

import { ErrorCode } from '../../error-codes';
import { store } from '../../store';
import { Plot } from './claimer.rest';
import {
    UserVoteResponse,
    VoteError,
    VoteType,
    castVote,
    getUserVoteOnPlot,
} from './vote.rest';

type VoteButtonsProps = {
    plot: Plot;
};

const HOLD_DELAY = 300; // Initial delay before repeat starts
const HOLD_INTERVAL = 80; // Interval between repeats

export function VoteButtons({ plot }: VoteButtonsProps) {
    const queryClient = useQueryClient();
    const user = useSelector(store, (state) => state.context.user);

    // Hold state
    const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pendingVotesRef = useRef(0);
    const holdVoteTypeRef = useRef<VoteType | null>(null);
    const startBalanceRef = useRef<number | null>(null);

    // Local pending count for UI updates during hold
    const [pendingCount, setPendingCount] = useState(0);

    // Fetch user's current vote on this plot
    const { data: userVote } = useQuery({
        queryKey: ['votes', plot.id],
        queryFn: () => getUserVoteOnPlot(plot.id),
        enabled: !!user,
        staleTime: 30000,
    });

    // Cast vote mutation - sends the batch at the end
    const { mutate: vote } = useMutation({
        mutationFn: ({
            voteType,
            amount,
        }: {
            voteType: VoteType;
            amount: number;
        }) => castVote(plot.id, voteType, amount),

        onMutate: async ({ voteType, amount }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['votes', plot.id] });

            // Snapshot the previous value
            const previousVote = queryClient.getQueryData<UserVoteResponse>([
                'votes',
                plot.id,
            ]);

            // Optimistically update the vote
            queryClient.setQueryData<UserVoteResponse>(
                ['votes', plot.id],
                (old) => ({
                    total: (old?.total ?? 0) + amount,
                    vote_type: voteType,
                }),
            );

            return { previousVote };
        },

        onError: (err, variables, context) => {
            // Rollback the optimistic update
            if (context?.previousVote) {
                queryClient.setQueryData(
                    ['votes', plot.id],
                    context.previousVote,
                );
            }

            // Rollback balance
            if (user && startBalanceRef.current !== null) {
                store.trigger.setUser({
                    user: {
                        ...user,
                        balance: startBalanceRef.current,
                    },
                });
            }

            // Show error toast
            if (err instanceof VoteError) {
                if (err.errorCode === ErrorCode.VOTE_UNAUTHORIZED) {
                    toasts.voteUnauthorized();
                } else if (
                    err.errorCode === ErrorCode.VOTE_INSUFFICIENT_BALANCE
                ) {
                    toasts.voteInsufficientBalance();
                } else if (err.errorCode === ErrorCode.VOTE_DIRECTION_LOCKED) {
                    toasts.voteDirectionLocked();
                } else if (err.errorCode === ErrorCode.VOTE_AMOUNT_EXCEEDED) {
                    toasts.voteAmountExceeded();
                } else {
                    toasts.voteFailed(err.message);
                }
            } else {
                toasts.voteFailed();
            }
        },

        onSettled: () => {
            startBalanceRef.current = null;
            // Refetch to ensure we're in sync with server
            queryClient.invalidateQueries({ queryKey: ['votes', plot.id] });
            queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        },
    });

    const canAddVote = useCallback(
        (voteType: VoteType): boolean => {
            const currentUser = store.getSnapshot().context.user;
            if (!currentUser) return false;

            const serverVote = userVote;
            const currentTotal =
                (serverVote?.total ?? 0) + pendingVotesRef.current;

            // Check vote direction lock
            if (serverVote?.vote_type && serverVote.vote_type !== voteType) {
                return false;
            }

            // Check max votes
            if (currentTotal >= 100) {
                return false;
            }

            // Check balance (account for pending votes)
            if (currentUser.balance <= 0) {
                return false;
            }

            return true;
        },
        [userVote],
    );

    const addPendingVote = useCallback(
        (voteType: VoteType): boolean => {
            if (!canAddVote(voteType)) {
                return false;
            }

            pendingVotesRef.current += 1;
            setPendingCount(pendingVotesRef.current);

            // Update balance optimistically
            const currentUser = store.getSnapshot().context.user;
            if (currentUser) {
                store.trigger.setUser({
                    user: {
                        ...currentUser,
                        balance: currentUser.balance - 1,
                    },
                });
            }

            return true;
        },
        [canAddVote],
    );

    const flushPendingVotes = useCallback(() => {
        const amount = pendingVotesRef.current;
        const voteType = holdVoteTypeRef.current;

        // Reset state
        pendingVotesRef.current = 0;
        holdVoteTypeRef.current = null;
        setPendingCount(0);

        // Send the batch if there are votes
        if (amount > 0 && voteType) {
            vote({ voteType, amount });
        }
    }, [vote]);

    const stopHold = useCallback(() => {
        if (holdTimeoutRef.current) {
            clearTimeout(holdTimeoutRef.current);
            holdTimeoutRef.current = null;
        }
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }

        // Flush pending votes when hold ends
        flushPendingVotes();
    }, [flushPendingVotes]);

    const startHold = useCallback(
        (voteType: VoteType) => {
            // Store the starting balance for potential rollback
            const currentUser = store.getSnapshot().context.user;
            startBalanceRef.current = currentUser?.balance ?? null;
            holdVoteTypeRef.current = voteType;

            // Add first vote immediately
            if (!addPendingVote(voteType)) {
                // Show appropriate error
                const serverVote = userVote;
                if (
                    serverVote?.vote_type &&
                    serverVote.vote_type !== voteType
                ) {
                    toasts.voteDirectionLocked();
                } else if ((serverVote?.total ?? 0) >= 100) {
                    toasts.voteAmountExceeded();
                } else {
                    toasts.voteInsufficientBalance();
                }
                return;
            }

            // Start repeating after initial delay
            holdTimeoutRef.current = setTimeout(() => {
                holdIntervalRef.current = setInterval(() => {
                    if (!addPendingVote(voteType)) {
                        // Stop when we can't add more
                        if (holdIntervalRef.current) {
                            clearInterval(holdIntervalRef.current);
                            holdIntervalRef.current = null;
                        }
                    }
                }, HOLD_INTERVAL);
            }, HOLD_DELAY);
        },
        [addPendingVote, userVote],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, voteType: VoteType, disabled: boolean) => {
            if (disabled) return;
            // Ignore auto-repeated key events from holding the key
            if (e.repeat) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startHold(voteType);
            }
        },
        [startHold],
    );

    const handleKeyUp = useCallback(() => {
        stopHold();
    }, [stopHold]);

    const currentVoteType = userVote?.vote_type ?? null;
    const upvoteDisabled = currentVoteType === 'downvote';
    const downvoteDisabled = currentVoteType === 'upvote';

    // Display count includes pending votes
    const displayTotal = (userVote?.total ?? 0) + pendingCount;

    return (
        <div className="flex items-center space-x-[-1.5px]">
            <Button
                onPointerDown={() => !upvoteDisabled && startHold('upvote')}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onKeyDown={(e) => handleKeyDown(e, 'upvote', upvoteDisabled)}
                onKeyUp={handleKeyUp}
                disabled={upvoteDisabled}
                variant="outline"
                className={cn(
                    'w-12 select-none px-0',
                    (currentVoteType === 'upvote' ||
                        holdVoteTypeRef.current === 'upvote') &&
                        'bg-green-600 text-white',
                    upvoteDisabled && 'cursor-not-allowed opacity-50',
                )}
                title={
                    upvoteDisabled
                        ? "You've already downvoted this plot"
                        : 'Upvote (hold to repeat)'
                }
            >
                {currentVoteType === 'upvote' ||
                holdVoteTypeRef.current === 'upvote' ? (
                    <>
                        {displayTotal > 0 && (
                            <span className="ml-0.5">{displayTotal}</span>
                        )}
                        {displayTotal < 100 && (
                            <span className="text-lg leading-none">↑</span>
                        )}
                    </>
                ) : (
                    <>
                        <span className="text-lg leading-none">↑</span>
                    </>
                )}
            </Button>
            <div
                className={cn(
                    'flex h-8 items-center border-1.5 border-border bg-secondary px-2 py-1 text-sm text-primary',
                    'font-mono slashed-zero tabular-nums',
                )}
            >
                {plot.score ?? 0}
            </div>
            <Button
                onPointerDown={() => !downvoteDisabled && startHold('downvote')}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onKeyDown={(e) =>
                    handleKeyDown(e, 'downvote', downvoteDisabled)
                }
                onKeyUp={handleKeyUp}
                disabled={downvoteDisabled}
                className={cn(
                    'w-12 select-none px-0',
                    (currentVoteType === 'downvote' ||
                        holdVoteTypeRef.current === 'downvote') &&
                        'bg-red-600 text-white',
                    downvoteDisabled && 'cursor-not-allowed opacity-50',
                )}
                variant="outline"
                title={
                    downvoteDisabled
                        ? "You've already upvoted this plot"
                        : 'Downvote (hold to repeat)'
                }
            >
                {currentVoteType === 'downvote' ||
                holdVoteTypeRef.current === 'downvote' ? (
                    <>
                        {displayTotal > 0 && (
                            <span className="mr-0.5">{displayTotal}</span>
                        )}
                        {displayTotal < 100 && (
                            <span className="text-lg leading-none">↓</span>
                        )}
                    </>
                ) : (
                    <>
                        <span className="text-lg leading-none">↓</span>
                    </>
                )}
            </Button>
        </div>
    );
}
