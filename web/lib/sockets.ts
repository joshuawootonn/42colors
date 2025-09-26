import { Channel, Socket } from 'phoenix';
import { z } from 'zod';

import { toast } from '@/components/ui/toast';

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
        z.object({ x: z.number(), y: z.number(), color: colorRefSchema }),
    ),
    store_id: z.string(),
});

type NewPixelResponse = z.infer<typeof newPixelResponseSchema>;

const pixelsSchema = z.array(pixelSchema);

const newPixelResponseToPixelSchmea = newPixelResponseSchema.transform(
    (response) =>
        pixelsSchema.parse(
            response.pixels.map((pixel) => ({
                ...pixel,
                colorRef: pixel.color,
            })),
        ),
);

export type PixelResponse = z.infer<typeof newPixelResponseSchema>;

const errorResponses = z.union([
    z.object({
        error_code: z.literal(ErrorCode.PROHIBITED_PIXELS),
        message: z.string(),
        plot_ids: z.array(z.number()),
    }),
    z.literal(ErrorCode.UNAUTHED_USER),
]);

export function newPixels(context: InitializedStore, pixels: Pixel[]) {
    if (isInitialStore(context)) return;
    const authURL = context.server.authURL;

    if (context.server.channel == null || pixels.length === 0) return;

    context.server.channel
        .push('new_pixels', {
            pixels: pixels.map((pixel) => ({
                x: pixel.x,
                y: pixel.y,
                color: pixel.colorRef,
            })),
            store_id: context.id,
        })
        .receive('error', (resp) => {
            const response = errorResponses.safeParse(resp);

            if (!response.success) return;

            if (response.data === ErrorCode.UNAUTHED_USER) {
                toast({
                    title: 'Login (when you are ready)',
                    description: 'to save and share your pixels.',
                    button: authURL
                        ? {
                              label: 'login',
                              onClick: () => {
                                  window.location.href = authURL;
                              },
                          }
                        : undefined,
                });
                return;
            }

            if (response.data.error_code === ErrorCode.PROHIBITED_PIXELS) {
                toast({
                    title: "You can't draw here",
                    description: "it's someone else's plot",
                });
            }
        });
}

export function setupChannel(socket: Socket): Channel {
    const channel = socket.channel('region:general', {});
    channel
        .join()
        .receive('ok', (resp: unknown) => {
            console.log('Joined successfully', resp);
        })
        .receive('error', (resp: unknown) => {
            console.log('Unable to join', resp);
        });

    channel.on('new_pixels', (payload: NewPixelResponse) => {
        if (payload.store_id === store.getSnapshot().context.id) {
            console.log(`skipping realtime since they came from this store`);
            return;
        }
        store.trigger.newRealtimePixels({
            pixels: newPixelResponseToPixelSchmea.parse(payload),
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

                store.trigger.addPlots({ chunkKey, plots: [localPlot] });
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

                store.trigger.removePlots({ chunkKey, plotIds: [plot.id] });

                const localPlot: Plot = {
                    ...plot,
                    polygon: polygonSchema.parse({
                        vertices: plot.polygon.vertices.map((vertex) => [
                            vertex[0] - chunkX,
                            vertex[1] - chunkY,
                        ]),
                    }),
                };

                store.trigger.addPlots({ chunkKey, plots: [localPlot] });
            });
        },
    );

    channel.on(
        'delete_plot',
        (payload: { plot_id: number; chunk_keys: string[] }) => {
            const { plot_id, chunk_keys } = payload;
            if (!chunk_keys) return;

            chunk_keys.forEach((chunkKey) => {
                store.trigger.removePlots({ chunkKey, plotIds: [plot_id] });
            });
        },
    );

    return channel;
}
