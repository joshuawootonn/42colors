'use client';

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
    castVote,
    getUserVoteOnPlot,
} from './vote.rest';

type VoteButtonsProps = {
    plot: Plot;
};

export function VoteButton({ plot }: VoteButtonsProps) {
    const queryClient = useQueryClient();
    const user = useSelector(store, (state) => state.context.user);

    const { data: userVote } = useQuery({
        queryKey: ['votes', plot.id],
        queryFn: () => getUserVoteOnPlot(plot.id),
        enabled: !!user,
        staleTime: 30000,
    });

    const { mutate: vote, isPending } = useMutation({
        mutationFn: () => castVote(plot.id),

        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['votes', plot.id] });
            await queryClient.cancelQueries({ queryKey: ['plots', plot.id] });

            const previousVote = queryClient.getQueryData<UserVoteResponse>([
                'votes',
                plot.id,
            ]);
            const previousPlot = queryClient.getQueryData<Plot>([
                'plots',
                plot.id,
            ]);

            queryClient.setQueryData<UserVoteResponse>(
                ['votes', plot.id],
                () => ({ has_voted: true }),
            );
            if (previousPlot != null)
                queryClient.setQueryData<Plot>(['plots', plot.id], () => ({
                    ...previousPlot,
                    score: previousPlot.score + 1,
                }));

            return { previousVote, previousPlot };
        },

        onError: (err, _, context) => {
            if (context?.previousVote) {
                queryClient.setQueryData(
                    ['votes', plot.id],
                    context.previousVote,
                );
            }
            if (context?.previousPlot) {
                queryClient.setQueryData(
                    ['plots', plot.id],
                    context.previousPlot,
                );
            }

            if (err instanceof VoteError) {
                if (err.errorCode === ErrorCode.VOTE_UNAUTHORIZED) {
                    toasts.voteUnauthorized();
                } else if (err.errorCode === ErrorCode.ALREADY_VOTED) {
                    toasts.alreadyVoted();
                } else {
                    toasts.voteFailed(err.message);
                }
            } else {
                toasts.voteFailed();
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['votes', plot.id] });
            queryClient.invalidateQueries({ queryKey: ['plots', plot.id] });
        },
    });

    const hasVoted = userVote?.has_voted ?? false;

    return (
        <div className="flex items-center space-x-[-1.5px]">
            <Button
                onClick={() => !hasVoted && vote()}
                disabled={hasVoted || isPending}
                variant="outline"
                className={cn(
                    'w-8 select-none px-2',
                    hasVoted && 'bg-green-600 text-white',
                    (hasVoted || isPending) && 'cursor-not-allowed',
                )}
                title={
                    hasVoted ? "You've already voted on this plot" : 'Upvote'
                }
            >
                {!hasVoted ? (
                    <span className="text-lg leading-none">↑</span>
                ) : (
                    <span>{plot.score ?? 0}</span>
                )}
            </Button>
        </div>
    );
}
