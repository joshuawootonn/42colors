import { z } from 'zod';

import { ZOOM_DEFAULT } from './constants';

export const cameraSchema = z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
});
export type Camera = { x: number; y: number; zoom: number };

const zoomMultiplierSchema = z.number().brand<'ZoomMultiplier'>();
export type ZoomMultiplier = z.infer<typeof zoomMultiplierSchema>;

export function getZoomMultiplier(camera: Camera): ZoomMultiplier {
    return zoomMultiplierSchema.parse(camera.zoom / ZOOM_DEFAULT);
}
