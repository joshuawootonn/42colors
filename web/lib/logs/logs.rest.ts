import { z } from 'zod';

import { store } from '@/lib/store';
import { isInitialStore } from '@/lib/utils/is-initial-store';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

// Base log schema
const baseLogSchema = z.object({
    id: z.number(),
    userId: z.number(),
    oldBalance: z.number(),
    newBalance: z.number(),
    logType: z.enum([
        'initial_grant',
        'bailout_grant',
        'daily_visit_grant',
        'fun_money_grant',
        'plot_created',
        'plot_updated',
        'plot_deleted',
    ]),
    plotId: z.number().nullable(),
    insertedAt: z.string(),
    updatedAt: z.string(),
    plot: z
        .object({
            id: z.number(),
            name: z.string(),
            description: z.string().nullable(),
        })
        .nullable(),
});

const initialGrantLogSchema = baseLogSchema.extend({
    logType: z.literal('initial_grant'),
    diffs: z
        .object({
            reason: z.string().optional(),
            amount: z.number().optional(),
        })
        .nullable(),
});

const bailoutGrantLogSchema = baseLogSchema.extend({
    logType: z.literal('bailout_grant'),
    diffs: z
        .object({
            reason: z.string().optional(),
            amount: z.number().optional(),
        })
        .nullable(),
});

const dailyVisitGrantLogSchema = baseLogSchema.extend({
    logType: z.literal('daily_visit_grant'),
    diffs: z
        .object({
            reason: z.string().optional(),
            grant_amount: z.number().optional(),
            date: z.string().optional(),
        })
        .nullable(),
});

const funMoneyGrantLogSchema = baseLogSchema.extend({
    logType: z.literal('fun_money_grant'),
    diffs: z
        .object({
            reason: z.string().optional(),
            grant_amount: z.number().optional(),
            granted_by: z.string().optional(),
            granted_at: z.string().optional(),
        })
        .nullable(),
});

const plotCreatedLogSchema = baseLogSchema.extend({
    logType: z.literal('plot_created'),
    diffs: z
        .object({
            plotName: z.string().optional(),
            cost: z.number().optional(),
        })
        .nullable(),
});

const plotUpdatedLogSchema = baseLogSchema.extend({
    logType: z.literal('plot_updated'),
    diffs: z
        .object({
            nameChanged: z.boolean().optional(),
            descriptionChanged: z.boolean().optional(),
            oldName: z.string().optional(),
            newName: z.string().optional(),
            oldDescription: z.string().optional(),
            newDescription: z.string().optional(),
            polygonPixelCountChanged: z.boolean().optional(),
            oldPolygonPixelCount: z.number().optional(),
            newPolygonPixelCount: z.number().optional(),
        })
        .nullable(),
});

const plotDeletedLogSchema = baseLogSchema.extend({
    logType: z.literal('plot_deleted'),
    diffs: z
        .object({
            plotName: z.string().optional(),
            refund: z.number().optional(),
        })
        .nullable(),
});

// Union type for all log types
export const logSchema = z.discriminatedUnion('logType', [
    initialGrantLogSchema,
    bailoutGrantLogSchema,
    dailyVisitGrantLogSchema,
    funMoneyGrantLogSchema,
    plotCreatedLogSchema,
    plotUpdatedLogSchema,
    plotDeletedLogSchema,
]);

export const arrayLogResponseSchema = z.object({
    data: z.array(logSchema),
});

export type Log = z.infer<typeof logSchema>;
export type InitialGrantLog = z.infer<typeof initialGrantLogSchema>;
export type BailoutGrantLog = z.infer<typeof bailoutGrantLogSchema>;
export type PlotCreatedLog = z.infer<typeof plotCreatedLogSchema>;
export type PlotUpdatedLog = z.infer<typeof plotUpdatedLogSchema>;
export type PlotDeletedLog = z.infer<typeof plotDeletedLogSchema>;

export async function getUserLogs(limit: number = 20): Promise<Log[]> {
    const context = store.getSnapshot().context;
    if (isInitialStore(context)) {
        throw new Error('Server context is not initialized');
    }

    const search = new URLSearchParams();
    search.set('limit', limit.toString());

    const response = await fetch(
        new URL(`/api/logs/me?${search}`, context.server.apiOrigin),
        {
            method: 'GET',
            credentials: 'include',
        },
    );

    if (!response.ok) {
        throw new Error('Failed to fetch user logs');
    }

    const json = await response.json();

    return arrayLogResponseSchema.parse(json).data;
}

export function useLogs(
    limit: number = 20,
    queryOptions?: Omit<UseQueryOptions<Log[], Error>, 'queryKey' | 'queryFn'>,
) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', 'logs'],
        queryFn: () => getUserLogs(limit),
        ...queryOptions,
    });

    return { data, isLoading, error };
}
