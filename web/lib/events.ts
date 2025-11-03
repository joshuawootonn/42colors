import { createAtom } from '@xstate/store';

import { store } from './store';

export const isScrollingAtom = createAtom<boolean>(false);

let scrollTimeoutRef: NodeJS.Timeout | null = null;

export function onGesture(e: Event) {
    // console.log("gesture", e);
    e.preventDefault();
}

export function onTouch(e: TouchEvent) {
    // console.log("touch", e.touches);
    e.preventDefault();
}

export function onResize() {
    store.trigger.onResize();
}

export function onWheel(e: WheelEvent) {
    // `preventDefault` in the store is in the next tick and doesn't work.
    // I have to actually call preventDefault here.
    e.preventDefault();

    // Set scrolling state
    isScrollingAtom.set(true);

    if (scrollTimeoutRef) {
        clearTimeout(scrollTimeoutRef);
    }

    scrollTimeoutRef = setTimeout(() => {
        isScrollingAtom.set(false);
    }, 150);

    store.trigger.onWheel({ e });
}

export function onKeyDown(e: KeyboardEvent) {
    // console.log("onKeyDown");
    store.trigger.onKeyDown({ e });
}

export function onKeyUp(e: KeyboardEvent) {
    // console.log("onKeyUp");
    store.trigger.onKeyUp({ e });
}

export function onPointerMove(e: PointerEvent) {
    // console.log("onPointerMove");
    store.trigger.onPointerMove({ e });
}

export function onPointerUp(e: PointerEvent) {
    // console.log("onPointerUp");

    // Release pointer capture when interaction ends
    if (e.target instanceof HTMLCanvasElement) {
        e.target.releasePointerCapture(e.pointerId);
    }

    store.trigger.onPointerUp({ e });
}

export function onPointerOut(e: PointerEvent) {
    // console.log("onPointerOut");

    // Release pointer capture if pointer goes out of canvas bounds
    if (e.target instanceof HTMLCanvasElement) {
        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch {
            // Ignore errors if capture wasn't set
        }
    }

    store.trigger.onPointerOut({ e });
}

export function onPointerDown(e: PointerEvent) {
    // console.log("onPointerDown");

    // Capture pointer events to ensure they continue to be received
    // even when the pointer moves over popovers or other UI elements
    if (e.target instanceof HTMLCanvasElement) {
        e.target.setPointerCapture(e.pointerId);
    }

    store.trigger.onPointerDown({ e });
}

export function onContextMenu(e: MouseEvent) {
    e.preventDefault();
}
