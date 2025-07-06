import { describe, expect, test } from 'vitest';

import { chunk } from './chunk';

describe('chunk', () => {
    test('happy path', () => {
        const arr = [1, 2, 3, 4];

        expect(chunk(arr, 2)).toEqual([
            [1, 2],
            [3, 4],
        ]);
    });

    test('what happens to extra extra', () => {
        const arr = [1, 2, 3, 4, 5];

        expect(chunk(arr, 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
});
