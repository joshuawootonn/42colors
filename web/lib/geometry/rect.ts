import { z } from 'zod';

import { absolutePointSchema } from './coord';

export const rectSchema = z
    .object({ origin: absolutePointSchema, target: absolutePointSchema })
    .brand<'Rect'>();

export type Rect = z.infer<typeof rectSchema>;

/**
 * Calculates the area (size) of a rectangle.
 * The area is calculated as the absolute difference between the coordinates,
 * ensuring a positive result regardless of which corner is origin vs target.
 *
 * @param rect - The rectangle to calculate the area of
 * @returns The area of the rectangle as a positive number
 */
export function getRectSize(rect: Rect): number {
    const width = Math.abs(rect.target.x - rect.origin.x);
    const height = Math.abs(rect.target.y - rect.origin.y);
    return width * height;
}
