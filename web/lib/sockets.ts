import { Channel, Socket } from 'phoenix';
import { z } from 'zod';

import { toasts } from '@/components/ui/toast';

import { isAdminUser } from './admin';
import { startRejectedPlotsAnimation } from './canvas/ui';
import { ErrorCode } from './error-codes';
import { Pixel, pixelSchema } from './geometry/coord';
import { polygonSchema } from './geometry/polygon';
import { colorRefSchema } from './palette';
import { InitializedStore, store } from './store';
import { Plot } from './tools/claimer/claimer.rest';
import { isInitialStore } from './utils/is-initial-store';

export function setupSocketConnection(
    apiWebsocketOrigin: string,
    token?: string,
): Socket {
    const socket = new Socket(new URL('/socket', apiWebsocketOrigin).href, {
        params: { token: token ?? null },
    });
    socket.connect();

    return socket;
}

export const newPixelResponseSchema = z.object({
    pixels: z.array(
        z.object({ x: z.number(), y: z.number(), color_ref: colorRefSchema }),
    ),
    store_id: z.string(),
});

type NewPixelResponse = z.infer<typeof newPixelResponseSchema>;

const pixelsSchema = z.array(pixelSchema);

const errorResponses = z.union([
    z.object({
        error_code: z.literal(ErrorCode.PROHIBITED_PIXELS),
        action_id: z.string(),
        rejected_pixels: pixelsSchema,
        rejected_plot_ids: z.array(z.number()),
        message: z.string(),
    }),
    z.literal(ErrorCode.UNAUTHED_USER),
]);

export function newPixels(
    context: InitializedStore,
    pixels: Pixel[],
    action_id?: string,
) {
    if (isInitialStore(context)) return;
    const authURL = context.server.authURL;

    if (context.server.channel == null || pixels.length === 0) return;

    const adminOverride =
        isAdminUser(context.user) &&
        context.adminSettings.isAdminCanvasEditingEnabled;

    context.server.channel
        .push('new_pixels', {
            pixels,
            store_id: context.id,
            action_id,
            admin_override: adminOverride,
        })
        .receive('error', (resp) => {
            const response = errorResponses.safeParse(resp);

            if (!response.success) return;

            if (response.data === ErrorCode.UNAUTHED_USER) {
                if (!authURL) return;
                toasts.loginToSavePixels({
                    label: 'login',
                    onClick: () => {
                        window.location.href = authURL;
                    },
                });
                return;
            }

            if (response.data.error_code === ErrorCode.PROHIBITED_PIXELS) {
                store.trigger.filterPixelsFromActions({
                    action_id: response.data.action_id,
                    rejected_pixels: response.data.rejected_pixels,
                });

                startRejectedPlotsAnimation(response.data.rejected_plot_ids);

                toasts.cannotDrawOnPlot();
                return;
            }
        });
}

const pixelResponseSchema = z.object({
    pixels: pixelsSchema,
});

export function setupChannel(socket: Socket): Channel {
    const channel = socket.channel('region:general', {});
    channel
        .join()
        .receive('ok', (resp: unknown) => {
            console.debug('Joined successfully', resp);
        })
        .receive('error', (resp: unknown) => {
            console.error('Unable to join', resp);
        });

    channel.on('new_pixels', (payload: NewPixelResponse) => {
        if (payload.store_id === store.getSnapshot().context.id) {
            console.debug(`skipping realtime since they came from this store`);
            return;
        }

        const response = pixelResponseSchema.safeParse(payload);
        if (!response.success) return;

        store.trigger.newRealtimePixels({
            pixels: response.data.pixels,
        });
    });

    channel.on(
        'create_plot',
        (payload: { plot: Plot; chunk_keys: string[] }) => {
            const { plot, chunk_keys } = payload;
            if (!plot.polygon?.vertices || !chunk_keys) return;

            chunk_keys.forEach((chunkKey) => {
                const match = chunkKey.match(/x: (-?\d+) y: (-?\d+)/);
                if (!match) return;

                const chunkX = parseInt(match[1]);
                const chunkY = parseInt(match[2]);

                const localPlot: Plot = {
                    ...plot,
                    polygon: polygonSchema.parse({
                        vertices: plot.polygon.vertices.map((vertex) => [
                            vertex[0] - chunkX,
                            vertex[1] - chunkY,
                        ]),
                    }),
                };

                store.trigger.chunkOp({
                    chunkKey,
                    operation: (chunk) => {
                        chunk.upsertPlots([localPlot]);
                    },
                });
            });
        },
    );

    channel.on(
        'update_plot',
        (payload: { plot: Plot; chunk_keys: string[] }) => {
            const { plot, chunk_keys } = payload;
            if (!plot.polygon?.vertices || !chunk_keys) return;

            chunk_keys.forEach((chunkKey) => {
                const match = chunkKey.match(/x: (-?\d+) y: (-?\d+)/);
                if (!match) return;

                const chunkX = parseInt(match[1]);
                const chunkY = parseInt(match[2]);

                const localPlot: Plot = {
                    ...plot,
                    polygon: polygonSchema.parse({
                        vertices: plot.polygon.vertices.map((vertex) => [
                            vertex[0] - chunkX,
                            vertex[1] - chunkY,
                        ]),
                    }),
                };

                store.trigger.chunkOp({
                    chunkKey,
                    operation: (chunk) => {
                        chunk.upsertPlots([localPlot]);
                    },
                });
            });
        },
    );

    channel.on(
        'delete_plot',
        (payload: { plot_id: number; chunk_keys: string[] }) => {
            const { plot_id, chunk_keys } = payload;
            if (!chunk_keys) return;

            chunk_keys.forEach((chunkKey) => {
                store.trigger.chunkOp({
                    chunkKey,
                    operation: (chunk) => {
                        chunk.deletePlots([plot_id]);
                    },
                });
            });
        },
    );

    return channel;
}
