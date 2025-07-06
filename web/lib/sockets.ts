import { Channel, Socket } from 'phoenix';
import { z } from 'zod';

import { toast } from '@/components/ui/toast';

import { ErrorCode } from './error-codes';
import { Pixel, pixelSchema } from './geometry/coord';
import { colorRefSchema } from './palette';
import { InitializedStore, store } from './store';
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
            if (resp === ErrorCode.UNAUTHED_USER) {
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

    return channel;
}
