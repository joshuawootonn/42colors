import { describe, expect, test } from 'vitest';

import { Pixel, coordSort, pixelSchema } from '../geometry/coord';
import { newNewCoords } from './net-new-coords';

describe('net new pixels', () => {
    test('happy path', () => {
        const arr: Pixel[] = [
            pixelSchema.parse({ x: 1, y: 1, colorRef: 1 }),
            pixelSchema.parse({ x: 1, y: 2, colorRef: 0 }),
        ];

        const next: Pixel[] = [
            pixelSchema.parse({ x: 1, y: 2, colorRef: 0 }),
            pixelSchema.parse({ x: 2, y: 1, colorRef: 1 }),
            pixelSchema.parse({ x: 2, y: 2, colorRef: 1 }),
        ];

        expect(newNewCoords(arr, next).sort(coordSort)).toEqual(
            [
                pixelSchema.parse({ x: 2, y: 1, colorRef: 1 }),
                pixelSchema.parse({ x: 2, y: 2, colorRef: 1 }),
            ].sort(coordSort),
        );
    });
});
