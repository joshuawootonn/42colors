import { useMemo } from 'react';

import { ACTION_TYPES } from '@/lib/action-types';
import {
    getCompositePolygons,
    getPolygonSize,
    rectToPolygonSchema,
} from '@/lib/geometry/polygon';
import { store } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useSelector } from '@xstate/store/react';

import { AnimatedNumber } from './ui/animated-number';

export function BalanceDiff() {
    const user = useSelector(store, (state) => state.context.user);
    const activeClaimAction = useSelector(store, (state) => {
        const activeAction = state.context.activeAction;
        if (activeAction?.type !== ACTION_TYPES.CLAIMER_CREATE) return null;
        return activeAction;
    });

    const size = useMemo(() => {
        if (activeClaimAction == null) return 0;
        const polygons = getCompositePolygons(
            [...activeClaimAction.rects, activeClaimAction.nextRect]
                .filter(Boolean)
                .map((rect) => rectToPolygonSchema.parse(rect)),
        );

        return polygons.reduce(
            (acc, polygon) => acc + getPolygonSize(polygon),
            0,
        );
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
