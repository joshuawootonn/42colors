import { InitializedStore, InitialStore, Store, WebGPUFailedStore } from '../store';

export function isInitialStore(
    context: Store,
): context is InitialStore | WebGPUFailedStore {
    const is = context.state === 'initial' || context.state === 'webgpu-failed';

    if (is) console.warn('Attempted action on uninitialized state');

    return is;
}

export function isInitializedStore(
    context: Store,
): context is InitializedStore {
    return context.state === 'initialized';
}