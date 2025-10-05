import z from 'zod';

import { Camera, ZoomMultiplier, getZoomMultiplier } from '../camera';
import { CANVAS_PIXEL_RATIO } from '../constants';
import { AbsolutePointTuple, absolutePointTupleSchema } from '../line';

const pixelSizeSchema = z.number().brand<'PixelSize'>();
export type PixelSize = z.infer<typeof pixelSizeSchema>;

export function getPixelSize(zoomMultiplier: ZoomMultiplier): PixelSize {
    return pixelSizeSchema.parse(CANVAS_PIXEL_RATIO * zoomMultiplier);
}

export function getSizeInPixelsPlusBleed(length: number, pixelSize: PixelSize) {
    return Math.ceil(length / pixelSize) + 1;
}

/**
 * Gets the center point of the camera view in absolute coordinates
 */
export function getCameraCenterPoint(camera: Camera): AbsolutePointTuple {
    const zoomMultiplier = getZoomMultiplier(camera);
    const pixelSize = getPixelSize(zoomMultiplier);

    const canvasWidthPlusBleed = getSizeInPixelsPlusBleed(
        window.innerWidth,
        pixelSize,
    );
    const canvasHeightPlusBleed = getSizeInPixelsPlusBleed(
        window.innerHeight,
        pixelSize,
    );

    const centerX = camera.x + canvasWidthPlusBleed / 2;
    const centerY = camera.y + canvasHeightPlusBleed / 2;

    return absolutePointTupleSchema.parse([centerX, centerY]);
}
