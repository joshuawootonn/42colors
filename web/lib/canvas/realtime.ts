import {
    derivePixelsFromActions,
    deriveUnsetPixelsFromActions,
} from '../actions';
import { Camera, getZoomMultiplier } from '../camera';
import { Pixel } from '../geometry/coord';
import { InitializedStore } from '../store';
import { dedupeCoords } from '../utils/dedupe-coords';
import { isInitialStore } from '../utils/is-initial-store';
import { getPixelSize, getSizeInPixelsPlusBleed } from './canvas';
import { getUniqueChunksFromPixels } from './chunk';

export function createRealtimeCanvas(camera: Camera) {
    const canvas = document.createElement('canvas');
    resizeRealtimeCanvas(canvas, camera);
    return canvas;
}

export function resizeRealtimeCanvas(
    canvas: HTMLCanvasElement,
    camera: Camera,
) {
    const pixelSize = getPixelSize(getZoomMultiplier(camera));

    canvas.width = getSizeInPixelsPlusBleed(window.innerWidth, pixelSize);
    canvas.height = getSizeInPixelsPlusBleed(window.innerHeight, pixelSize);
    return canvas;
}

type RealtimeCache = {
    actionsLength: number;
    hasActiveAction: boolean;
    cachedPixels: Pixel[];
    cachedUnsetPixels: Pixel[];
    cachedDedupedPixels: Pixel[];
    actionsHash: number;
    contextId: string;
};

const cache = new Map<string, RealtimeCache>();
const MAX_CACHE_SIZE = 10;

function getActionsHash(actions: unknown[]): number {
    let hash = actions.length;
    // Hash the first 100 actions
    for (let i = 0; i < Math.min(actions.length, 100); i++) {
        const action = actions[i] as { type?: string };
        const typeHash =
            action?.type?.split('').reduce((acc, char) => {
                return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
            }, 0) ?? 0;
        hash = ((hash << 5) - hash + typeHash + i) | 0;
    }
    // Always include the last action in the hash (which is activeAction if present)
    if (actions.length > 0) {
        const lastAction = actions[actions.length - 1] as {
            type?: string;
            points?: unknown[];
        };
        const lastTypeHash =
            lastAction?.type?.split('').reduce((acc, char) => {
                return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
            }, 0) ?? 0;
        // Include points length to detect when activeAction changes
        const pointsLength = Array.isArray(lastAction?.points)
            ? lastAction.points.length
            : 0;
        hash = ((hash << 5) - hash + lastTypeHash + pointsLength) | 0;
    }
    return hash;
}

function getCacheKey(contextId: string, actionsHash: number): string {
    return `${contextId}:${actionsHash}`;
}

export function getCachedPixelsFromActions(context: InitializedStore): {
    pixels: Pixel[];
    unsetPixels: Pixel[];
    dedupedPixels: Pixel[];
} {
    const actions = context.activeAction
        ? context.actions.concat(context.activeAction)
        : context.actions;

    const hasActiveAction = context.activeAction !== null;
    const actionsLength = actions.length;
    const actionsHash = getActionsHash(actions);
    const cacheKey = getCacheKey(context.id, actionsHash);

    const existingCache = cache.get(cacheKey);

    // Never use cache when there's an active action - it changes every frame during dragging
    if (
        !hasActiveAction &&
        existingCache &&
        existingCache.actionsLength === actionsLength &&
        existingCache.hasActiveAction === hasActiveAction &&
        existingCache.actionsHash === actionsHash &&
        existingCache.contextId === context.id
    ) {
        return {
            pixels: existingCache.cachedPixels,
            unsetPixels: existingCache.cachedUnsetPixels,
            dedupedPixels: existingCache.cachedDedupedPixels,
        };
    }

    const pixels = derivePixelsFromActions(actions);
    const unsetPixels = deriveUnsetPixelsFromActions(actions);
    const dedupedPixels = dedupeCoords(pixels);

    // Only cache when there's no active action (user is not currently drawing)
    if (!hasActiveAction) {
        const newCache: RealtimeCache = {
            actionsLength,
            hasActiveAction,
            cachedPixels: pixels,
            cachedUnsetPixels: unsetPixels,
            cachedDedupedPixels: dedupedPixels,
            actionsHash,
            contextId: context.id,
        };

        cache.set(cacheKey, newCache);

        if (cache.size > MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value;
            if (firstKey) {
                cache.delete(firstKey);
            }
        }
    }

    return {
        pixels,
        unsetPixels,
        dedupedPixels,
    };
}
