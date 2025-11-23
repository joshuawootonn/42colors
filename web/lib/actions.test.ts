import { describe, expect, test } from 'vitest';

import {
    Action,
    Actions,
    derivePixelsFromActions,
    deriveUnsetPixelsFromActions,
    getActionToRedo,
    getActionToUndo,
    resolveActions,
    updateActionBasedOnRejectedPixels,
} from './actions';
import { Pixel } from './geometry/coord';
import { AbsolutePointTuple, absolutePointTupleSchema } from './line';
import { pointsToPixels } from './tools/brush/brush';
import { bunchOfPointsSchema } from './utils/testing';

const points1to3 = bunchOfPointsSchema.parse([
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
]);
const points4to6 = bunchOfPointsSchema.parse([
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 6, y: 6 },
]);

describe('actions', () => {
    test('brushing and undoing unsets pixels', () => {
        const arr: Action[] = [
            Actions.brush(points1to3, 1),
            Actions.brush(points4to6, 1),
            Actions.undo(),
        ];

        expect(derivePixelsFromActions(arr)).toEqual(
            pointsToPixels(points1to3, 1),
        );
        expect(deriveUnsetPixelsFromActions(arr)).toEqual(
            pointsToPixels(points4to6, 1),
        );
        expect(resolveActions(arr)).toEqual([Actions.brush(points1to3, 1)]);
    });

    test("brushing and undoing and redoing doesn't unset pixels", () => {
        const arr: Action[] = [
            Actions.brush(points1to3, 1),
            Actions.brush(points4to6, 1),
            Actions.undo(),
            Actions.redo(),
        ];

        expect(derivePixelsFromActions(arr)).toEqual([
            ...pointsToPixels(points1to3, 1),
            ...pointsToPixels(points4to6, 1),
        ]);
        expect(deriveUnsetPixelsFromActions(arr)).toEqual([]);
        expect(resolveActions(arr)).toEqual([
            Actions.brush(points1to3, 1),
            Actions.brush(points4to6, 1),
        ]);
    });

    describe('getActionToUndo', () => {
        test('happy path', () => {
            const arr: Action[] = [
                Actions.brush(points1to3, 1),
                Actions.brush(points4to6, 1),
                Actions.undo(),
            ];

            expect(getActionToUndo(arr)).toEqual(Actions.brush(points1to3, 1));
        });

        test('null when all actions are undone', () => {
            const arr: Action[] = [
                Actions.brush(points1to3, 1),
                Actions.brush(points4to6, 1),
                Actions.undo(),
                Actions.undo(),
            ];

            expect(getActionToUndo(arr)).toBeNull();
        });

        test('works through collapsed values', () => {
            const arr: Action[] = [
                Actions.brush(points1to3, 1),
                Actions.brush(points4to6, 1),
                Actions.undo(),
                Actions.redo(),
            ];

            expect(getActionToUndo(arr)).toEqual(Actions.brush(points4to6, 1));
        });
    });
    describe('getActionToRedo', () => {
        test('happy path', () => {
            const arr: Action[] = [
                Actions.brush(points1to3, 1),
                Actions.brush(points4to6, 1),
                Actions.undo(),
            ];

            expect(getActionToRedo(arr)).toEqual(Actions.brush(points4to6, 1));
        });

        test('null when all actions are undone', () => {
            const arr: Action[] = [
                Actions.brush(points1to3, 1),
                Actions.brush(points4to6, 1),
                Actions.undo(),
                Actions.undo(),
            ];

            expect(getActionToRedo(arr)).toEqual(Actions.brush(points1to3, 1));
        });

        test('works through collapsed values', () => {
            const arr: Action[] = [
                Actions.brush(points1to3, 1),
                Actions.brush(points4to6, 1),
                Actions.undo(),
                Actions.redo(),
            ];

            expect(getActionToRedo(arr)).toBeNull();
        });
    });

    describe('updateActionBasedOnRejectedPixels', () => {
        test('removes rejected pixels from brush action', () => {
            const action = Actions.brush(points1to3, 1);
            const otherAction = Actions.brush(points4to6, 2);
            const rejectedPixels: Pixel[] = [
                { x: 1, y: 1, color_ref: 1 } as Pixel,
            ];

            const updated = updateActionBasedOnRejectedPixels(
                [action, otherAction],
                rejectedPixels,
                action.action_id,
            );

            const updatedAction = updated[0];
            if (updatedAction.type !== 'brush-active')
                throw new Error('Wrong type');
            expect(updatedAction.points).toHaveLength(2);
            expect(updatedAction.points).toEqual([
                { x: 2, y: 2 },
                { x: 3, y: 3 },
            ]);
            expect(updated[1]).toEqual(otherAction);
        });

        test('removes rejected pixels from erasure action', () => {
            const action = Actions.erase(points1to3);
            const otherAction = Actions.erase(points4to6);
            const rejectedPixels: Pixel[] = [
                { x: 1, y: 1, color_ref: 1 } as Pixel,
            ];

            const updated = updateActionBasedOnRejectedPixels(
                [action, otherAction],
                rejectedPixels,
                action.action_id,
            );

            const updatedAction = updated[0];
            if (updatedAction.type !== 'erasure-active')
                throw new Error('Wrong type');
            expect(updatedAction.points).toHaveLength(2);
            expect(updatedAction.points).toEqual([
                { x: 2, y: 2 },
                { x: 3, y: 3 },
            ]);
            expect(updated[1]).toEqual(otherAction);
        });

        test('removes rejected pixels from line action', () => {
            const action = Actions.line(points1to3, 1);
            const otherAction = Actions.line(points4to6, 2);
            const rejectedPixels: Pixel[] = [
                { x: 1, y: 1, color_ref: 1 } as Pixel,
            ];

            const updated = updateActionBasedOnRejectedPixels(
                [action, otherAction],
                rejectedPixels,
                action.action_id,
            );

            const updatedAction = updated[0];
            if (updatedAction.type !== 'line-complete')
                throw new Error('Wrong type');
            expect(updatedAction.points).toHaveLength(2);
            expect(updatedAction.points).toEqual([
                { x: 2, y: 2 },
                { x: 3, y: 3 },
            ]);
            expect(updated[1]).toEqual(otherAction);
        });

        test('removes rejected pixels from bucket action', () => {
            // Note: bucket uses AbsolutePointTuple
            const points: AbsolutePointTuple[] = [
                absolutePointTupleSchema.parse([1, 1]),
                absolutePointTupleSchema.parse([2, 2]),
                absolutePointTupleSchema.parse([3, 3]),
            ];

            const action = Actions.bucket(points, 1);
            const otherAction = Actions.bucket(
                [
                    absolutePointTupleSchema.parse([4, 4]),
                    absolutePointTupleSchema.parse([5, 5]),
                ],
                2,
            );
            const rejectedPixels: Pixel[] = [
                { x: 1, y: 1, color_ref: 1 } as Pixel,
            ];

            const updated = updateActionBasedOnRejectedPixels(
                [action, otherAction],
                rejectedPixels,
                action.action_id,
            );

            const updatedAction = updated[0];
            if (updatedAction.type !== 'bucket-active')
                throw new Error('Wrong type');
            expect(updatedAction.points).toHaveLength(2);
            expect(updatedAction.points).toEqual([
                [2, 2],
                [3, 3],
            ]);
            expect(updated[1]).toEqual(otherAction);
        });

        test('ignores actions with different action_id', () => {
            const action = Actions.brush(points1to3, 1);
            const rejectedPixels: Pixel[] = [
                { x: 1, y: 1, color_ref: 1 } as Pixel,
            ];

            const updated = updateActionBasedOnRejectedPixels(
                [action],
                rejectedPixels,
                'different-id',
            );

            expect(updated[0]).toEqual(action);
        });
    });
});
