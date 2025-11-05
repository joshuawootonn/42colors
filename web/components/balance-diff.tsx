import { useMemo } from 'react';

import { ACTION_TYPES } from '@/lib/action-types';
import { getPolygonSize } from '@/lib/geometry/polygon';
import { store } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useSelector } from '@xstate/store/react';

import { AnimatedNumber } from './ui/animated-number';

export function BalanceDiff() {
    const user = useSelector(store, (state) => state.context.user);
    const activeClaimAction = useSelector(store, (state) => {
        const activeAction = state.context.activeAction;
        if (activeAction == null) return null;
        if (
            activeAction.type === ACTION_TYPES.CLAIMER_CREATE ||
            activeAction.type === ACTION_TYPES.CLAIMER_NEW_RECT_CREATE ||
            activeAction.type === ACTION_TYPES.CLAIMER_NEW_RECT_EDIT ||
            activeAction.type === ACTION_TYPES.CLAIMER_EDIT ||
            activeAction.type === ACTION_TYPES.CLAIMER_RESIZE_EDIT ||
            activeAction.type === ACTION_TYPES.CLAIMER_RESIZE_CREATE
        ) {
            return activeAction;
        }
        return null;
    });

    const size = useMemo(() => {
        if (activeClaimAction == null) return 0;

        const polygon = activeClaimAction.polygon;

        if (polygon == null) return 0;

        return getPolygonSize(polygon);
    }, [activeClaimAction]);

    if (user == null) return null;

    return (
        <span className={cn(user.balance - size < 0 && 'text-destructive')}>
            <AnimatedNumber value={user.balance} />
            {activeClaimAction != null && (
                <span>
                    -
                    <AnimatedNumber value={size} />
                </span>
            )}
        </span>
    );
}
